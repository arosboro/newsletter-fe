import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchRecords, Record } from '@/features/records/recordsSlice';
import { SubscriberList, SubscriptionRecord } from '@/features/subscriptions/subscriptionsSlice';
import {
  decode,
  decode_u8,
  decryptGroupMessage,
  decryptMessage,
  encryptGroupMessage,
  encryptMessage,
  generateGroupSymmetricKey,
  generateKeyPair,
  HexCipher,
  resolve,
} from '@/lib/util';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import init, { cantors_pairing } from 'newsletter_worker';
import { setPublicKey } from '../accounts/accountsSlice';
import { NewsletterProgramId } from '@/aleo/newsletter-program';
import { getMapping } from '@/aleo/rpc';

export interface NewsletterRecord {
  id: string;
  owner: string;
  program_id: string;
  spent: boolean;
  data: {
    id: string;
    op: string;
    member_sequence: string;
    base: string | boolean;
    revision: string | boolean;
    template: string[] | string | null;
    template_nonce: string[] | string;
    title: string[] | string | null;
    title_nonce: string[] | string;
    content: string[] | string | null;
    content_nonce: string[] | string;
    group_symmetric_key: string[] | string;
    individual_private_key: string[] | string;
  };
}

export interface DeliveryDraft {
  recipient: string;
  shared_public_key: string;
  title: HexCipher | string | null;
  template: HexCipher | string | null;
  content: HexCipher | string | null;
}

interface ExampleDraft {
  title: string | null;
  template: string | null;
  content: string | null;
}

export interface SharedIssueSecret {
  path: string[] | string;
  nonce: string[] | string;
}

interface NewsletterIssue {
  newsletter: NewsletterRecord;
  issues: DeliveryDraft[];
}

export type NewsletterState = {
  raw_records: { [key: string]: NewsletterRecord };
  list: { [key: string]: NewsletterRecord };
  encrypted: { [key: string]: NewsletterRecord };
  decrypted: { [key: string]: NewsletterRecord };
  newsletter: NewsletterRecord;
  draft_record: NewsletterRecord;
  draft_title: string;
  draft_template: string;
  draft_content: string;
  title: string | null;
  title_nonce: string;
  template: string | null;
  template_nonce: string;
  content: string | null;
  content_nonce: string;
  title_ciphertext: HexCipher;
  template_ciphertext: HexCipher;
  content_ciphertext: HexCipher;
  draft_mode: boolean;
  template_mode: boolean;
  privacy_mode: boolean;
  public_key: string | null;
  group_symmetric_key: string;
  individual_private_key: string;
  individual_public_key: string;
  selected_recipients: DeliveryDraft[];
  issues: DeliveryDraft[];
  status: 'uninitialized' | 'loading' | 'idle';
  error: string | undefined;
};

const initialState: NewsletterState = {
  raw_records: {},
  list: {},
  encrypted: {},
  decrypted: {},
  newsletter: {} as NewsletterRecord,
  draft_record: {} as NewsletterRecord,
  draft_title: '',
  draft_template: '',
  draft_content: '',
  title: '',
  title_nonce: '',
  template: '',
  template_nonce: '',
  content: '',
  content_nonce: '',
  title_ciphertext: { ciphertext: '', nonce: '' },
  template_ciphertext: { ciphertext: '', nonce: '' },
  content_ciphertext: { ciphertext: '', nonce: '' },
  draft_mode: false,
  template_mode: true,
  privacy_mode: false,
  public_key: null,
  group_symmetric_key: '',
  individual_private_key: '',
  individual_public_key: '',
  selected_recipients: [],
  issues: [],
  status: 'uninitialized',
  error: undefined,
};

export const processNewsletterData = (record: NewsletterRecord) => {
  const data = {
    ...record.data,
    id: BigInt((record.data.id as string).slice(0, -13)).toString(),
    op: (record.data.op as string).slice(0, -8),
    member_sequence: BigInt((record.data.member_sequence as string).slice(0, -13)).toString(),
    base: (record.data.base as string).slice(0, -8) === 'true',
    revision: (record.data.revision as string).slice(0, -8) === 'true',
    group_symmetric_key: record.data.group_symmetric_key as string,
    individual_private_key: record.data.individual_private_key as string,
  };
  return { ...record, data: data };
};

