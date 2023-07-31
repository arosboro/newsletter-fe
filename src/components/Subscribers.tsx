import { WalletContextState } from '@demox-labs/aleo-wallet-adapter-react';
import React, { useEffect } from 'react';
import { NewsletterRecord, SharedSecret, SharedSecretMapping, SubscriptionRecord } from '@/lib/util';
import { TESTNET3_API_URL, getMapping } from '@/aleo/rpc';

interface Props {
  programId: string;
  useWallet: () => WalletContextState;
  parent_status: string | undefined;
  record: NewsletterRecord | undefined;
}

export const Subscribers = ({ programId, useWallet, parent_status, record }: Props) => {
  const { publicKey, requestRecords } = useWallet();

  const [records, setRecords] = React.useState<SubscriptionRecord[]>([]);
  const [mappings, setMappings] = React.useState<SharedSecretMapping[]>([]);

  useEffect(() => {
    const fetch = async (programId: string) => {
      if (
        (publicKey && requestRecords && typeof parent_status === 'undefined') ||
        (publicKey && requestRecords && parent_status === 'Finalized')
      ) {
        const res = await requestRecords(programId);
        setRecords(res.filter((record: SubscriptionRecord) => !record.spent && Object.keys(record.data).length === 5));
        for (let i = 0; i < records.length; i++) {
          const mappings_copy = mappings;
          const shared_secret: SharedSecret = await resolve_addr_from_mapping(records[i].data.member_secret_idx);
          const secret: SharedSecretMapping = { key: records[i].id, value: shared_secret };
          mappings_copy.push(secret);
          setMappings(mappings_copy);
        }
      }
    };
    fetch(programId);
  }, [publicKey, programId, parent_status]);

  const resolve_addr_from_mapping = async (index: string): Promise<SharedSecret> => {
    const key = 'member_secrets';
    const secret = await getMapping(TESTNET3_API_URL, programId, index, key);
    return secret;
  };

  return (
    <>
      <p>{JSON.stringify(record)}</p>
    </>
  );
};
