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

/**
 * NewsletterRecord is the data structure that is stored in the newsletter program.
 * It contains the newsletter's title, template and content.  These are represented onchain and replaced
 * via processing in the client.  The title, template and content are encrypted with a group symmetric key.
 * Each NewsletterRecord holder has access to this group symmetric key.
 */
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

/**
 * DeliveryDraft is the data structure that is sent to the newsletter program.
 * It is the data structure that is used to create a newsletter issue.
 * It contains the recipient, keys and information needed to decrypt the newsletter's
 * title, template and content.  These are represented as HexCipher objects.
 */
export interface DeliveryDraft {
  recipient: string;
  shared_public_key: string;
  sender_public_key: string | string[];
  title: HexCipher | string | null;
  template: HexCipher | string | null;
  content: HexCipher | string | null;
}

/**
 * Example draft data:
 * {
 *  "title": "Example Title",
 * "template": "Example Template",
 * "content": "Example Content"
 * }
 */
interface ExampleDraft {
  title: string | null;
  template: string | null;
  content: string | null;
}

/**
 * SharedIssueSecret is the data structure that is stored in the newsletter program.
 * It contains the path and nonce of the newsletter issue.
 * The path is the path to the newsletter issue's data on IPFS.
 * The nonce is the nonce used to encrypt the newsletter issue's data with the group
 * symmetric key.
 */
export interface SharedIssueSecret {
  path: string[] | string;
  nonce: string[] | string;
}

/**
 * NewsletterIssue is the data structure that is returned from the newsletter program mappings.
 * It contains the newsletter record and the DeliveryDrafts after they have been recovered from
 * the encrypted JSON blob on IPFS. The DeliveryDrafts are the newsletter issues, which are
 * the newsletters that have been sent to the newsletter's subscribers.
 */
interface NewsletterIssue {
  newsletter: NewsletterRecord;
  issues: DeliveryDraft[];
}

/**
 * Represents the state structure stored in the newsletter program.
 * This structure encompasses various attributes of the newsletter, including its title, template, and content.
 * These attributes are maintained on-chain but processed client-side. They are encrypted using a group symmetric key,
 * which is accessible to all holders of the NewsletterRecord.
 * Additionally, the newsletter state includes the public key, individual private key, and individual public key.
 * These are employed to encrypt the title, template, and content specifically for each recipient.
 * Selected recipients indicate the users chosen to receive the newsletter.
 * The newsletter state records its sent issues, i.e., newsletters delivered to subscribers.
 * Other attributes encompass the newsletter's status, errors, draft mode, template mode, and privacy mode.
 * Details like draft title, draft template, and draft content are also included.
 * Nonces for title, template, and content, along with their corresponding ciphertexts, are part of the state.
 * Raw, encrypted, and decrypted records, as well as a display list for the UI, are maintained.
 */
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

/**
 * The initial state of the newsletter program.
 */
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

/**
 * Client side processing to arrive at usuable data for the UI.
 * @param record
 * @returns
 */
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

/**
 * Determine if a given Record is a NewsletterRecord.
 * @param record
 * @returns
 */
export const isNewsletterRecord = (
  record: NewsletterRecord | SubscriptionRecord | Record,
): record is NewsletterRecord => {
  return (record as NewsletterRecord).data.base !== undefined;
};

/**
 * Resolve the newsletter records from the newsletter program.  Fetch from IPFS.
 * @param records
 * @returns
 * encrypted_records: NewsletterRecord[]
 */
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

/**
 * Decrypt the newsletter records from the newsletter program.
 * @param records
 * @returns
 * decrypted_records: NewsletterRecord[]
 */
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

/**
 * Get issues from mappings in the newsletter program.
 * @param record
 * @returns
 * issues: SharedIssueSecret[]
 */
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
    for (let j = 0n; j < BigInt(issue_sequence); j += 1n) {
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

/**
 * Fetch example newsletter drafts from the client.
 * @returns
 * example: ExampleDraft
 */
export const fetchExample = createAsyncThunk('newsletters/fetchExample', async (): Promise<ExampleDraft> => {
  const data = import.meta.glob('@/assets/example-drafts.json', { as: 'raw', eager: true });
  const examples: ExampleDraft[] = JSON.parse(data['/src/assets/example-drafts.json']);
  const example: ExampleDraft = examples[Math.floor(Math.random() * examples.length)];
  return example;
});

/**
 * Set the newsletter record and its issues.
 * This occurs when the user interacts by choosing a newsletter.
 * @param info
 * @returns {
 * newsletter: NewsletterRecord,
 * issues: DeliveryDraft[],
 * }
 */
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

    for (const issue of issues_init) {
      const issue_cipher = await resolve(issue.path as string);
      const group_symmetric_key = info.newsletter.data.group_symmetric_key as string;
      const issue_decrypted = decryptGroupMessage(issue_cipher, issue.nonce as string, group_symmetric_key);
      if (issue_decrypted) {
        const issue_recipient = JSON.parse(issue_decrypted).filter(
          (item: any) => item.recipient === info.newsletter.owner,
        );
        if (issue_recipient.length >= 1) {
          const sender_public_key = issue_recipient[0].sender_public_key as string;
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
          if (issue_recipient[0].content && issue_recipient[0].content.ciphertext && issue_recipient[0].content.nonce) {
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
              sender_public_key: sender_public_key,
              title: title_decrypted,
              template: template_decrypted,
              content: content_decrypted,
            };
            decrypted_issues.push(user_issue_decrypted);
          }
        }
      }
    }

    return {
      newsletter: info.newsletter,
      issues: decrypted_issues,
    };
  },
);

