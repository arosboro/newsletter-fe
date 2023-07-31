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
import { padArray, splitStringToBigInts } from '@/lib/util';
import { Transaction, WalletAdapterNetwork, WalletNotConnectedError } from '@demox-labs/aleo-wallet-adapter-base';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '@/app/store';
import {
  selectContent,
  selectNewsletter,
  selectPrivacyMode,
  selectTitle,
  togglePrivacyMode,
} from '@/features/newsletters/newslettersSlice';

const Reader: FC = () => {
  const { wallet, publicKey, requestTransaction } = useWallet();
  const newsletter = useSelector(selectNewsletter);
  const title = useSelector(selectTitle);
  const content = useSelector(selectContent);
  const privacy_mode: boolean = useSelector(selectPrivacyMode);
  const dispatch = useDispatch<AppDispatch>();

  const initSecret = (): bigint => {
    // Calcuate a 64-bit random integer and subtract 4 bytes
    const seed = BigInt(Math.floor(Math.random() * 2 ** 64)) - BigInt(4);
    return seed;
  };

  // Get the inital secret as a random string of chacters from a whole number
  const secret = React.useState(initSecret().toString())[0];
  const [fee, setFee] = React.useState<string>('1.529307');
  const [transactionId, setTransactionId] = React.useState<string | undefined>();
  const [status, setStatus] = React.useState<string | undefined>();

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

  const handleAcceptInvite = async (event: ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!publicKey) throw new WalletNotConnectedError();
    if (!newsletter) throw new Error('No newsletter found');

    // The newsletter here is an output from the Requesting Records above
    // newsletter: Newsletter, secret: u128, shared_secret: Bytes64, shared_recipient: Bytes112
    const secret_bigint = padArray([BigInt(secret)], 1);
    const shared_secret_bigints = padArray(
      splitStringToBigInts(CryptoJS.AES.encrypt(secret, newsletter.data.group_secret.slice(0, -8)).toString()),
      4,
    );
    const shared_recipient_bigints = padArray(
      splitStringToBigInts(CryptoJS.AES.encrypt(publicKey, newsletter.data.group_secret.slice(0, -8)).toString()),
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

    // The newsletter here is an output from the Requesting Records above
    const inputs = [
      newsletter,
      `${secret_bigint[0]}u128`,
      `${format_bigints(shared_secret_bigints)}`,
      `${format_bigints(shared_recipient_bigints)}`,
    ];

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
        <ReaderToolbar />
      </div>
      <div className="App-body">
        <div className="App-body-controls">
          <label>
            {(privacy_mode && 'Privacy mode (on) ') || 'Privacy mode (off)'}
            <Toggle defaultChecked={privacy_mode} onChange={() => dispatch(togglePrivacyMode())} />
          </label>
          {newsletter && newsletter.data && newsletter.data.op !== publicKey && !newsletter.data.revision && (
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
