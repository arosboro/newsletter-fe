/**
 * ReaderToolbar.tsx
 *
 * This component represents a sidebar in the Consume page that aids readers in managing invites and subscriptions
 * and finding issues to read/consume.
 */
import React, { FC, useEffect } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { AppDispatch } from '@/app/store';
import { useDispatch, useSelector } from 'react-redux';
import {
  NewsletterRecord,
  selectUnspentInvites,
  selectIssues,
  selectNewsletter,
  setNewsletter,
  setContent,
  setTitle,
  setTemplate,
  DeliveryDraft,
  selectUnspentNewsletters,
} from '@/features/newsletters/newslettersSlice';
import {
  SharedSecretMapping,
  SubscriberList,
  selectNewsletterSubscribers,
} from '@/features/subscriptions/subscriptionsSlice';
import { Transaction, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base';
import { NewsletterProgramId } from '@/aleo/newsletter-program';
import { fetchRecords } from '@/features/records/recordsSlice';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';

const ReaderToolbar: FC = () => {
  // Wallet integration hooks
  const { connected, publicKey, wallet, requestTransaction, requestRecords } = useWallet();

  // Redux integration hooks for selecting various properties and managing state.
  // - `invites`: A list of newsletters the current reader has been invited to.
  // - `issues`: The list of individual issues for a particular newsletter.
  // - `newsletters`: A list of all newsletters available.
  // - `newsletter`: The currently selected newsletter.
  // - `subscribers`: The list of subscribers for each newsletter.
  const invites = useSelector(selectUnspentInvites);
  const issues: DeliveryDraft[] = useSelector(selectIssues);
  const newsletters: NewsletterRecord[] = useSelector(selectUnspentNewsletters);
  const newsletter: NewsletterRecord = useSelector(selectNewsletter);
  const subscribers: SubscriberList = useSelector(selectNewsletterSubscribers);
  const dispatch = useDispatch<AppDispatch>();

  // Local state for managing if the user is a subscriber and for transaction statuses.
  const [isSubscriber, setIsSubscriber] = React.useState<object>({});
  const [status, setStatus] = React.useState<string | undefined>();
  const [transactionId, setTransactionId] = React.useState<string | undefined>();

  /**
   * This effect is responsible for identifying and setting whether the currently
   * connected user (via their `publicKey`) is a subscriber to any of the newsletters.
   * It updates the `isSubscriber` state based on this assessment.
   */
  useEffect(() => {
    newsletters.forEach((newsletter: NewsletterRecord) => {
      if (newsletter && newsletter.id && subscribers[newsletter.data.id]) {
        // Check if the current user's `publicKey` is in the subscriber list of the current newsletter.
        const isThisSubscriber = subscribers[newsletter.data.id].some((subscriber) => {
          return subscriber.secret.recipient === (publicKey as string);
        });

        // Update the `isSubscriber` state based on the above check.
        setIsSubscriber((prev) => ({ ...prev, [newsletter.data.id]: isThisSubscriber }));
      }
    });
  }, [newsletters, subscribers, publicKey]);

  /**
   * Asynchronously handles the unsubscription action from a newsletter.
   *
   * @param value - The shared secret mapping representing a subscription. If not provided, an error is thrown.
   */
  const handleUnsub = async (value: SharedSecretMapping | undefined) => {
    if (!value) {
      throw new Error('No newsletter found');
    }

    const inputs = [value.subscription];
    const fee_value: number = parseFloat('1.0') || 1.0;
    const fee_microcredits = 1_000_000 * fee_value; // Potential failure if fee isn't set high enough.

    if (publicKey) {
      const aleoTransaction = Transaction.createTransaction(
        publicKey,
        WalletAdapterNetwork.Testnet,
        NewsletterProgramId,
        'unsub',
        inputs,
        fee_microcredits,
      );

      try {
        // Attempt the unsubscription transaction.
        if (requestTransaction) {
          const txId = (await requestTransaction(aleoTransaction)) || '';
          setTransactionId(txId);
        }
      } catch (e: any) {
        console.error('Transaction Failed', aleoTransaction);
      }
    }
  };

  /**
   * Queries the transaction status for a given transaction ID and updates the local state
   * based on the transaction's status.
   *
   * @param txId - The transaction ID to check the status for.
   */
  const getTransactionStatus = async (txId: string) => {
    const status = await (wallet?.adapter as LeoWalletAdapter).transactionStatus(txId);
    setStatus(status);

    // Reset state for finalized or completed transactions.
    if (status === 'Finalized' || status === 'Completed') {
      setStatus(undefined);
      setTransactionId(undefined);
      dispatch(fetchRecords({ connected: connected, requestRecords: requestRecords }));
    }
  };

  /**
   * This effect sets up an interval that continuously checks the status of an
   * ongoing transaction, given by `transactionId`, until its completion.
   */
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    if (transactionId) {
      intervalId = setInterval(() => {
        getTransactionStatus(transactionId);
      }, 1000);
    }

    // Cleanup: Clear the interval when the component is unmounted or when the transaction completes.
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [transactionId]);

  return (
    <aside className="App-nav">
      <input className="App-nav-input" placeholder="Filter" />
      <hr />
      {newsletter && !newsletter.id && <i>Draft Preview</i>}
      {connected && (
        <>
          {invites.length >= 1 && (
            <>
              <h4>Invites</h4>
              <ul className="App-nav-list">
                {invites.map((value: NewsletterRecord, index: number) => (
                  <li className="{App-nav-list-item" key={index}>
                    <a
                      href="/#"
                      onClick={(e) => {
                        e.preventDefault();
                        dispatch(setNewsletter({ newsletter: value, subscribers: subscribers }));
                      }}
                      className="App-nav-list-item-link"
                    >
                      {(value && newsletter && value.id == newsletter.id && value.data && value.data.title && (
                        <i>{value.data.title}</i>
                      )) ||
                        (value && value.data && value.data.title && value.data.title)}
                    </a>{' '}
                    {isSubscriber[value.data.id] && (
                      <button
                        className="App-nav-list-item-button"
                        onClick={() => {
                          handleUnsub(
                            subscribers[value.data.id].find((subscriber) => subscriber.secret.recipient === publicKey),
                          );
                        }}
                      >
                        unsub
                      </button>
                    )}
                    {transactionId && (
                      <div>
                        <div>{`Transaction status: ${status}`}</div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <hr />
            </>
          )}
          {connected && newsletters.some((newsletter: NewsletterRecord) => isSubscriber[newsletter.data.id]) && (
            <>
              <h4>Newsletters</h4>
              <ul className="App-nav-list">
                {newsletters
                  .filter((letter: NewsletterRecord) => isSubscriber[letter.data.id])
                  .map((value: NewsletterRecord, index: number) => (
                    <li className="App-nav-list-item" key={index}>
                      <a
                        href="/#"
                        onClick={(e) => {
                          e.preventDefault();
                          dispatch(setNewsletter({ newsletter: value, subscribers: subscribers }));
                        }}
                        className="App-nav-list-item-link"
                      >
                        {(value && newsletter && value.id == newsletter.id && value.data && value.data.title && (
                          <i>{value.data.title}</i>
                        )) ||
                          (value && value.data && value.data.title && value.data.title)}
                      </a>
                    </li>
                  ))}
              </ul>
              {newsletter && newsletter.id && issues && issues.length >= 1 && (
                <>
                  <hr />
                  <h4>Issues</h4>
                  <ul className="App-nav-list">
                    {issues.map((value: DeliveryDraft, index: number) => (
                      <li className={'App-nav-list-item'} key={index}>
                        <a
                          href="/#"
                          onClick={(e) => {
                            e.preventDefault();
                            dispatch(setTitle(value.title as string));
                            dispatch(setContent(value.content as string));
                            dispatch(setTemplate(value.template as string));
                          }}
                          className="App-nav-list-item-link"
                        >
                          {(index + ' - ' + value.title) as string}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </>
      )}
    </aside>
  );
};

export default ReaderToolbar;
