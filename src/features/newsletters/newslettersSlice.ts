import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchRecords, Record } from '@/features/records/recordsSlice';
import { SubscriptionRecord } from '@/features/subscriptions/subscriptionsSlice';
import { decode, decrypt, encrypt, initSecret, resolve } from '@/lib/util';
import { setPublicKey } from '../accounts/accountsSlice';

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
    template: string[] | string;
    title: string[] | string;
    content: string[] | string;
    group_secret: string;
    individual_secret: string;
  };
}

interface ExampleDraft {
  title: string;
  template: string;
  content: string;
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
  title: string;
  template: string;
  content: string;
  title_ciphertext: string;
  template_ciphertext: string;
  content_ciphertext: string;
  draft_mode: boolean;
  template_mode: boolean;
  privacy_mode: boolean;
  public_key: string | null;
  group_secret: string;
  individual_secret: string;
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
  template: '',
  content: '',
  title_ciphertext: '',
  template_ciphertext: '',
  content_ciphertext: '',
  draft_mode: false,
  template_mode: true,
  privacy_mode: false,
  public_key: null,
  group_secret: '',
  individual_secret: '',
  status: 'uninitialized',
  error: undefined,
};

export const processNewsletterData = (record: NewsletterRecord) => {
  const data = {
    ...record.data,
    id: BigInt((record.data.id as string).slice(0, -13)).toString(),
    op: (record.data.op as string).slice(0, -8),
    member_sequence: BigInt((record.data.member_sequence as string).slice(0, -12)).toString(),
    base: (record.data.base as string).slice(0, -8) === 'true',
    revision: (record.data.revision as string).slice(0, -8) === 'true',
    group_secret: BigInt((record.data.group_secret as string).slice(0, -12)).toString(),
    individual_secret: BigInt((record.data.individual_secret as string).slice(0, -12)).toString(),
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
    const template = await resolve(decode(record.data.template));
    const title = await resolve(decode(record.data.title));
    const content = await resolve(decode(record.data.content));
    const data = {
      ...record.data,
      template: template,
      title: title,
      content: content,
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
      const group_secret: string = record.data.group_secret.slice(0, -12);
      const title: string = decrypt(record.data.title as string, group_secret);
      const template: string = decrypt(record.data.template as string, group_secret);
      const content: string = decrypt(record.data.content as string, group_secret);
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

export const fetchExample = createAsyncThunk('newsletters/fetchExample', async () => {
  const data = import.meta.glob('@/assets/example-drafts.json', { as: 'raw', eager: true });
  const examples: ExampleDraft[] = JSON.parse(data['/src/assets/example-drafts.json']);
  const example: ExampleDraft = examples[Math.floor(Math.random() * examples.length)];
  return example;
});

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
          state.title = state.title_ciphertext;
          state.template = state.template_ciphertext;
          state.content = state.content_ciphertext;
        } else {
          state.title = decrypt(state.title_ciphertext, state.group_secret);
          state.template = decrypt(state.template_ciphertext, state.group_secret);
          state.content = decrypt(state.content_ciphertext, state.group_secret);
        }
      }
    },
    setNewsletter: (state, action: PayloadAction<NewsletterRecord>) => {
      state.newsletter = action.payload;
      if (state.draft_mode && state.draft_record.id === action.payload.id) {
        state.title = state.draft_title;
        state.template = state.draft_template;
        state.content = state.draft_content;
      } else {
        state.title = state.newsletter.data.title as string;
        state.template = state.newsletter.data.template as string;
        state.content = state.newsletter.data.content as string;
      }
      state.group_secret = state.newsletter.data.group_secret.replace(/u128.private/g, '');
      state.title_ciphertext = encrypt(state.title, state.group_secret);
      state.template_ciphertext = encrypt(state.template, state.group_secret);
      state.content_ciphertext = encrypt(state.content, state.group_secret);
    },
    initDraft: (state) => {
      state.newsletter = {} as NewsletterRecord;
      state.title = '';
      state.template = '';
      state.content = '';
      state.group_secret = initSecret().toString();
      state.individual_secret = initSecret().toString();
      state.title_ciphertext = '';
      state.template_ciphertext = '';
      state.content_ciphertext = '';
    },
    setTitle: (state, action: PayloadAction<string>) => {
      if (!state.privacy_mode) {
        if (state.newsletter && state.newsletter.id) {
          state.draft_mode = true;
          state.draft_record = state.raw_records[state.newsletter.id];
          state.draft_title = action.payload;
          state.draft_template = state.template;
          state.draft_content = state.content;
        }
        state.title = action.payload;
        if (state.group_secret === '') {
          state.group_secret = initSecret().toString();
        }
        state.title_ciphertext = encrypt(action.payload, state.group_secret);
      }
    },
    setTemplate: (state, action: PayloadAction<string>) => {
      if (!state.privacy_mode) {
        if (state.newsletter && state.newsletter.id) {
          state.draft_mode = true;
          state.draft_record = state.raw_records[state.newsletter.id];
          state.draft_title = state.title;
          state.draft_template = action.payload;
          state.draft_content = state.content;
        }
        state.template = action.payload;
        if (state.group_secret === '') {
          state.group_secret = initSecret().toString();
        }
        state.template_ciphertext = encrypt(action.payload, state.group_secret);
      }
    },
    setContent: (state, action: PayloadAction<string>) => {
      if (!state.privacy_mode) {
        if (state.newsletter && state.newsletter.id) {
          state.draft_mode = true;
          state.draft_record = state.raw_records[state.newsletter.id];
          state.draft_title = state.title;
          state.draft_template = state.template;
          state.draft_content = action.payload;
        }
        state.content = action.payload;
        if (state.group_secret === '') {
          state.group_secret = initSecret().toString();
        }
        state.content_ciphertext = encrypt(action.payload, state.group_secret);
      }
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
        state.group_secret = initSecret().toString();
        state.individual_secret = initSecret().toString();
        state.title_ciphertext = encrypt(state.title, state.group_secret);
        state.template_ciphertext = encrypt(state.template, state.group_secret);
        state.content_ciphertext = encrypt(state.template, state.group_secret);
        state.status = 'idle';
      })
      .addCase(fetchExample.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.error.message;
      });
  },
});

