import React, { FC } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { AppDispatch } from '@/app/store';
import { useDispatch, useSelector } from 'react-redux';
import {
  NewsletterRecord,
  selectUnspentInvites,
  selectIsLoading,
  selectIssues,
  selectNewsletter,
  setNewsletter,
} from '@/features/newsletters/newslettersSlice';
// import { SharedSecretMapping, selectUnspentSubscriptions } from '@/features/subscriptions/subscriptionsSlice';

// interface Props {
//   programId: string;
//   useWallet: () => WalletContextState;
//   privacy: boolean;
//   record: NewsletterRecord | undefined;
//   setRecord: Dispatch<SetStateAction<NewsletterRecord | undefined>>;
//   status: string | undefined;
//   setStatus: Dispatch<SetStateAction<string | undefined>>;
// }

const ReaderToolbar: FC = () => {
  const { connected } = useWallet();
  const isLoading: boolean = useSelector(selectIsLoading);
  const invites = useSelector(selectUnspentInvites);
  const issues: NewsletterRecord[] = useSelector(selectIssues);
  const newsletter: NewsletterRecord = useSelector(selectNewsletter);
  // const subscriptions: SharedSecretMapping[] = useSelector(selectUnspentSubscriptions);
  const dispatch = useDispatch<AppDispatch>();

  // const handleUnsub = async (value: NewsletterRecord) => {
  // // value.data.id.slice(0, -8) will match an object in subscriptions with the same path.
  // setSubscription(
  //   subscriptions.find((subscription: SubscriptionRecord) => {
  //     return subscription.data.id.slice(0, -8) === value.data.id.slice(0, -8);
  //   }),
  // );
  // if (subscription) {
  //   // const res = await unsubscribe(subscription);
  //   // console.log(res);
  // }
  // };

  return (
    <aside className="App-nav">
      <input className="App-nav-input" placeholder="Filter" />
      <hr />
      {newsletter && !newsletter.id && <i>Draft Preview</i>}
      {connected && !isLoading && (
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
                        dispatch(setNewsletter(value));
                      }}
                      className="App-nav-list-item-link"
                    >
                      {(value && newsletter && value.id == newsletter.id && value.data && value.data.title && (
                        <i>{value.data.title}</i>
                      )) ||
                        (value && value.data && value.data.title && value.data.title)}
                    </a>
                    &nbsp;
                    <button
                      onClick={() => {
                        // handleUnsub(value);
                      }}
                      className="App-nav-list-item-button"
                    >
                      x
                    </button>
                  </li>
                ))}
              </ul>
              <hr />
            </>
          )}

          {issues.length >= 1 && (
            <>
              <h4>Newsletters</h4>
              <ul className="App-nav-list">
                {issues.map((value: NewsletterRecord, index: number) => (
                  <li className={value.id + ' App-nav-list-item'} key={index}>
                    <a
                      href="/#"
                      onClick={(e) => {
                        e.preventDefault();
                        dispatch(setNewsletter(value));
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
              {newsletter && newsletter.id && (
                <>
                  <hr />
                  <h4>Subscribers</h4>
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
