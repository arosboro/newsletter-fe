import React, { ChangeEvent, FC, useEffect } from 'react';
import MDEditor from '@uiw/react-md-editor';
import CryptoJS from 'crypto-js';
import '@demox-labs/aleo-wallet-adapter-reactui/styles.css';
import { WalletMultiButton } from '@demox-labs/aleo-wallet-adapter-reactui';
import './Reader.css';
import ReaderToolbar from '@/components/ReaderToolbar';
import { NewsletterProgramId } from '@/aleo/newsletter-program';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import Toggle from 'react-toggle';
import { NewsletterRecord, padArray, splitStringToBigInts } from '@/lib/util';
import { Transaction, WalletAdapterNetwork, WalletNotConnectedError } from '@demox-labs/aleo-wallet-adapter-base';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';

const Reader: FC = () => {
  const { wallet, publicKey, requestTransaction } = useWallet();

  const defaultTitle = 'You are not a member of any newsletters';
  const defaultContent = `
**Crickets**

Ask someone to invite you to a Newsletter or create one.  New issues will appear here.`;
  const initSecret = (): bigint => {
    // Calcuate a 64-bit random integer and subtract 4 bytes
    const seed = BigInt(Math.floor(Math.random() * 2 ** 64)) - BigInt(4);
    return seed;
  };

  const [title, setTitle] = React.useState(defaultTitle);
  const [content, setContent] = React.useState(defaultContent);
  // Get the inital secret as a random string of chacters from a whole number
  const secret = React.useState(initSecret().toString())[0];
  const setTitleCiphertext = React.useState('')[1];
  const setContentCiphertext = React.useState('')[1];
  const [record, setRecord] = React.useState<NewsletterRecord>();
  const [fee, setFee] = React.useState<string>('1.529307');
  const [privacy_mode, setPrivacyMode] = React.useState(false);
  const [transactionId, setTransactionId] = React.useState<string | undefined>();
  const [status, setStatus] = React.useState<string | undefined>();

  useEffect(() => {
    if (typeof publicKey === 'string') {
      // Title ciphertext
      if (typeof title === 'string') {
        setTitleCiphertext(CryptoJS.AES.encrypt(title, secret).toString());
      }
      // Content ciphertext
      if (typeof content === 'string') {
        setContentCiphertext(CryptoJS.AES.encrypt(content, secret).toString());
      }
    }
  }, [title, content, secret, publicKey]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    if (transactionId) {
      intervalId = setInterval(() => {
        getTransactionStatus(transactionId);
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [transactionId]);

  useEffect(() => {
    if (typeof record !== 'undefined') {
      console.log(record);
      if (
        typeof record.data.title === 'string' &&
        typeof record.data.template === 'string' &&
        typeof record.data.content === 'string'
      ) {
        setTitle(record.data.title);
        setContent(record.data.content);
      }
    } else {
      setTitle(defaultTitle);
      setContent(defaultContent);
    }
  }, [record]);

  const handleAcceptInvite = async (event: ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!publicKey) throw new WalletNotConnectedError();
    if (!record) throw new Error('No record found');
    console.log(record);

    // The record here is an output from the Requesting Records above
    // newsletter: Newsletter, secret: u128, shared_secret: Bytes64, shared_recipient: Bytes112
    const secret_bigint = padArray([BigInt(secret)], 1);
    const shared_secret_bigints = padArray(
      splitStringToBigInts(CryptoJS.AES.encrypt(secret, record.data.group_secret.slice(0, -8)).toString()),
      4,
    );
    const shared_recipient_bigints = padArray(
      splitStringToBigInts(CryptoJS.AES.encrypt(publicKey, record.data.group_secret.slice(0, -8)).toString()),
      7,
    );

    const format_bigints = (bigints: bigint[]) => {
      let result = '{ ';
      for (let i = 0; i < bigints.length; i++) {
        if (i == bigints.length - 1) result += `b${i}: ${bigints[i]}u128 `;
        else result += `b${i}: ${bigints[i]}u128, `;
      }
      result += '}';
      return result;
    };

    // The record here is an output from the Requesting Records above
    const inputs = [
      record,
      `${secret_bigint[0]}u128`,
      `${format_bigints(shared_secret_bigints)}`,
      `${format_bigints(shared_recipient_bigints)}`,
    ];

    console.log(inputs);
    const fee_value: number = parseFloat(fee) || 1.0;

    const fee_microcredits = 1_000_000 * fee_value; // This will fail if fee is not set high enough

    const aleoTransaction = Transaction.createTransaction(
      publicKey,
      WalletAdapterNetwork.Testnet,
      NewsletterProgramId,
      'accept',
      inputs,
      fee_microcredits,
    );

    if (requestTransaction) {
      // Returns a transaction Id, that can be used to check the status. Note this is not the on-chain transaction id
      const txId = (await requestTransaction(aleoTransaction)) || '';
      setTransactionId(txId);
    }
  };

  const getTransactionStatus = async (txId: string) => {
    const status = await (wallet?.adapter as LeoWalletAdapter).transactionStatus(txId);
    setStatus(status);
  };

  return (
    <section className="Reader">
      <header className="App-header">
        <h1>{title}</h1>
        <WalletMultiButton />
      </header>
      <div className="App-sidebar">
        <ReaderToolbar
          programId={NewsletterProgramId}
          useWallet={useWallet}
          privacy={privacy_mode}
          record={record}
          setRecord={setRecord}
          status={status}
          setStatus={setStatus}
        />
      </div>
      <div className="App-body">
        <div className="App-body-controls">
          <label>
            {(privacy_mode && 'Privacy mode (on) ') || 'Privacy mode (off)'}
            <Toggle
              defaultChecked={privacy_mode}
              onChange={() => {
                setPrivacyMode(!privacy_mode);
              }}
            />
          </label>
          {record && record.data.op.slice(0, -8) !== publicKey && record.data.revision.slice(0, -8) === 'false' && (
            <div className="App-body-controls-invite-form">
              <form onSubmit={handleAcceptInvite}>
                <label>
                  Fee:
                  <input type="text" value={fee} onChange={(event) => setFee(event.target.value)} />
                </label>
                <input type="submit" value="Accept Invite" />
              </form>
            </div>
          )}
          {transactionId && (
            <div>
              <div>{`Transaction status: ${status}`}</div>
            </div>
          )}
        </div>
        <MDEditor.Markdown source={content} style={{ whiteSpace: 'pre-wrap' }} />
      </div>
      <div className="App-footer"></div>
    </section>
  );
};

export default Reader;