export const isNewsletterRecord = (
  record: NewsletterRecord | SubscriptionRecord | Record,
): record is NewsletterRecord => {
  return (record as NewsletterRecord).data.base !== undefined;
};

export const resolveNewsletterRecords = createAsyncThunk('newsletters/resolveRecords', async (records: Record[]) => {
  const newsletter_records: NewsletterRecord[] = records.filter((record: Record) => {
    return isNewsletterRecord(record);
  }) as NewsletterRecord[];
  const encrypted_records: NewsletterRecord[] = [];
  for (let i = 0; i < newsletter_records.length; i++) {
    const record = newsletter_records[i];
    if (record.data.template === null || record.data.title === null || record.data.content === null) {
      continue;
    }
    const template = await resolve(decode(record.data.template));
    const template_nonce = decode_u8(record.data.template_nonce);
    const title = await resolve(decode(record.data.title));
    const title_nonce = decode_u8(record.data.title_nonce);
    const content = await resolve(decode(record.data.content));
    const content_nonce = decode_u8(record.data.content_nonce);
    const group_symmetric_key = decode(record.data.group_symmetric_key);
    const individual_private_key = decode(record.data.individual_private_key);
    const data = {
      ...record.data,
      template: template,
      title: title,
      content: content,
      template_nonce: template_nonce,
      title_nonce: title_nonce,
      content_nonce: content_nonce,
      group_symmetric_key: group_symmetric_key,
      individual_private_key: individual_private_key,
    };
    encrypted_records.push({ ...record, data: data } as NewsletterRecord);
  }
  return encrypted_records;
});

export const decryptNewsletterRecords = createAsyncThunk(
  'newsletters/decryptRecords',
  async (records: NewsletterRecord[]) => {
    const decrypted_records: NewsletterRecord[] = [];
    records.forEach((record: NewsletterRecord) => {
      const group_symmetric_key: string = record.data.group_symmetric_key as string;
      if (record.data.template === null || record.data.title === null || record.data.content === null) {
        return;
      }
      if (
        typeof record.data.title !== 'string' ||
        typeof record.data.title_nonce !== 'string' ||
        typeof record.data.template !== 'string' ||
        typeof record.data.template_nonce !== 'string' ||
        typeof record.data.content !== 'string' ||
        typeof record.data.content_nonce !== 'string'
      ) {
        return;
      }
      const title: string | null = decryptGroupMessage(record.data.title, record.data.title_nonce, group_symmetric_key);
      const template: string | null = decryptGroupMessage(
        record.data.template,
        record.data.template_nonce as string,
        group_symmetric_key,
      );
      const content: string | null = decryptGroupMessage(
        record.data.content,
        record.data.content_nonce as string,
        group_symmetric_key,
      );
      const data = {
        ...record.data,
        title: title,
        template: template,
        content: content,
      };
      decrypted_records.push({ ...record, data: data } as NewsletterRecord);
    });
    return decrypted_records;
  },
);

export const fetchIssues = async (record: NewsletterRecord): Promise<SharedIssueSecret[]> => {
  const newsletter_id = record.data.id;
  const newsletter_id_field = `${newsletter_id}field`;
  const issue_sequence_field = await getMapping(
    'https://vm.aleo.org/api',
    NewsletterProgramId,
    'newsletter_issue_sequence',
    newsletter_id_field,
  );
  if (!issue_sequence_field || issue_sequence_field === 'null') {
    return [];
  }
  const issues: SharedIssueSecret[] = [];
  await init().then(async () => {
    const issue_sequence = BigInt(issue_sequence_field.slice(0, -5));
    // Fetch the issues of the newsletter one time:
    for (let j = 1n; j < BigInt(issue_sequence); j += 1n) {
      const current_issue_sequence = BigInt(j).toString();
      const issue_idx: string = cantors_pairing(`${newsletter_id_field}`, `${current_issue_sequence}field`);
      const issue_json = await getMapping(
        'https://vm.aleo.org/api',
        NewsletterProgramId,
        'newsletter_issues',
        issue_idx,
      );
      const issue_raw: SharedIssueSecret = JSON.parse(issue_json);
      const issue: SharedIssueSecret = {
        nonce: decode(issue_raw.nonce),
        path: decode(issue_raw.path),
      };
      issues.push(issue);
    }
  });
  return issues;
};

