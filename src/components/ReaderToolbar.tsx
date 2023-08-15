import React, { FC } from 'react';
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
import { SubscriberList, selectNewsletterSubscribers } from '@/features/subscriptions/subscriptionsSlice';
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
  const invites = useSelector(selectUnspentInvites);
  const issues: DeliveryDraft[] = useSelector(selectIssues);
  const newsletters: NewsletterRecord[] = useSelector(selectUnspentNewsletters);
  const newsletter: NewsletterRecord = useSelector(selectNewsletter);
  const subscribers: SubscriberList = useSelector(selectNewsletterSubscribers);
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
          {connected && (
            <>
              <h4>Newsletters</h4>
              <ul className="App-nav-list">
                {newsletters.map((value: NewsletterRecord, index: number) => (
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
              {newsletter && newsletter.id && (
                <>
                  <hr />
                  <h4>Issues</h4>
                  <ul className="App-nav-list">
                    {issues &&
                      issues.length >= 1 &&
                      issues.map((value: DeliveryDraft, index: number) => (
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
