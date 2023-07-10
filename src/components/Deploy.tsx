import React, { FC, useState, useEffect, ChangeEvent } from 'react';
import useSWR from 'swr';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { Deployment, WalletAdapterNetwork, WalletNotConnectedError } from '@demox-labs/aleo-wallet-adapter-base';
import { NewsletterProgram, NewsletterProgramId } from '../aleo/newsletter-program';
import { TESTNET3_API_URL, getProgram } from '@/aleo/rpc';
import { WalletMultiButton } from '@demox-labs/aleo-wallet-adapter-reactui';
import './Deploy.css';

const Deploy: FC = () => {
  const { wallet, publicKey } = useWallet();
  const { data, error, isLoading } = useSWR('programData', () => getProgram(NewsletterProgramId, TESTNET3_API_URL));

  const [program, _setProgram] = useState(NewsletterProgram);
  const [fee, setFee] = useState<string>('80');
  const [transactionId, setTransactionId] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    if (transactionId) {
      intervalId = setInterval(() => {
        getTransactionStatus(transactionId!);
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

    const aleoDeployment = new Deployment(
      publicKey,
      WalletAdapterNetwork.Testnet,
      program,
      Math.floor(parseFloat(fee) * 1_000_000),
    );

    const txId = (await (wallet?.adapter as LeoWalletAdapter).requestDeploy(aleoDeployment)) || '';
    setTransactionId(txId);
  };

  const getTransactionStatus = async (txId: string) => {
    const status = await (wallet?.adapter as LeoWalletAdapter).transactionStatus(txId);
    setStatus(status);
  };

  return (
    <section className="Reader">
      <header className="App-header">
        <h1>Get Ready to Send It.</h1>
        <WalletMultiButton />
      </header>
      <div className="App-sidebar">
        <aside className="App-nav"></aside>
      </div>
      <div className="App-body">
        {isLoading && <p>Loading...</p>}
        {!isLoading && data && (
          <div className="program-deployed">
            {`${NewsletterProgramId}`} is already deployed{' '}
            <a
              target="_blank"
              rel="noopener noreferrer"
              className="underline mt-4"
              href={`https://explorer.hamp.app/program?id=${NewsletterProgramId}`}
            >
              View on Explorer
            </a>
          </div>
        )}
        {!isLoading && !data && (
          <form noValidate role="search" onSubmit={handleSubmit} className="program-form">
            <label>
              Program:
              <textarea className="program-input" rows={12} value={program} disabled={true} />
            </label>

            <label>
              Fee (in credits):
              <input
                placeholder="Fee (in microcredits)"
                onChange={(event) => {
                  if (/^\d*(\.\d*)?$/.test(event.currentTarget.value)) {
                    setFee(event.currentTarget.value);
                  }
                }}
                value={fee}
              />
            </label>
            <div className="program-deploy">
              <button
                disabled={!publicKey || !program || fee === undefined}
                type="submit"
                className="program-deploy-button"
              >
                {!publicKey ? 'Connect Your Wallet' : 'Submit'}
              </button>
            </div>
          </form>
        )}

        {transactionId && (
          <div>
            <div>{`Transaction status: ${status}`}</div>
          </div>
        )}
      </div>
      <div className="App-footer"></div>
    </section>
  );
};

export default Deploy;