export const { toggleTemplateMode, togglePrivacyMode, setNewsletter, initDraft, setTitle, setTemplate, setContent } =
  newslettersSlice.actions;

const selectNewsletterList = (state: { newsletters: NewsletterState }) => state.newsletters.list;

export const selectRawNewsletter = (state: { newsletters: NewsletterState }): NewsletterRecord =>
  state.newsletters.raw_records[state.newsletters.newsletter.id];

export const selectIsLoading = (state: { newsletters: NewsletterState }): boolean =>
  state.newsletters.status === 'loading';

export const selectTitle = (state: { newsletters: NewsletterState }): string => state.newsletters.title;

export const selectTemplate = (state: { newsletters: NewsletterState }): string => state.newsletters.template;

export const selectContent = (state: { newsletters: NewsletterState }): string => state.newsletters.content;

export const selectTitleCiphertext = (state: { newsletters: NewsletterState }): string =>
  state.newsletters.title_ciphertext;

export const selectTemplateCiphertext = (state: { newsletters: NewsletterState }): string =>
  state.newsletters.template_ciphertext;

export const selectContentCiphertext = (state: { newsletters: NewsletterState }): string =>
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

export const selectIssues = createSelector(selectUnspentNewsletters, (newsletter_list) => {
  return Object.values(newsletter_list).filter((record) => record.data.revision);
});

export const selectGroupSecret = (state: { newsletters: NewsletterState }) => state.newsletters.group_secret;

export const selectIndividualSecret = (state: { newsletters: NewsletterState }) => state.newsletters.individual_secret;

export default newslettersSlice.reducer;
