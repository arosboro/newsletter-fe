import { Transaction, WalletAdapterNetwork, WalletNotConnectedError } from '@demox-labs/aleo-wallet-adapter-base';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import React, { ChangeEvent, useEffect } from 'react';
import Toggle from 'react-toggle';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { NewsletterProgramId } from '@/aleo/newsletter-program';
import { AppDispatch } from '@/app/store';
import { useDispatch, useSelector } from 'react-redux';
import { selectRawNewsletter } from '@/features/newsletters/newslettersSlice';
import { fetchRecords } from '@/features/records/recordsSlice';

export const AddSubscriber = () => {
  const { connected, wallet, publicKey, requestTransaction, requestRecords } = useWallet();

  const record = useSelector(selectRawNewsletter);
  const dispatch = useDispatch<AppDispatch>();

  const [invite_mode, setIsInviteMode] = React.useState<boolean>(false);
  const [address, setAddress] = React.useState<string>('');
  const [fee, setFee] = React.useState<string>('1.508807');
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

  const handleSubmit = async (event: ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!publicKey) throw new WalletNotConnectedError();
    if (!record) throw new Error('No record found');

    // The record here is an output from the Requesting Records above
    const inputs = [record, address];

    const fee_value: number = parseFloat(fee) || 1.0;

    const fee_microcredits = 1_000_000 * fee_value; // This will fail if fee is not set high enough

    const aleoTransaction = Transaction.createTransaction(
      publicKey,
      WalletAdapterNetwork.Testnet,
      NewsletterProgramId,
      'invite',
      inputs,
      fee_microcredits,
    );

    if (requestTransaction) {
      // Returns a transaction Id, that can be used to check the status. Note this is not the on-chain transaction id
      try {
        const txId = (await requestTransaction(aleoTransaction)) || '';
        setTransactionId(txId);
      } catch (e) {
        console.log('Transaction failed', aleoTransaction);
      }
    }
  };

  const getTransactionStatus = async (txId: string) => {
    const status = await (wallet?.adapter as LeoWalletAdapter).transactionStatus(txId);
    setStatus(status);
    if (status === 'Finalized') {
      setStatus(undefined);
      dispatch(fetchRecords({ connected: connected, requestRecords: requestRecords }));
    }
  };

  return (
    <>
      <label htmlFor="invite-toggle">
        Add Subscriber
        <Toggle
          id="invite-toggle"
          defaultChecked={invite_mode}
          onChange={() => {
            setIsInviteMode(!invite_mode);
          }}
        />
      </label>
      {invite_mode && (
        <>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              className="App-nav-input"
              placeholder="Address"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
              }}
            />
            <label htmlFor="invite-fee">Fee</label>
            <input
              type="text"
              id="invite-fee"
              className="App-nav-input"
              placeholder="Fee"
              value={fee}
              onChange={(e) => {
                setFee(e.target.value || '0.0');
              }}
            />
            <input type="submit" disabled={!publicKey || !address} className="send-invite" value="Send Invite" />
          </form>
          {transactionId && (
            <div>
              <div>{`Transaction status: ${status}`}</div>
            </div>
          )}
        </>
      )}
    </>
  );
};