export const fetchExample = createAsyncThunk('newsletters/fetchExample', async () => {
  const data = import.meta.glob('@/assets/example-drafts.json', { as: 'raw', eager: true });
  const examples: ExampleDraft[] = JSON.parse(data['/src/assets/example-drafts.json']);
  const example: ExampleDraft = examples[Math.floor(Math.random() * examples.length)];
  return example;
});

// Include state below so it can be accessed:
export const setNewsletter = createAsyncThunk(
  'newsletters/setNewsletter',
  async (info: { newsletter: NewsletterRecord; subscribers: SubscriberList }): Promise<NewsletterIssue> => {
    const issues_init: SharedIssueSecret[] = await fetchIssues(info.newsletter);
    if (typeof issues_init == 'undefined') {
      return {
        newsletter: info.newsletter,
        issues: [],
      };
    }
    const decrypted_issues: DeliveryDraft[] = [];
    console.log(issues_init);

    for (const issue of issues_init) {
      const issue_cipher = await resolve(issue.path as string);
      const group_symmetric_key = info.newsletter.data.group_symmetric_key as string;
      const issue_decrypted = decryptGroupMessage(issue_cipher, issue.nonce as string, group_symmetric_key);
      if (issue_decrypted) {
        console.log(issue_decrypted);
        const issue_recipient = JSON.parse(issue_decrypted).filter(
          (item: any) => item.recipient === info.newsletter.owner,
        );
        if (issue_recipient.length >= 1 && Object.keys(info.subscribers).length >= 1) {
          const sender = Object.values(info.subscribers[info.newsletter.data.id]).filter(
            (subscriber) => subscriber.sequence === '1',
          );
          if (sender && Object.keys(sender).length >= 1) {
            const sender_public_key = sender[0].secret.shared_public_key as string;
            let title_decrypted: string | null = null;
            let template_decrypted: string | null = null;
            let content_decrypted: string | null = null;
            if (issue_recipient[0].title && issue_recipient[0].title.ciphertext && issue_recipient[0].title.nonce) {
              title_decrypted = decryptMessage(
                issue_recipient[0].title.ciphertext,
                issue_recipient[0].title.nonce,
                sender_public_key,
                info.newsletter.data.individual_private_key as string,
              );
            }
            if (
              issue_recipient[0].template &&
              issue_recipient[0].template.ciphertext &&
              issue_recipient[0].template.nonce
            ) {
              template_decrypted = decryptMessage(
                issue_recipient[0].template.ciphertext,
                issue_recipient[0].template.nonce,
                sender_public_key,
                info.newsletter.data.individual_private_key as string,
              );
            }
            if (
              issue_recipient[0].content &&
              issue_recipient[0].content.ciphertext &&
              issue_recipient[0].content.nonce
            ) {
              content_decrypted = decryptMessage(
                issue_recipient[0].content.ciphertext,
                issue_recipient[0].content.nonce,
                sender_public_key,
                info.newsletter.data.individual_private_key as string,
              );
            }
            if (title_decrypted && template_decrypted && content_decrypted) {
              const user_issue_decrypted: DeliveryDraft = {
                ...issue_recipient[0],
                title: title_decrypted,
                template: template_decrypted,
                content: content_decrypted,
              };
              decrypted_issues.push(user_issue_decrypted);
            }
          }
        }
      }
    }

    console.log(decrypted_issues);

    return {
      newsletter: info.newsletter,
      issues: decrypted_issues,
    };
  },
);

