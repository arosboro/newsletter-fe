import React, { FC } from 'react';
import {
  NewsletterRecord,
  selectIsLoading,
  selectUnspentNewsletters,
  selectNewsletter,
  setNewsletter,
  initDraft,
  fetchExample,
} from '@/features/newsletters/newslettersSlice';
import { AddSubscriber } from '@/components/AddSubscriber';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '@/app/store';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import {
  SharedSecretMapping,
  SubscriberList,
  selectNewsletterSubscribers,
} from '@/features/subscriptions/subscriptionsSlice';

const EditorToolbar: FC = () => {
  const { connected, publicKey } = useWallet();
  const isLoading: boolean = useSelector(selectIsLoading);
  const newsletters: NewsletterRecord[] = useSelector(selectUnspentNewsletters);
  const newsletter: NewsletterRecord = useSelector(selectNewsletter);
  const subscribers: SubscriberList = useSelector(selectNewsletterSubscribers);
  const dispatch = useDispatch<AppDispatch>();

  return (
    <aside className="App-nav">
      <button className="App-nav-button" onClick={() => dispatch(initDraft())}>
        New
      </button>
      &nbsp;
      <button className="App-nav-button" onClick={() => dispatch(fetchExample())}>
        Example
      </button>
      <hr />
      <input className="App-nav-input" placeholder="Filter" />
      <hr />
      {connected && !isLoading && (
        <>
          <h4>Newsletters</h4>
          <ul className="App-nav-list">
            {newsletters.map((value: NewsletterRecord, index: number) => (
              <li className="{App-nav-list-item" key={index}>
                <a href="/#" onClick={() => dispatch(setNewsletter(value))} className="App-nav-list-item-link">
                  {(value && newsletter && value.id == newsletter.id && value.data && value.data.title && (
                    <i>{value.data.title}</i>
                  )) ||
                    (value && value.data && value.data.title && value.data.title)}
                </a>
              </li>
            ))}
          </ul>
          {newsletter && newsletter.id && newsletter.data.op === publicKey && (
            <>
              <hr />
              <h4>Subscribers</h4>
              <AddSubscriber />
              <ul className="App-nav-list">
                {subscribers &&
                  subscribers[newsletter.data.id] &&
                  subscribers[newsletter.data.id].map((value: SharedSecretMapping, index: number) => (
                    <li className="{App-nav-list-item" key={index}>
                      <a href="/#" className="App-nav-list-item-link">
                        {value.subscription.data.member_sequence} - {value.secret.recipient}
                      </a>
                    </li>
                  ))}
              </ul>
            </>
          )}
        </>
      )}
    </aside>
  );
};

export default EditorToolbar;
