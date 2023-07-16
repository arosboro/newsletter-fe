import React, { Dispatch, SetStateAction, useEffect } from 'react';
import { resolve_ipfs, NewsletterRecord } from '@/lib/util';
import { WalletContextState } from '@demox-labs/aleo-wallet-adapter-react';

interface Props {
  programId: string;
  useWallet: () => WalletContextState;
  privacy: boolean;
  setRecord: Dispatch<SetStateAction<NewsletterRecord | undefined>>;
}

const EditorToolbar = ({ programId, useWallet, privacy, setRecord }: Props) => {
  const { publicKey, requestRecords } = useWallet();

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
    if (records && records.length >= 1) resolve_ipfs(records, privacy, setIsLoading, setRecordsDecrypted);
  }, [records, privacy]);

  return (
    <aside className="App-nav">
      <input className="App-nav-input" placeholder="Filter" />
      {publicKey && !isLoading && (
        <ul className="App-nav-list">
          {recordsDecrypted.map((record: NewsletterRecord, index: number) => (
            <li className="App-nav-list-item" key={index}>
              <a
                href="/#"
                onClick={(e) => {
                  e.preventDefault();
                  setRecord(record);
                }}
                className="App-nav-list-item-link"
              >
                {record && record.data && record.data.title && record.data.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
};

export default EditorToolbar;
