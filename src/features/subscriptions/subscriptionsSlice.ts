import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Record } from '@/features/records/recordsSlice';
import { isNewsletterRecord, NewsletterRecord, processNewsletterData } from '@/features/newsletters/newslettersSlice';
import { getMapping } from '@/aleo/rpc';
import { NewsletterProgramId } from '@/aleo/newsletter-program';
import { decode, decode_u8, decryptGroupMessage, resolve } from '@/lib/util';
import init, { cantors_pairing } from 'newsletter_worker';

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
  shared_public_key: string[] | string;
  recipient: string[] | string;
}

export interface SharedSecretMapping {
  sequence: string;
  subscription: SubscriptionRecord | undefined;
  newsletter: NewsletterRecord;
  secret: SharedSecret;
}

export interface SubscriberList {
  [key: string]: SharedSecretMapping[];
}

export type SubscriptionState = {
  list: { [key: string]: SharedSecretMapping };
  newsletter_list: SubscriberList;
  status: 'uninitialized' | 'loading' | 'idle';
  error: string | undefined;
};

const initialState: SubscriptionState = { list: {}, newsletter_list: {}, status: 'uninitialized', error: undefined };

export const processSubscriptionData = (record: SubscriptionRecord) => {
  const data = {
    ...record.data,
    id: BigInt((record.data.id as string).slice(0, -13)).toString(),
    op: (record.data.op as string).slice(0, -8),
    member_sequence: BigInt((record.data.member_sequence as string).slice(0, -13)).toString(),
    member_secret_idx: BigInt(record.data.member_secret_idx.slice(0, -13)).toString(),
  };
  return { ...record, data: data };
};

export const isSubscriptionRecord = (
  record: NewsletterRecord | SubscriptionRecord | Record,
): record is SubscriptionRecord => {
  return (record as SubscriptionRecord).data.member_secret_idx !== undefined;
};

export const lookupSubscriptionRecords = createAsyncThunk('subscriptions/lookupRecords', async (records: Record[]) => {
  const newsletter_records = records.filter((record) => isNewsletterRecord(record)) as NewsletterRecord[];
  // const cleaned_newsletter_records = newsletter_records.map((record) => {
  //   return processNewsletterData(record);
  // });
  const subscription_records = records.filter((record) => isSubscriptionRecord(record)) as SubscriptionRecord[];
  const shared_public_keys: SharedSecretMapping[] = [];
  // Determine member_secret_idx manually, relying on the cantors pairing with newsletter.id
  // and newsletter.member_sequence to determine the member_secret_idx
  for (let i = 0; i < newsletter_records.length; i++) {
    // Get all public keys for every iteration of the newsletter.member_sequence related to the
    // newsletter.id
    const raw_newsletter: NewsletterRecord = newsletter_records[i];
    const newsletter: NewsletterRecord = processNewsletterData(raw_newsletter);
    const newsletter_id = BigInt(newsletter.data.id);
    const newsletter_member_sequence = newsletter.data.member_sequence;
    console.log(newsletter_id);
    console.log(BigInt(newsletter_member_sequence), 'newsletter_member_sequence');
    for (let j = 1n; j <= BigInt(newsletter_member_sequence); j += 1n) {
      console.log(j);
      const current_member_sequence = BigInt(j).toString();
      console.log(`${newsletter_id}field`, `${current_member_sequence}field`);
      await init().then(async () => {
        console.log('init wasm-pack');
        const member_secret_idx = cantors_pairing(`${newsletter_id}field`, `${current_member_sequence}field`);
        const member_secret: SharedSecret = await getMapping(
          'https://vm.aleo.org/api',
          NewsletterProgramId,
          'member_secrets',
          member_secret_idx,
        );
        console.log(member_secret);
        const shared_public_key: SharedSecret = {
          shared_public_key: decode(member_secret.shared_public_key),
          recipient: decode(member_secret.recipient),
        };
        const subscription = subscription_records.find((record) => {
          return (
            BigInt(record.data.member_secret_idx.slice(0, -13)) === BigInt(member_secret_idx.slice(0, -13)) &&
            BigInt(record.data.member_sequence.slice(0, -13)) === j
          );
        });
        shared_public_keys.push({
          sequence: j.toString(),
          subscription: subscription,
          newsletter: newsletter,
          secret: shared_public_key,
        });
      });
    }
  }
  // for (let i = 0; i < subscription_records.length; i++) {
  //   const subscription: SubscriptionRecord = processSubscriptionData(subscription_records[i]);
  //   const member_secret_idx = `${subscription.data.member_secret_idx}field`;
  //   console.log(member_secret_idx, 'member_secret_idx');
  //   const member_secret: SharedSecret = await getMapping(
  //     'https://vm.aleo.org/api',
  //     NewsletterProgramId,
  //     'member_secrets',
  //     member_secret_idx,
  //   );
  //   const filtered_newsletters: NewsletterRecord[] = cleaned_newsletter_records.filter(
  //     (record) => subscription.data.id === record.data.id,
  //   );
  //   const unique_newsletters: NewsletterRecord[] = [];
  //   const seen_ids = new Set();
  //   for (let i = 0; i < filtered_newsletters.length; i++) {
  //     if (!seen_ids.has(filtered_newsletters[i].data.id)) {
  //       seen_ids.add(filtered_newsletters[i].data.id);
  //       unique_newsletters.push(filtered_newsletters[i]);
  //     }
  //   }
  //   const newsletter = unique_newsletters[0];
  //   const shared_public_key: SharedSecret = {
  //     shared_public_key: decode(member_secret.shared_public_key),
  //     recipient: decode(member_secret.recipient),
  //   };
  //   shared_public_keys.push({ subscription: subscription, newsletter: newsletter, secret: shared_public_key });
  // }
  return shared_public_keys;
});