const newslettersSlice = createSlice({
  name: 'newsletters',
  initialState,
  reducers: {
    toggleTemplateMode: (state) => {
      state.template_mode = !state.template_mode;
    },
    togglePrivacyMode: (state) => {
      state.privacy_mode = !state.privacy_mode;
      if (state.privacy_mode) {
        state.list = state.encrypted;
      } else {
        state.list = state.decrypted;
      }
      if (state.newsletter && state.newsletter.id) {
        state.newsletter = state.list[state.newsletter.id];
        state.title = state.newsletter.data.title as string;
        state.template = state.newsletter.data.template as string;
        state.content = state.newsletter.data.content as string;
      } else {
        if (state.privacy_mode) {
          state.title = state.title_ciphertext.ciphertext;
          state.template = state.template_ciphertext.ciphertext;
          state.content = state.content_ciphertext.ciphertext;
        } else {
          state.title = decryptGroupMessage(
            state.title_ciphertext.ciphertext,
            state.title_ciphertext.nonce,
            state.group_symmetric_key,
          );
          state.template = decryptGroupMessage(
            state.template_ciphertext.ciphertext,
            state.template_ciphertext.nonce,
            state.group_symmetric_key,
          );
          state.content = decryptGroupMessage(
            state.content_ciphertext.ciphertext,
            state.content_ciphertext.nonce,
            state.group_symmetric_key,
          );
        }
      }
    },
    initDraft: (state) => {
      const individual_key_pair = generateKeyPair();
      state.newsletter = {} as NewsletterRecord;
      state.title = '';
      state.title_nonce = '';
      state.template = '';
      state.content = '';
      state.group_symmetric_key = generateGroupSymmetricKey();
      state.individual_private_key = individual_key_pair.privateKey;
      state.individual_public_key = individual_key_pair.publicKey;
      state.title_ciphertext = {} as HexCipher;
      state.template_ciphertext = {} as HexCipher;
      state.content_ciphertext = {} as HexCipher;
      state.selected_recipients = [];
    },
    setTitle: (state, action: PayloadAction<string>) => {
      if (!state.privacy_mode) {
        if (state.newsletter && state.newsletter.id) {
          state.draft_mode = true;
          state.draft_record = state.raw_records[state.newsletter.id];
          state.draft_title = action.payload;
          state.draft_template = state.template as string;
          state.draft_content = state.content as string;
        }
        state.title = action.payload;
        if (state.group_symmetric_key === '') {
          state.group_symmetric_key = generateGroupSymmetricKey();
        }
        state.title_ciphertext = encryptGroupMessage(action.payload, state.group_symmetric_key);
        state.title_nonce = state.title_ciphertext.nonce;
      }
    },
    setTemplate: (state, action: PayloadAction<string>) => {
      if (!state.privacy_mode) {
        if (state.newsletter && state.newsletter.id) {
          state.draft_mode = true;
          state.draft_record = state.raw_records[state.newsletter.id];
          state.draft_title = state.title as string;
          state.draft_template = action.payload as string;
          state.draft_content = state.content as string;
        }
        state.template = action.payload;
        if (state.group_symmetric_key === '') {
          state.group_symmetric_key = generateGroupSymmetricKey();
        }
        state.template_ciphertext = encryptGroupMessage(action.payload, state.group_symmetric_key);
        state.template_nonce = state.template_ciphertext.nonce;
      }
    },
    setContent: (state, action: PayloadAction<string>) => {
      if (!state.privacy_mode) {
        if (state.newsletter && state.newsletter.id) {
          state.draft_mode = true;
          state.draft_record = state.raw_records[state.newsletter.id];
          state.draft_title = state.title as string;
          state.draft_template = state.template as string;
          state.draft_content = action.payload as string;
        }
        state.content = action.payload;
        if (state.group_symmetric_key === '') {
          state.group_symmetric_key = generateGroupSymmetricKey();
        }
        state.content_ciphertext = encryptGroupMessage(action.payload, state.group_symmetric_key);
        state.content_nonce = state.content_ciphertext.nonce;
      }
    },
    setSelectedRecipients: (state, action: PayloadAction<DeliveryDraft[]>) => {
      state.selected_recipients = action.payload;
    },
    draftSelectedRecipients: (state) => {
      const new_drafts: DeliveryDraft[] = [];
      state.selected_recipients.forEach((recipient: DeliveryDraft) => {
        const shared_public_key = recipient.shared_public_key;
        const title = encryptMessage(state.title as string, state.individual_private_key, shared_public_key);
        const template = encryptMessage(state.template as string, state.individual_private_key, shared_public_key);
        const content = encryptMessage(state.content as string, state.individual_private_key, shared_public_key);
        const draft = {
          ...recipient,
          title,
          template,
          content,
        };
        new_drafts.push(draft);
      });
      state.selected_recipients = new_drafts;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecords.fulfilled, (state, action: PayloadAction<Record[]>) => {
        const newRecords: { [key: string]: NewsletterRecord } = {};
        action.payload.forEach((record: Record) => {
          if (isNewsletterRecord(record)) {
            newRecords[record.id] = record as NewsletterRecord;
          }
        });
        state.raw_records = newRecords;
      })
      .addCase(resolveNewsletterRecords.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(resolveNewsletterRecords.fulfilled, (state, action: PayloadAction<NewsletterRecord[]>) => {
        const newRecords: { [key: string]: NewsletterRecord } = {};
        action.payload.forEach((record) => {
          newRecords[record.id] = processNewsletterData(record);
        });
        state.encrypted = newRecords;
        if (state.privacy_mode) {
          state.list = state.encrypted;
        }
        state.status = 'idle';
      })
      .addCase(resolveNewsletterRecords.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.error.message;
      })
      .addCase(decryptNewsletterRecords.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(decryptNewsletterRecords.fulfilled, (state, action: PayloadAction<NewsletterRecord[]>) => {
        const newRecords: { [key: string]: NewsletterRecord } = {};
        action.payload.forEach((record) => {
          newRecords[record.id] = processNewsletterData(record);
        });
        if (!state.privacy_mode) {
          state.decrypted = newRecords;
          state.list = state.decrypted;
        }
        state.status = 'idle';
      })
      .addCase(decryptNewsletterRecords.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.error.message;
      })
      .addCase(setPublicKey, (state, action: PayloadAction<string>) => {
        state.public_key = action.payload;
      })
      .addCase(fetchExample.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchExample.fulfilled, (state, action: PayloadAction<ExampleDraft>) => {
        const example = action.payload;
        state.title = example.title;
        state.template = example.template;
        state.content = example.content;
        state.newsletter = {} as NewsletterRecord;
        state.group_symmetric_key = generateGroupSymmetricKey();
        const individual_private_key = generateKeyPair();
        state.individual_private_key = individual_private_key.privateKey;
        state.individual_public_key = individual_private_key.publicKey;
        state.title_ciphertext = encryptGroupMessage(state.title as string, state.group_symmetric_key);
        state.title_nonce = state.title_ciphertext.nonce;
        state.template_ciphertext = encryptGroupMessage(state.template as string, state.group_symmetric_key);
        state.template_nonce = state.template_ciphertext.nonce;
        state.content_ciphertext = encryptGroupMessage(state.content as string, state.group_symmetric_key);
        state.content_nonce = state.content_ciphertext.nonce;
        state.status = 'idle';
      })
      .addCase(fetchExample.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.error.message;
      })
      .addCase(setNewsletter.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(setNewsletter.fulfilled, (state, action: PayloadAction<NewsletterIssue>) => {
        state.newsletter = action.payload.newsletter;
        if (state.draft_mode && state.draft_record.id === action.payload.newsletter.id) {
          state.title = state.draft_title;
          state.template = state.draft_template;
          state.content = state.draft_content;
        } else {
          state.title = state.newsletter.data.title as string;
          state.template = state.newsletter.data.template as string;
          state.content = state.newsletter.data.content as string;
        }
        state.group_symmetric_key = state.newsletter.data.group_symmetric_key as string;
        state.title_ciphertext = encryptGroupMessage(state.title, state.group_symmetric_key);
        state.title_nonce = state.title_ciphertext.nonce;
        state.template_ciphertext = encryptGroupMessage(state.template, state.group_symmetric_key);
        state.template_nonce = state.template_ciphertext.nonce;
        state.content_ciphertext = encryptGroupMessage(state.content, state.group_symmetric_key);
        state.content_nonce = state.content_ciphertext.nonce;
        state.individual_private_key = state.newsletter.data.individual_private_key as string;
        if (state.individual_private_key === '') {
          const individual_key_pair = generateKeyPair();
          state.individual_private_key = individual_key_pair.privateKey;
          state.individual_public_key = individual_key_pair.publicKey;
        }
        state.selected_recipients = [];
        state.issues = action.payload.issues;
        state.status = 'idle';
      })
      .addCase(setNewsletter.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.error.message;
      });
  },
});

