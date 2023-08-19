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
  const { connected, publicKey, wallet, requestTransaction, requestRecords } = useWallet();
  const invites = useSelector(selectUnspentInvites);
  const issues: DeliveryDraft[] = useSelector(selectIssues);
  const newsletters: NewsletterRecord[] = useSelector(selectUnspentNewsletters);
  const newsletter: NewsletterRecord = useSelector(selectNewsletter);
  const subscribers: SubscriberList = useSelector(selectNewsletterSubscribers);
  const dispatch = useDispatch<AppDispatch>();

  const [isSubscriber, setIsSubscriber] = React.useState<object>({});
  const [status, setStatus] = React.useState<string | undefined>();
  const [transactionId, setTransactionId] = React.useState<string | undefined>();

  useEffect(() => {
    newsletters.forEach((newsletter: NewsletterRecord) => {
      if (newsletter && newsletter.id && subscribers[newsletter.data.id]) {
        // Determine if the individual_public_key is in subscribers.
        const isThisSubscriber = subscribers[newsletter.data.id].some((subscriber) => {
          return subscriber.secret.recipient === (publicKey as string);
        });
        console.log(isThisSubscriber, 'isThisSubscriber');
        if (isThisSubscriber) {
          // If the individual_public_key is in subscribers, then show subscribers.
          // Set the index where isSusbscriber with key newsletter.data.id is true.
          console.log(newsletter.data.id, 'newsletter.data.id');
          setIsSubscriber({ ...isSubscriber, [newsletter.data.id]: true });
        } else {
          // If the individual_public_key is not in subscribers, then hide subscribers.
          setIsSubscriber({ ...isSubscriber, [newsletter.data.id]: false });
        }
        console.log(isSubscriber, 'isSubscriber');
      }
    });
  }, [newsletters, subscribers, publicKey]);

  const handleUnsub = async (value: SharedSecretMapping | undefined) => {
    // The newsletter here is an output from the Requesting Records above
    if (value === undefined) {
      throw new Error('No newsletter found');
    }
    const inputs = [value.subscription];

    const fee_value: number = parseFloat('1.0') || 1.0;

    const fee_microcredits = 1_000_000 * fee_value; // This will fail if fee is not set high enough

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
        if (requestTransaction) {
          // Returns a transaction Id, that can be used to check the status. Note this is not the on-chain transaction id
          const txId = (await requestTransaction(aleoTransaction)) || '';
          setTransactionId(txId);
        }
      } catch (e: any) {
        console.log(aleoTransaction, 'Transaction Failed');
      }
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