/**
 * The newsletter slice of the Redux store.
 * This slice encompasses the newsletter state, including its attributes and methods.
 * The newsletter state is initialized with the initial state.
 * The newsletter slice includes reducers for toggling the template mode and privacy mode.
 * It also includes reducers for initializing a draft, setting the title, template, and content,
 * and setting the selected recipients.
 * The newsletter slice includes extra reducers for fetching records, resolving newsletter records,
 * decrypting newsletter records, setting the public key, fetching example newsletter drafts,
 * and setting the newsletter.
 * The newsletter slice includes selectors for selecting the newsletter list, title nonce,
 * template nonce, content nonce, raw newsletter, loading status, title, template, content,
 * title ciphertext, template ciphertext, content ciphertext, raw records, encrypted records,
 * decrypted records, and display list.
 * @returns
 * newslettersSlice: Slice<NewsletterState, {}, string>
 */
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
        const individual_public_key = state.public_key as string;
        const title = encryptMessage(state.title as string, state.individual_private_key, shared_public_key);
        const template = encryptMessage(state.template as string, state.individual_private_key, shared_public_key);
        const content = encryptMessage(state.content as string, state.individual_private_key, shared_public_key);
        const draft = {
          ...recipient,
          individual_public_key,
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

/**
 * Select the newsletter list from the newsletter state.
 * @param state
 * @returns
 */
const selectNewsletterList = (state: { newsletters: NewsletterState }) => state.newsletters.list;

/**
 * Select the title nonce from the newsletter state.
 * @param state
 * @returns {string} - title_nonce
 */
export const selectTitleNonce = (state: { newsletters: NewsletterState }) => state.newsletters.title_nonce;

/**
 * Select the template nonce from the newsletter state.
 * @param state
 * @returns {string} - template_nonce
 */
export const selectTemplateNonce = (state: { newsletters: NewsletterState }) => state.newsletters.template_nonce;

/**
 * Select the content nonce from the newsletter state.
 * @param state
 * @returns {string} - content_nonce
 */
export const selectContentNonce = (state: { newsletters: NewsletterState }) => state.newsletters.content_nonce;

/**
 * Select the raw newsletter from the newsletter state.
 * @param state
 * @returns {NewsletterRecord} - newsletter as received from leo wallet adapter.
 */
export const selectRawNewsletter = (state: { newsletters: NewsletterState }): NewsletterRecord =>
  state.newsletters.raw_records[state.newsletters.newsletter.id];

/**
 * Select the loading status from the newsletter state.
 * @param state
 * @returns {boolean} - true if loading, false otherwise.
 */
export const selectIsLoading = (state: { newsletters: NewsletterState }): boolean =>
  state.newsletters.status === 'loading';

/**
 * Select the title from the newsletter state.
 * @param state
 * @returns {string} - title
 * If privacy mode is enabled, then the title is the ciphertext.
 * Otherwise, the title is the decrypted ciphertext.
 * If the newsletter is in draft mode, then the title is the draft title.
 * Otherwise, the title is the newsletter title.
 * If the newsletter is in draft mode and privacy mode is enabled, then the title is the draft title ciphertext.
 * Otherwise, the title is the draft title decrypted ciphertext.
 * If the newsletter is in draft mode and privacy mode is disabled, then the title is the draft title decrypted.
 * Otherwise, the title is the newsletter title decrypted.
 */
export const selectTitle = (state: { newsletters: NewsletterState }): string => state.newsletters.title as string;

/**
 * Select the template from the newsletter state.
 * @param state
 * @returns {string} - template
 * If privacy mode is enabled, then the template is the ciphertext.
 * Otherwise, the template is the decrypted ciphertext.
 * If the newsletter is in draft mode, then the template is the draft template.
 * Otherwise, the template is the newsletter template.
 * If the newsletter is in draft mode and privacy mode is enabled, then the template is the draft template ciphertext.
 * Otherwise, the template is the draft template decrypted ciphertext.
 * If the newsletter is in draft mode and privacy mode is disabled, then the template is the draft template decrypted.
 * Otherwise, the template is the newsletter template decrypted.
 */
export const selectTemplate = (state: { newsletters: NewsletterState }): string => state.newsletters.template as string;

/**
 * Select the content from the newsletter state.
 * @param state
 * @returns {string} - content
 * If privacy mode is enabled, then the content is the ciphertext.
 * Otherwise, the content is the decrypted ciphertext.
 * If the newsletter is in draft mode, then the content is the draft content.
 * Otherwise, the content is the newsletter content.
 * If the newsletter is in draft mode and privacy mode is enabled, then the content is the draft content ciphertext.
 * Otherwise, the content is the draft content decrypted ciphertext.
 * If the newsletter is in draft mode and privacy mode is disabled, then the content is the draft content decrypted.
 * Otherwise, the content is the newsletter content decrypted.
 */
export const selectContent = (state: { newsletters: NewsletterState }): string => state.newsletters.content as string;

/**
 * Select the title ciphertext from the newsletter state.
 * @param state
 * @returns {HexCipher} - title_ciphertext
 */
export const selectTitleCiphertext = (state: { newsletters: NewsletterState }): HexCipher =>
  state.newsletters.title_ciphertext;

/**
 * Select the template ciphertext from the newsletter state.
 * @param state
 * @returns {HexCipher} - template_ciphertext
 */
export const selectTemplateCiphertext = (state: { newsletters: NewsletterState }): HexCipher =>
  state.newsletters.template_ciphertext;

/**
 * Select the content ciphertext from the newsletter state.
 * @param state
 * @returns {HexCipher} - content_ciphertext
 */
export const selectContentCiphertext = (state: { newsletters: NewsletterState }): HexCipher =>
  state.newsletters.content_ciphertext;

/**
 * Select the toggle for Template Mode from the newsletter state.
 * @param state
 * @returns {boolean} - template_mode
 */
export const selectTemplateMode = (state: { newsletters: NewsletterState }): boolean => state.newsletters.template_mode;

/**
 * Select the toggle for Privacy Mode from the newsletter state.
 * @param state
 * @returns {boolean} - privacy_mode
 */
export const selectPrivacyMode = (state: { newsletters: NewsletterState }): boolean => state.newsletters.privacy_mode;

/**
 * Select the current selected Newsletter that the user is interacting with from the newsletter state.
 * @param state
 * @returns {NewsletterRecord} - newsletter
 */
export const selectNewsletter = (state: { newsletters: NewsletterState }) => state.newsletters.newsletter;

/**
 * Select the current selected Newsletters which are not used in a transaction from the newsletter state.
 * @param state
 * @returns {NewsletterRecord[]} - unspent newsletters
 */
export const selectUnspentNewsletters = createSelector(selectNewsletterList, (newsletter_list) => {
  return Object.values(newsletter_list).filter((record) => !record.spent);
});

/**
 * Select the current selected Newsletters which are used in a transaction from the newsletter state.
 * @param state
 * @returns {NewsletterRecord[]} - spent newsletters
 */
export const selectSpentNewsletters = createSelector(selectNewsletterList, (newsletter_list) => {
  return Object.values(newsletter_list).filter((record) => record.spent);
});

/**
 * Select any open invitation Newsletters which the user has received from the newsletter state.
 * @param state
 * @returns {NewsletterRecord[]} - open invitation newsletters
 */
const selectInvites = (state: { newsletters: NewsletterState }): NewsletterRecord[] => {
  const publicKey = state.newsletters.public_key;
  return Object.values(state.newsletters.list).filter((record) => {
    return !record.spent && record.data.op !== publicKey && record.data.revision;
  });
};

/**
 * Select any open invitation Newsletters which the user has received and not yet accepted from the newsletter state.
 * @param state
 * @returns {NewsletterRecord[]} - unspent invitation newsletters
 */
export const selectUnspentInvites = createSelector(selectInvites, (invites): NewsletterRecord[] => {
  return invites.filter((record) => !record.spent);
});

/**
 * Select any delivered issues for the given Newsletter which exists in the newsletter state.
 * @param state
 * @returns {DeliveryDraft[]} - delivered issues
 */
export const selectIssues = (state: { newsletters: NewsletterState }): DeliveryDraft[] => state.newsletters.issues;

/**
 * Select the Group Symmetric Key used to decrypt individual newsletter related records and mapping data.
 * @param state
 * @returns {string} - group_symmetric_key
 */
export const selectGroupSecret = (state: { newsletters: NewsletterState }) => state.newsletters.group_symmetric_key;

/**
 * Select the Individual Private Key used to encrypt/decrypt DeliveryDrafts.
 * @param state
 * @returns {string} - individual_private_key
 */
export const selectIndividualPrivateKey = (state: { newsletters: NewsletterState }) =>
  state.newsletters.individual_private_key;

/**
 * Select the Individual Public Key used to encrypt/decrypt DeliveryDrafts.
 * @param state
 * @returns {string} - individual_public_key
 */
export const selectIndividualPublicKey = (state: { newsletters: NewsletterState }) =>
  state.newsletters.individual_public_key;

/**
 * Select the selected recipients from the newsletter state.
 * @param state
 * @returns {DeliveryDraft[]} - selected_recipients
 */
export const selectRecipients = (state: { newsletters: NewsletterState }): DeliveryDraft[] =>
  state.newsletters.selected_recipients;

/** Export the reducer to be combined at the store level. */
export default newslettersSlice.reducer;