export const fetchSubscriptionMappings = createAsyncThunk(
  'subscriptions/fetchMappings',
  async (mappings: SharedSecretMapping[]) => {
    const decrypted_mappings: SharedSecretMapping[] = [];
    for (let i = 0; i < mappings.length; i++) {
      const mapping: SharedSecretMapping = mappings[i];
      const shared_public_key = mapping.secret.shared_public_key;
      const recipient = mapping.secret.recipient;
      const group_symmetric_key = decode(mapping.newsletter.data.group_symmetric_key);
      try {
        const title = await resolve(decode((mapping.newsletter as Record).data.title));
        const title_nonce = decode_u8((mapping.newsletter as Record).data.title_nonce);
        const template = await resolve(decode((mapping.newsletter as Record).data.template));
        const template_nonce = decode_u8((mapping.newsletter as Record).data.template_nonce);
        const content = await resolve(decode((mapping.newsletter as Record).data.content));
        const content_nonce = decode_u8((mapping.newsletter as Record).data.content_nonce);
        const newsletter_decrypted = {
          ...mapping.newsletter,
          data: {
            ...mapping.newsletter.data,
            group_symmetric_key: group_symmetric_key,
            title: decryptGroupMessage(title, title_nonce, group_symmetric_key),
            template: decryptGroupMessage(template, template_nonce, group_symmetric_key),
            content: decryptGroupMessage(content, content_nonce, group_symmetric_key),
          },
        };

        decrypted_mappings.push({
          ...mapping,
          subscription: mapping.subscription,
          newsletter: newsletter_decrypted,
          secret: {
            shared_public_key: shared_public_key,
            recipient: recipient,
          },
        } as SharedSecretMapping);
        return decrypted_mappings;
      } catch (e) {
        console.log(e);
      }
    }
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
          newRecords[map.sequence] = map;
        });
        state.list = newRecords;
        const keys = Object.keys(state.list);
        state.newsletter_list = {};
        for (let i = 0; i < keys.length; i++) {
          const mapping = state.list[keys[i]];
          const newsletter_id = mapping.newsletter.data.id;
          if (typeof state.newsletter_list[newsletter_id] === 'undefined') {
            state.newsletter_list[newsletter_id] = [];
          }
          mapping.secret.shared_public_key = mapping.secret.shared_public_key as string;
          mapping.secret.recipient = mapping.secret.recipient as string;
          state.newsletter_list[newsletter_id].push(mapping);
        }
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

export const selectNewsletterSubscribers = (state: { subscriptions: SubscriptionState }) =>
  state.subscriptions.newsletter_list;

export default subscriptionsSlice.reducer;