export const {
  toggleTemplateMode,
  togglePrivacyMode,
  initDraft,
  setTitle,
  setTemplate,
  setContent,
  setSelectedRecipients,
  draftSelectedRecipients,
} = newslettersSlice.actions;

const selectNewsletterList = (state: { newsletters: NewsletterState }) => state.newsletters.list;

export const selectTitleNonce = (state: { newsletters: NewsletterState }) => state.newsletters.title_nonce;

export const selectTemplateNonce = (state: { newsletters: NewsletterState }) => state.newsletters.template_nonce;

export const selectContentNonce = (state: { newsletters: NewsletterState }) => state.newsletters.content_nonce;

export const selectRawNewsletter = (state: { newsletters: NewsletterState }): NewsletterRecord =>
  state.newsletters.raw_records[state.newsletters.newsletter.id];

export const selectIsLoading = (state: { newsletters: NewsletterState }): boolean =>
  state.newsletters.status === 'loading';

export const selectTitle = (state: { newsletters: NewsletterState }): string => state.newsletters.title as string;

export const selectTemplate = (state: { newsletters: NewsletterState }): string => state.newsletters.template as string;

export const selectContent = (state: { newsletters: NewsletterState }): string => state.newsletters.content as string;

export const selectTitleCiphertext = (state: { newsletters: NewsletterState }): HexCipher =>
  state.newsletters.title_ciphertext;

