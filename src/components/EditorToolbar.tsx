import React, { Dispatch, SetStateAction, useEffect } from 'react';
import { resolve_ipfs, NewsletterRecord } from '@/lib/util';
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
      individual_sequence: '',
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

  useEffect(() => {
    const fetch = async (programId: string) => {
      if (publicKey && requestRecords) {
        console.log(programId);
        const res = await requestRecords(programId);
        setRecords(res.filter((record: NewsletterRecord) => !record.spent));
        setIsLoading(true);
        console.log(records, 'records');
      }
    };
    fetch(programId);
  }, [publicKey, programId]);

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
          {record && (
            <>
              <hr />
              <h4>Subscribers</h4>
              <AddSubscriber
                programId={programId}
                useWallet={useWallet}
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
