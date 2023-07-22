import React, { Dispatch, SetStateAction, useEffect } from 'react';
import { resolve_ipfs, NewsletterRecord, isNewsletterRecord, SubscriptionRecord } from '@/lib/util';
import { WalletContextState } from '@demox-labs/aleo-wallet-adapter-react';
import { AddSubscriber } from '@/components/AddSubscriber';

interface Props {
  programId: string;
  useWallet: () => WalletContextState;
  privacy: boolean;
  record: NewsletterRecord | undefined;
  setRecord: Dispatch<SetStateAction<NewsletterRecord | undefined>>;
}

const EditorToolbar = ({ programId, useWallet, privacy, record, setRecord }: Props) => {
  const { publicKey, requestRecords } = useWallet();
  const initRecord = {
    id: '',
    owner: '',
    program_id: '',
    data: {
      id: '',
      op: '',
      member_sequence: '',
      base: '',
      revision: '',
      template: '',
      title: '',
      content: '',
      group_secret: '',
      individual_secret: '',
    },
    spent: false,
  };
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [records, setRecords] = React.useState<NewsletterRecord[]>([]);
  const [recordsDecrypted, setRecordsDecrypted] = React.useState<NewsletterRecord[]>([]);
  const [status, setStatus] = React.useState<string | undefined>();

  useEffect(() => {
    const fetch = async (programId: string) => {
      if (
        (publicKey && requestRecords && typeof status === 'undefined') ||
        (publicKey && requestRecords && status === 'Finalized')
      ) {
        console.log(programId);
        const res = await requestRecords(programId);
        setRecords(
          res.filter(
            (record: NewsletterRecord | SubscriptionRecord) =>
              !record.spent && isNewsletterRecord(record) && record.data.op.slice(0, -8) == publicKey,
          ),
        );
        setIsLoading(true);
        console.log(records, 'records');
        if (status === 'Finalized') {
          setStatus(undefined);
        }
      }
    };
    fetch(programId);
  }, [publicKey, programId, status]);

  useEffect(() => {
    if (records && records.length >= 1)
      resolve_ipfs(records, privacy, setIsLoading, setRecordsDecrypted, record, setRecord);
  }, [records, privacy]);

  return (
    <aside className="App-nav">
      <button
        className="App-nav-button"
        onClick={(e) => {
          e.preventDefault();
          setRecord(initRecord);
        }}
      >
        New
      </button>
      &nbsp;
      <button
        className="App-nav-button"
        onClick={(e) => {
          e.preventDefault();
          setRecord(undefined);
        }}
      >
        Example
      </button>
      <hr />
      <input className="App-nav-input" placeholder="Filter" />
      <hr />
      {publicKey && !isLoading && (
        <>
          <h4>Newsletters</h4>
          <ul className="App-nav-list">
            {recordsDecrypted.map((value: NewsletterRecord, index: number) => (
              <li className="{record.idApp-nav-list-item" key={index}>
                <a
                  href="/#"
                  onClick={(e) => {
                    e.preventDefault();
                    setRecord(value);
                  }}
                  className="App-nav-list-item-link"
                >
                  {(value && record && value.id == record.id && value.data && value.data.title && (
                    <i>{value.data.title}</i>
                  )) ||
                    (value && value.data && value.data.title && value.data.title)}
                </a>
              </li>
            ))}
          </ul>
          {record && record.id && (
            <>
              <hr />
              <h4>Subscribers</h4>
              <AddSubscriber
                programId={programId}
                useWallet={useWallet}
                setParentStatus={setStatus}
                record={
                  records.filter((rec) => {
                    return (rec.id = record.id);
                  })[0]
                }
              />
            </>
          )}
        </>
      )}
    </aside>
  );
};

export default EditorToolbar;