export const selectTemplateCiphertext = (state: { newsletters: NewsletterState }): HexCipher =>
  state.newsletters.template_ciphertext;

export const selectContentCiphertext = (state: { newsletters: NewsletterState }): HexCipher =>
  state.newsletters.content_ciphertext;

export const selectTemplateMode = (state: { newsletters: NewsletterState }): boolean => state.newsletters.template_mode;

export const selectPrivacyMode = (state: { newsletters: NewsletterState }): boolean => state.newsletters.privacy_mode;

export const selectNewsletter = (state: { newsletters: NewsletterState }) => state.newsletters.newsletter;

export const selectUnspentNewsletters = createSelector(selectNewsletterList, (newsletter_list) => {
  return Object.values(newsletter_list).filter((record) => !record.spent);
});

export const selectSpentNewsletters = createSelector(selectNewsletterList, (newsletter_list) => {
  return Object.values(newsletter_list).filter((record) => record.spent);
});

// publicKey comes from the accountsSlice.ts.
// if data.op is not equal to the public key and data.base = true, then it is an invite.
const selectInvites = (state: { newsletters: NewsletterState }) => {
  const publicKey = state.newsletters.public_key;
  return Object.values(state.newsletters.list).filter((record) => {
    return !record.spent && record.data.op !== publicKey && record.data.base;
  });
};

export const selectUnspentInvites = createSelector(selectInvites, (invites) => {
  return invites.filter((record) => !record.spent);
});

export const selectIssues = (state: { newsletters: NewsletterState }) => state.newsletters.issues;

export const selectGroupSecret = (state: { newsletters: NewsletterState }) => state.newsletters.group_symmetric_key;

export const selectIndividualPrivateKey = (state: { newsletters: NewsletterState }) =>
  state.newsletters.individual_private_key;

export const selectIndividualPublicKey = (state: { newsletters: NewsletterState }) =>
  state.newsletters.individual_public_key;

export const selectRecipients = (state: { newsletters: NewsletterState }) => state.newsletters.selected_recipients;

export default newslettersSlice.reducer;
