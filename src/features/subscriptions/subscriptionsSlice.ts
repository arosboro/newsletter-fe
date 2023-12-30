import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Record } from '@/features/records/recordsSlice';
import { isNewsletterRecord, NewsletterRecord, processNewsletterData } from '@/features/newsletters/newslettersSlice';
import { getMapping } from '@/aleo/rpc';
import { NewsletterProgramId } from '@/aleo/newsletter-program';
import { decode, decode_u8, decryptGroupMessage, resolve } from '@/lib/util';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import init, { cantors_pairing } from 'newsletter_worker';

/**
 * The SubscriptionRecord is a representation of Subscription Aleo Records.
 */
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

/**
 * The SharedSecret is a representation of the SharedSecret Aleo Mapping.
 */
export interface SharedSecret {
  shared_public_key: string[] | string;
  recipient: string[] | string;
}

/**
 * The SharedSecretMapping is a representation of the SharedSecret Along with
 * supporting meta data to accompany the SubscriptionRecord and NewsletterRecord.
 * This is used to decrypt the NewsletterRecord.
 * @see NewsletterRecord
 * @see SubscriptionRecord
 * @see SharedSecret
 */
export interface SharedSecretMapping {
  sequence: string;
  subscription: SubscriptionRecord | undefined;
  newsletter: NewsletterRecord;
  secret: SharedSecret;
}

/**
 * The SubscriberList is a representation of a list of SharedSecretMappings
 * grouped by NewsletterRecord id.
 * @see SharedSecretMapping
 * @see NewsletterRecord
 */
export interface SubscriberList {
  [key: string]: SharedSecretMapping[];
}

/**
 * The SubscriptionState is a representation of the Subscription feature slice.
 * @see SharedSecretMapping
 * @see SubscriberList
 * @see SubscriptionRecord
 * @see NewsletterRecord
 * @see SharedSecret
 */
export type SubscriptionState = {
  list: { [key: string]: SharedSecretMapping };
  newsletter_list: SubscriberList;
  status: 'uninitialized' | 'loading' | 'idle';
  error: string | undefined;
};

/**
 * The initial state for the Subscription feature slice.
 */
const initialState: SubscriptionState = { list: {}, newsletter_list: {}, status: 'uninitialized', error: undefined };

/**
 * The processSubscriptionData function is used to process SubscriptionRecords
 * and convert the Aleo Record structure into TS Types.
 * @param record - The SubscriptionRecord to process.
 * @returns The processed SubscriptionRecord data.
 */
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

/**
 * The isSubscriptionRecord function is used to determine if a Record is a SubscriptionRecord.
 * @param record - The Record to check.
 * @returns True if the Record is a SubscriptionRecord, false otherwise.
 * @see SubscriptionRecord
 * @see Record
 */
export const isSubscriptionRecord = (
  record: NewsletterRecord | SubscriptionRecord | Record,
): record is SubscriptionRecord => {
  return (record as SubscriptionRecord).data.member_secret_idx !== undefined;
};

/**
 * The lookupSubscriptionRecords function is used to lookup SubscriptionRecords
 * and convert the Aleo Record structure into TS Types.
 * @param records - The Records to lookup.
 * @returns The processed SubscriptionRecords data.
 * @see SubscriptionRecord
 */
