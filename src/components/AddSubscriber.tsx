import { Transaction, WalletAdapterNetwork, WalletNotConnectedError } from '@demox-labs/aleo-wallet-adapter-base';
import { WalletContextState } from '@demox-labs/aleo-wallet-adapter-react';
import React, { ChangeEvent, useEffect } from 'react';
import Toggle from 'react-toggle';
import { NewsletterRecord } from '@/lib/util';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';

interface Props {
  programId: string;
  useWallet: () => WalletContextState;
  record: NewsletterRecord | undefined;
}

export const AddSubscriber = ({ programId, useWallet, record }: Props) => {
  const { wallet, publicKey, requestTransaction } = useWallet();

  const [invite_mode, setIsInviteMode] = React.useState<boolean>(false);
  const [address, setAddress] = React.useState<string>('');
  const [fee, setFee] = React.useState<number>(3.33);
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
    console.log(record);

    // The record here is an output from the Requesting Records above
    const inputs = [JSON.stringify(record.data), address];

    console.log(inputs);

    const fee_microcredits = 1_000_000 * fee; // This will fail if fee is not set high enough

    const aleoTransaction = Transaction.createTransaction(
      publicKey,
      WalletAdapterNetwork.Testnet,
      programId,
      'invite',
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
                setFee(parseInt(e.target.value));
              }}
            />
            <button disabled={!publicKey || !address} className="App-nav-button send-invite">
              Send Invite
            </button>
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
