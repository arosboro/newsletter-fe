import React, { useEffect } from 'react';
import { WalletNotConnectedError } from '@demox-labs/aleo-wallet-adapter-base';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { CID, IPFSHTTPClient } from 'ipfs-http-client';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { NewsletterProgramId } from '../aleo/newsletter-program';
import { parseStringToBigIntArray, joinBigIntsToString, stringToBigInt, bigIntToString } from '@/lib/util';

interface Props {
  programId: string;
  useWallet: any;
  privacy: boolean;
}

const EditorToolbar = ({ programId, useWallet, privacy }: Props) => {
  const { publicKey, requestRecords } = useWallet();

  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [records, setRecords] = React.useState<any[]>([]);
  const [recordsDecrypted, setRecordsDecrypted] = React.useState<any[]>([]);

  useEffect(() => {
    const fetch = async (programId: string) => {
      if (publicKey) {
        console.log(programId);
        const res = await requestRecords(programId);
        setRecords(res.filter((record: any) => !record.spent));
        setIsLoading(true, 'isLoading');
        console.log(records, 'records');
      }
    };
    fetch(programId);
  }, [publicKey, programId]);

  useEffect(() => {
    const resolve_ipfs = async () => {
      const resolve = async (path: string) => {
        console.log('Fetching from IPFS: ' + path); // IPFS Hash/Address
        const cipher_text = await axios.get(`https://ipfs.io/ipfs/${path}`).then((response) => {
          console.log('IPFS Response: ' + response.data);
          return response.data;
        });
        return cipher_text;
      };
      // process each record of records through resolve into recordsDecoded with resolve async function.
      const data = [];
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const decoded_title = await resolve(decode(record.data.title));
        const decoded_template = await resolve(decode(record.data.template));
        const decoded_content = await resolve(decode(record.data.content));
        const decoded_group_secret = record.data.group_secret.slice(0, -12);
        const decrypted_title = decrypt(decoded_title, decoded_group_secret);
        const decrypted_template = decrypt(decoded_template, decoded_group_secret);
        const decrypted_content = decrypt(decoded_content, decoded_group_secret);
        const decrypted_data = {
          ...record.data,
          title: decrypted_title,
          template: decrypted_template,
          content: decrypted_content,
          group_secret: decoded_group_secret,
        };
        const record_decrypted = {
          ...record,
          data: decrypted_data,
        };
        console.log(record_decrypted, 'record_decrypted');
        data.push(record_decrypted);
      }
      console.log(data, 'data');
      setRecordsDecrypted(data);
      setIsLoading(false);
      console.log(recordsDecrypted, 'recordsDecrypted');
      console.log(isLoading, 'isLoading');
    };
    if (records && records.length >= 1) resolve_ipfs();
  }, [records]);

  const decode = (bytes: string[]): string => {
    const chunkBuffer = Object.values(bytes).map((chunk) => {
      return BigInt(chunk.slice(0, -12));
    });
    const chunk_decoded = joinBigIntsToString(chunkBuffer);
    return chunk_decoded;
  };

  const decrypt = (aes_ciphertext: string, secret: string) => {
    if (typeof aes_ciphertext === 'string' && typeof secret === 'string') {
      const plaintext = CryptoJS.AES.decrypt(aes_ciphertext, secret).toString(CryptoJS.enc.Utf8);
      return plaintext;
    }
  };

  return (
    <aside className="App-nav">
      <input className="App-nav-input" placeholder="Search" />
      {publicKey && recordsDecrypted.length && !isLoading && (
        <ul className="App-nav-list">
          {recordsDecrypted.map((record: any, index: number) => (
            <li className="App-nav-list-item" key={index}>
              <a href="/#" className="App-nav-list-item-link">
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