export const lookupSubscriptionRecords = createAsyncThunk('subscriptions/lookupRecords', async (records: Record[]) => {
  const newsletter_records = records.filter(
    (record) => isNewsletterRecord(record) && !record.spent,
  ) as NewsletterRecord[];
  const subscription_records = records.filter((record) => isSubscriptionRecord(record)) as SubscriptionRecord[];
  const shared_public_keys: SharedSecretMapping[] = [];
  // Determine member_secret_idx manually, relying on the cantors pairing with newsletter.id
  // and newsletter.member_sequence to determine the member_secret_idx
  await init().then(async () => {
    for (let i = 0; i < newsletter_records.length; i++) {
      // Get all public keys for every iteration of the newsletter.member_sequence related to the
      // newsletter.id
      const newsletter: NewsletterRecord = processNewsletterData(newsletter_records[i]);
      const newsletter_id = BigInt(newsletter.data.id);
      const newsletter_member_sequence = newsletter.data.member_sequence;
      for (let j = 1n; j <= BigInt(newsletter_member_sequence); j += 1n) {
        const current_member_sequence = BigInt(j).toString();
        const member_secret_idx = cantors_pairing(`${newsletter_id}field`, `${current_member_sequence}field`);
        const member_secret_json: string = await getMapping(
          'https://api.explorer.aleo.org/v1',
          NewsletterProgramId,
          'member_secrets',
          member_secret_idx,
        );
        if (member_secret_json && member_secret_json !== 'null') {
          const member_secret: SharedSecret = JSON.parse(member_secret_json);
          const shared_public_key: SharedSecret = {
            shared_public_key: decode(member_secret.shared_public_key),
            recipient: decode(member_secret.recipient),
          };
          const subscription = subscription_records.find(
            (record) =>
              record.data.member_secret_idx === `${member_secret_idx}.private` &&
              record.data.member_sequence === `${current_member_sequence}field.private`,
          );
          const shared_public_key_record: SharedSecretMapping = {
            sequence: j.toString(),
            subscription: subscription,
            newsletter: newsletter,
            secret: shared_public_key,
          };
          shared_public_keys.push(shared_public_key_record);
        }
      }
    }
  });
  return shared_public_keys;
});

/**
 * The fetchSubscriptionMappings function is used to fetch SubscriptionMappings
 * paths from IPFS. and convert the Aleo Mapping structure into TS Types.
 * @param mappings - The Mappings containing keys and information to derive a
 * decrypted newsletter.
 * @returns The processed SubscriptionMappings data.
 * @see SharedSecretMapping
 * @see SharedSecret
 * @see NewsletterRecord
 * @see SubscriptionRecord
 */
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

/**
 * The subscriptionsSlice manages the data and loading states related to user subscriptions.
 */
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
        action.payload.forEach((mapping) => {
          if (mapping.subscription) {
            newRecords[mapping.subscription.data.id] = mapping;
          }
        });
        state.list = newRecords;
        // Group a newsletter list by newsletter id, then sequence:
        const newsletter_list: SubscriberList = {};
        action.payload.forEach((record: SharedSecretMapping) => {
          if (!newsletter_list[record.newsletter.data.id]) {
            newsletter_list[record.newsletter.data.id] = [];
          }
          newsletter_list[record.newsletter.data.id][parseInt(record.sequence)] = record;
        });
        state.newsletter_list = newsletter_list;
        state.status = 'idle';
      })
      .addCase(lookupSubscriptionRecords.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.error.message;
      });
  },
});

/**
 * Selector to acquire the SubscriptionRecords from the state.
 * @param state
 * @returns
 */
const selectSubscriptionsList = (state: { subscriptions: SubscriptionState }) => state.subscriptions.list;

/**
 * Selector to determine whether the SubscriptionsSlice is causing the application to load.
 * @param state
 * @returns boolean
 */
export const selectIsLoading = (state: { subscriptions: SubscriptionState }) =>
  state.subscriptions.status === 'loading';

/**
 * Selector to acquire the unspent SubscriptionRecords from the state.
 * @param selectSubscriptionsList
 * @returns NewsletterRecord[]
 */
export const selectUnspentSubscriptions = createSelector(selectSubscriptionsList, (subscription_list) => {
  return Object.values(subscription_list).filter((record) => !record.newsletter.spent);
});

/**
 * Selector to acquire the spent SubscriptionRecords from the state.
 * @param state
 * @returns SharedSecretMapping[]
 */
export const selectNewsletterSubscribers = (state: { subscriptions: SubscriptionState }) => {
  return state.subscriptions.newsletter_list;
};

/** Export the reducer to be combined at the store level. */
export default subscriptionsSlice.reducer;
