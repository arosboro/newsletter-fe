import React, { ChangeEvent, FC, useEffect } from 'react';
import '@demox-labs/aleo-wallet-adapter-reactui/styles.css';
import { WalletMultiButton } from '@demox-labs/aleo-wallet-adapter-reactui';
import './Reader.css';
import ReaderToolbar from '@/components/ReaderToolbar';
import { NewsletterProgramId } from '@/aleo/newsletter-program';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import Toggle from 'react-toggle';
import { format_bigints, padArray, splitStringToBigInts } from '@/lib/util';
import { Transaction, WalletAdapterNetwork, WalletNotConnectedError } from '@demox-labs/aleo-wallet-adapter-base';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '@/app/store';
import {
  selectContent,
  selectIndividualPrivateKey,
  selectIndividualPublicKey,
  selectNewsletter,
  selectPrivacyMode,
  selectTitle,
  togglePrivacyMode,
} from '@/features/newsletters/newslettersSlice';
import { fetchRecords } from '@/features/records/recordsSlice';

import dynamic from 'next/dynamic';

// Export Markdown property as a dynamic component to avoid SSR errors
const MDPreview = dynamic(() => import('@uiw/react-markdown-preview'), { ssr: false });

const Reader: FC = () => {
  const { connected, wallet, publicKey, requestTransaction, requestRecords } = useWallet();
  const newsletter = useSelector(selectNewsletter);
  const title = useSelector(selectTitle);
  const content = useSelector(selectContent);
  const individual_private_key: string = useSelector(selectIndividualPrivateKey);
  const individual_public_key: string = useSelector(selectIndividualPublicKey);
  const privacy_mode: boolean = useSelector(selectPrivacyMode);
  const dispatch = useDispatch<AppDispatch>();

  // Get the inital secret as a random string of chacters from a whole number
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
    // newsletter: Newsletter, secret: Bytes64, shared_public_key: Bytes64, shared_recipient: Bytes64
    const secret_bigint = padArray(splitStringToBigInts(individual_private_key), 4);
    const shared_public_key_bigints = padArray(splitStringToBigInts(individual_public_key), 4);
    const shared_recipient_bigints = padArray(splitStringToBigInts(publicKey), 4);

    // The newsletter here is an output from the Requesting Records above
    const inputs = [
      newsletter,
      `${format_bigints(secret_bigint)}`,
      `${format_bigints(shared_public_key_bigints)}`,
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

    try {
      if (requestTransaction) {
        // Returns a transaction Id, that can be used to check the status. Note this is not the on-chain transaction id
        const txId = (await requestTransaction(aleoTransaction)) || '';
        setTransactionId(txId);
      }
    } catch (e: any) {
      console.log(aleoTransaction, 'Transaction Failed');
    }
  };

  const getTransactionStatus = async (txId: string) => {
    const status = await (wallet?.adapter as LeoWalletAdapter).transactionStatus(txId);
    setStatus(status);
    if (status === 'Finalized' || status === 'Completed') {
      setStatus(undefined);
      setTransactionId(undefined);
      dispatch(fetchRecords({ connected: connected, requestRecords: requestRecords }));
    }
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
          {newsletter && newsletter.data && newsletter.data.op !== publicKey && newsletter.data.revision && (
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
        <MDPreview source={content} />
      </div>
      <div className="App-footer"></div>
    </section>
  );
};

export default Reader;
