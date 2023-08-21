import React, { FC, useEffect, useState } from 'react';
import {
  NewsletterRecord,
  selectUnspentNewsletters,
  selectNewsletter,
  setNewsletter,
  initDraft,
  fetchExample,
  selectRecipients,
  DeliveryDraft,
  setSelectedRecipients,
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
import { truncateAddress } from '@/lib/util';

/**
 * EditorToolbar provides the user with a set of actions and interfaces to manage
 * newsletters and their subscribers.
 *
 * The toolbar includes functionalities like creating new drafts, fetching example newsletters,
 * selecting existing newsletters, and managing subscribers for a selected newsletter.
 */
const EditorToolbar: FC = () => {
  // Wallet integration hooks
  const { connected, publicKey } = useWallet();

  // Redux integration hooks
  const newsletters: NewsletterRecord[] = useSelector(selectUnspentNewsletters);
  const newsletter: NewsletterRecord = useSelector(selectNewsletter);
  const subscribers: SubscriberList = useSelector(selectNewsletterSubscribers);
  const selected_recipients: DeliveryDraft[] = useSelector(selectRecipients);
  const dispatch = useDispatch<AppDispatch>();

  // Component local states
  const [isToggleAll, setIsToggleAll] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState(false);

  /**
   * This effect determines if the current user is a subscriber and updates the state accordingly.
   * The user is considered a subscriber if their publicKey matches either the owner
   * of the newsletter or any of its existing subscribers.
   */
  useEffect(() => {
    if (newsletter && newsletter.id && subscribers[newsletter.data.id]) {
      // Determine if the individual_public_key is in subscribers.
      const isSubscriber =
        newsletter.data.op == newsletter.owner ||
        subscribers[newsletter.data.id].some((subscriber) => {
          return subscriber.secret.recipient === (publicKey as string);
        });
      if (isSubscriber) {
        // If the individual_public_key is in subscribers, then show subscribers.
        setIsSubscriber(true);
      } else {
        // If the individual_public_key is not in subscribers, then hide subscribers.
        setIsSubscriber(false);
      }
    }
  }, [newsletter, subscribers, publicKey]);

  /**
   * Determines if a subscriber is already selected as a recipient.
   *
   * @param {SharedSecretMapping} subscriber - The subscriber to check.
   * @returns {boolean} - True if the subscriber is selected, otherwise false.
   */
  const isRecipientSelected = (subscriber: SharedSecretMapping): boolean => {
    const recipient: string = subscriber.secret.recipient as string;
    return selected_recipients.some((item) => item.recipient === recipient);
  };

  const handleCheckboxChange = (subscriber: SharedSecretMapping) => {
    const isSelected = isRecipientSelected(subscriber);
    const delivery_draft: DeliveryDraft = deriveDeliveryDraft(subscriber);
    const updatedRecipients = isSelected
      ? selected_recipients.filter((item) => item.recipient !== subscriber.secret.recipient)
      : [...selected_recipients, delivery_draft];

    dispatch(setSelectedRecipients(updatedRecipients));
  };

  /**
   * Handles the change event for subscriber checkboxes.
   *
   * @param {SharedSecretMapping} subscriber - The subscriber associated with the checkbox.
   * @returns {DeliveryDraft} - The delivery draft associated with the subscriber.
   */
  const deriveDeliveryDraft = (subscriber: SharedSecretMapping): DeliveryDraft => {
    const recipient: string = subscriber.secret.recipient as string;
    const shared_public_key: string = subscriber.secret.shared_public_key as string;
    const sender: SharedSecretMapping | undefined = subscribers[newsletter.data.id]
      .filter((subscriber: SharedSecretMapping) => {
        return subscriber.secret.recipient === (publicKey as string);
      })
      .pop();
    if (sender) {
      const payload = {
        recipient: recipient,
        shared_public_key: shared_public_key,
        sender_public_key: sender.secret.shared_public_key,
        title: null,
        template: null,
        content: null,
      };
      return payload;
    }
    return {} as DeliveryDraft;
  };

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
      {connected && (
        <>
          <h4>Newsletters</h4>
          <ul className="App-nav-list">
            {newsletters.map((value: NewsletterRecord, index: number) => (
              <li className="App-nav-list-item" key={index}>
                <a
                  href="/#"
                  onClick={() => dispatch(setNewsletter({ newsletter: value, subscribers: subscribers }))}
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
          {newsletter && newsletter.id && isSubscriber && (
            <>
              <hr />
              <h4>Subscribers</h4>
              {newsletter.data.op === publicKey && <AddSubscriber />}
              <ul className="App-nav-list">
                <li className="App-nav-list-item">
                  <label>
                    <span className="checkbox-label">All</span>
                    <input
                      type="checkbox"
                      className="checkbox-input"
                      checked={isToggleAll}
                      onChange={() => {
                        const delivery_drafts: DeliveryDraft[] = subscribers[newsletter.data.id].map((subscriber) => {
                          return deriveDeliveryDraft(subscriber);
                        });
                        isToggleAll
                          ? dispatch(setSelectedRecipients([]))
                          : dispatch(setSelectedRecipients(delivery_drafts));
                        setIsToggleAll(!isToggleAll);
                      }}
                    />
                  </label>
                </li>
                {subscribers &&
                  subscribers[newsletter.data.id] &&
                  subscribers[newsletter.data.id].map((value: SharedSecretMapping, index: number) => (
                    <li className="App-nav-list-item" key={index}>
                      <label>
                        <span className="checkbox-label">
                          {value.sequence + ' - ' + truncateAddress(value.secret.recipient as string)}
                        </span>
                        <input
                          type="checkbox"
                          className="checkbox-input"
                          checked={isRecipientSelected(value)} // Check if subscriber is selected
                          onChange={() => handleCheckboxChange(value)} // Handle checkbox change
                        />
                      </label>
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
