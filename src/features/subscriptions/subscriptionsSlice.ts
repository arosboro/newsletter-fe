import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Record } from '@/features/records/recordsSlice';
import { isNewsletterRecord, NewsletterRecord } from '@/features/newsletters/newslettersSlice';
import { getMapping } from '@/aleo/rpc';
import { NewsletterProgramId } from '@/aleo/newsletter-program';
import { decode, decrypt, resolve } from '@/lib/util';

export interface SubscriptionRecord {
  id: string;
  owner: string;
  program_id: string;
  spent: boolean;
  data: {
    owner: string;
    op: string;
    id: string;
    member_sequence: string;
    member_secret_idx: string;
  };
}

export interface SharedSecret {
  shared_secret: string[] | string;
  recipient: string[] | string;
}

export interface SharedSecretMapping {
  subscription: SubscriptionRecord;
  newsletter: NewsletterRecord;
  secret: SharedSecret;
}

export type SubscriptionState = {
  list: { [key: string]: SharedSecretMapping };
  status: 'uninitialized' | 'loading' | 'idle';
  error: string | undefined;
};

const initialState: SubscriptionState = { list: {}, status: 'uninitialized', error: undefined };

export const isSubscriptionRecord = (
  record: NewsletterRecord | SubscriptionRecord | Record,
): record is SubscriptionRecord => {
  return (record as SubscriptionRecord).data.member_secret_idx !== undefined;
};

export const lookupSubscriptionRecords = createAsyncThunk('subscriptions/lookupRecords', async (records: Record[]) => {
  const newsletter_records = records.filter((record) => isNewsletterRecord(record)) as NewsletterRecord[];
  const subscription_records = records.filter((record) => isSubscriptionRecord(record)) as SubscriptionRecord[];
  const shared_secrets: SharedSecretMapping[] = [];
  for (let i = 0; i < subscription_records.length; i++) {
    const subscription: SubscriptionRecord = subscription_records[i];
    const member_secret_idx = subscription.data.member_secret_idx.slice(0, -8);
    const member_secret: SharedSecret = await getMapping(
      'https://vm.aleo.org/api',
      NewsletterProgramId,
      'member_secrets',
      member_secret_idx,
    );
    const filtered_newsletters: NewsletterRecord[] = newsletter_records.filter(
      (record) => subscription.data.id === record.data.id,
    );
    const unique_newsletters: NewsletterRecord[] = [];
    const seen_ids = new Set();
    for (let i = 0; i < filtered_newsletters.length; i++) {
      if (!seen_ids.has(filtered_newsletters[i].data.id)) {
        seen_ids.add(filtered_newsletters[i].data.id);
        unique_newsletters.push(filtered_newsletters[i]);
      }
    }
    const newsletter = unique_newsletters[0];
    const shared_secret: SharedSecret = {
      shared_secret: decode(member_secret.shared_secret),
      recipient: decode(member_secret.recipient),
    };
    shared_secrets.push({ subscription: subscription, newsletter: newsletter, secret: shared_secret });
  }
  return shared_secrets;
});

export const decryptSubscriptionMappings = createAsyncThunk(
  'subscriptions/decryptMappings',
  async (mappings: SharedSecretMapping[]) => {
    const decrypted_mappings: SharedSecretMapping[] = [];
    for (let i = 0; i < mappings.length; i++) {
      const mapping: SharedSecretMapping = mappings[i];
      const shared_secret = mapping.secret.shared_secret as string;
      const recipient = mapping.secret.recipient as string;
      console.log(shared_secret, 'shared_secret');
      console.log(recipient, 'recipient');
      const group_secret = mapping.newsletter.data.group_secret.slice(0, -12);
      const title = await resolve(decode(mapping.newsletter.data.title));
      const template = await resolve(decode(mapping.newsletter.data.template));
      const content = await resolve(decode(mapping.newsletter.data.content));
      const newsletter_decrypted: NewsletterRecord = {
        ...mapping.newsletter,
        data: {
          ...mapping.newsletter.data,
          group_secret: group_secret,
          title: decrypt(title, group_secret),
          template: decrypt(template, group_secret),
          content: decrypt(content, group_secret),
        },
      };
      console.log(shared_secret, group_secret);
      console.log(recipient, group_secret);
      console.log(decrypt(shared_secret, group_secret), '1 boyah');
      console.log(decrypt(recipient, group_secret), '2 boyahs');
      decrypted_mappings.push({
        ...mapping,
        newsletter: newsletter_decrypted,
        secret: { shared_secret: decrypt(shared_secret, group_secret), recipient: decrypt(recipient, group_secret) },
      } as SharedSecretMapping);
    }
    return decrypted_mappings;
  },
);

const subscriptionsSlice = createSlice({
  name: 'subscriptions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(lookupSubscriptionRecords.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(lookupSubscriptionRecords.fulfilled, (state, action: PayloadAction<SharedSecretMapping[]>) => {
        const newRecords: { [key: string]: SharedSecretMapping } = {};
        action.payload.forEach((map) => {
          newRecords[map.subscription.id] = map;
        });
        state.list = newRecords;
        state.status = 'idle';
      })
      .addCase(lookupSubscriptionRecords.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.error.message;
      });
  },
});

const selectSubscriptionsList = (state: { subscriptions: SubscriptionState }) => state.subscriptions.list;

export const selectUnspentSubscriptions = createSelector(selectSubscriptionsList, (subscription_list) => {
  return Object.values(subscription_list).filter((record) => !record.newsletter.spent);
});

export default subscriptionsSlice.reducer;
