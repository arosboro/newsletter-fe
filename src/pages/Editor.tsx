import React, { ChangeEvent, FC, useEffect } from 'react';
import Toggle from 'react-toggle';
import EditorToolbar from '@/components/EditorToolbar';
import './Editor.css';
import { WalletMultiButton } from '@demox-labs/aleo-wallet-adapter-reactui';
import { Transaction, WalletAdapterNetwork, WalletNotConnectedError } from '@demox-labs/aleo-wallet-adapter-base';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { NewsletterProgramId } from '@/aleo/newsletter-program';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import {
  padArray,
  splitStringToBigInts,
  ipfsAdd,
  ipfsRm,
  format_bigints,
  format_u8s,
  encryptGroupMessage,
  decryptGroupMessage,
} from '@/lib/util';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '@/app/store';
import {
  selectContent,
  selectContentNonce,
  selectContentCiphertext,
  selectTemplateMode,
  selectPrivacyMode,
  selectTemplate,
  selectTemplateNonce,
  selectTemplateCiphertext,
  selectTitle,
  selectTitleNonce,
  selectTitleCiphertext,
  setTitle,
  setTemplate,
  setContent,
  togglePrivacyMode,
  toggleTemplateMode,
  selectGroupSecret,
  selectIndividualPrivateKey,
  NewsletterRecord,
  selectNewsletter,
  selectIndividualPublicKey,
  selectRecipients,
  selectRawNewsletter,
  draftSelectedRecipients,
  DeliveryDraft,
} from '@/features/newsletters/newslettersSlice';
import 'react-toggle/style.css';
import '@demox-labs/aleo-wallet-adapter-reactui/styles.css';
import { fetchRecords } from '@/features/records/recordsSlice';
import dynamic from 'next/dynamic';
import { SubscriberList, selectNewsletterSubscribers } from '@/features/subscriptions/subscriptionsSlice';

// Dynamically import the editor to avoid SSR issues
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

/**
 * Editor component provides the user with a set of actions and interfaces to manage
 * newsletters and their subscribers.
 */
const Editor: FC = () => {
  // Wallet integration hooks
  const { connected, wallet, publicKey, requestTransaction, requestRecords } = useWallet();

  // Redux integration hooks
  const title = useSelector(selectTitle);
  const title_nonce = useSelector(selectTitleNonce);
  const template = useSelector(selectTemplate);
  const template_nonce = useSelector(selectTemplateNonce);
  const content = useSelector(selectContent);
  const content_nonce = useSelector(selectContentNonce);
  const title_ciphertext = useSelector(selectTitleCiphertext);
  const template_ciphertext = useSelector(selectTemplateCiphertext);
  const content_ciphertext = useSelector(selectContentCiphertext);
  const template_mode = useSelector(selectTemplateMode);
  const privacy_mode: boolean = useSelector(selectPrivacyMode);
  const group_symmetric_key: string = useSelector(selectGroupSecret);
  const individual_private_key: string = useSelector(selectIndividualPrivateKey);
  const individual_public_key: string = useSelector(selectIndividualPublicKey);
  const newsletter: NewsletterRecord = useSelector(selectNewsletter);
  const subscribers: SubscriberList = useSelector(selectNewsletterSubscribers);
  const selected_recipients = useSelector(selectRecipients);
  const record = useSelector(selectRawNewsletter);
  const dispatch = useDispatch<AppDispatch>();

  // Component local states
  const [shared_public_key, setSharedPublicKey] = React.useState('');
  const [shared_recipient, setSharedRecipient] = React.useState('');
  const [fee, setFee] = React.useState<string>('5.0365');
  const [transactionId, setTransactionId] = React.useState<string | undefined>();
  const [status, setStatus] = React.useState<string | undefined>();
  const [is_issue_valid, setIsIssueValid] = React.useState<boolean | undefined>();
  const [isSubscriber, setIsSubscriber] = React.useState(false);
  const [isOp, setIsOp] = React.useState(false);

  /**
   * This effect determines if the current user is a subscriber and updates the state accordingly.
   * The user is considered a subscriber if their publicKey matches either the owner
   * or the recipient of a subscription record.
   * If the user is a subscriber, the `isSubscriber` state is set to `true`.
   * If the user is not a subscriber, the `isSubscriber` state is set to `false`.
   */
  useEffect(() => {
    if (newsletter && newsletter.id && subscribers[newsletter.data.id]) {
      // Determine if the individual_public_key is in subscribers.
      const isSubscriber = subscribers[newsletter.data.id].some((subscriber) => {
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
   * This effect determines if the current user is the owner of the newsletter and updates the state accordingly.
   * The user is considered the owner if their publicKey matches the owner of the newsletter.
   * If the user is the owner, the `isOp` state is set to `true`.
   * If the user is not the owner, the `isOp` state is set to `false`.
   */
  useEffect(() => {
    if (newsletter && newsletter.id && newsletter.data.op === (publicKey as string)) {
      setIsOp(true);
    } else {
      setIsOp(false);
    }
  }, [newsletter, publicKey]);

  /**
   * This effect is used to check the status of the transaction.
   * The effect will continuously poll for the transaction status when a transactionId is available.
   */
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

  /**
   * This effect is used to set the sharedSecret and sharedRecipient.
   * The effect will set the sharedSecret and sharedRecipient when the individual_public_key and publicKey are available.
   */
  useEffect(() => {
    // set the sharedSecret and sharedRecipient
    if (!publicKey || !individual_public_key) return;
    setSharedPublicKey(individual_public_key);
    setSharedRecipient(publicKey);
  }, [individual_public_key, publicKey]);

  /**
   * This effect keeps the encrypted copies of an issue in sync before the deliver call is made.
   * The effect will update the encrypted copies of an issue when the title, template, or content changes.
   */
  useEffect(() => {
    dispatch(draftSelectedRecipients());
    const valid_issue = selected_recipients.some(
      (issue: DeliveryDraft) => issue.title !== null && issue.template !== null && issue.content !== null,
    );
    setIsIssueValid(valid_issue);
  }, [title, template, content, dispatch]);

  /**
   * Call the `main` transition of the newsletter program to create a new newsletter.
   * @param event
   */
  const handleCreateNewsletter = async (event: ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!publicKey) throw new WalletNotConnectedError();

    // Make immutable hash of the string values.
    const title_address = await ipfsAdd(title_ciphertext.ciphertext);
    const template_address = await ipfsAdd(template_ciphertext.ciphertext);
    const content_address = await ipfsAdd(content_ciphertext.ciphertext);
    const title_bigints = padArray(splitStringToBigInts(title_address.Hash), 4);
    const template_bigints = padArray(splitStringToBigInts(template_address.Hash), 4);
    const content_bigints = padArray(splitStringToBigInts(content_address.Hash), 4);
    const group_symmetric_key_bigints = padArray(splitStringToBigInts(group_symmetric_key), 4);
    const individual_private_key_bigints = padArray(splitStringToBigInts(individual_private_key), 4);
    const shared_public_key_bigints = padArray(splitStringToBigInts(shared_public_key), 4);
    const shared_recipient_bigints = padArray(splitStringToBigInts(shared_recipient), 4);

    // Desired format is a string of the form:
    // `{ b0: ${bigint[0]}u128, b1: ${bigint[1]}u128, ... }`

    // The record here is an output from the Requesting Records above
    const inputs = [
      `${format_bigints(title_bigints)}`,
      `${format_u8s(title_nonce)}`,
      `${format_bigints(template_bigints)}`,
      `${format_u8s(template_nonce)}`,
      `${format_bigints(content_bigints)}`,
      `${format_u8s(content_nonce)}`,
      `${format_bigints(group_symmetric_key_bigints)}`,
      `${format_bigints(individual_private_key_bigints)}`,
      `${format_bigints(shared_public_key_bigints)}`,
      `${format_bigints(shared_recipient_bigints)}`,
    ];

    const fee_value: number = parseFloat(fee) || 1.0;

    const fee_microcredits = 1_000_000 * fee_value; // This will fail if fee is not set high enough

    const aleoTransaction = Transaction.createTransaction(
      publicKey,
      WalletAdapterNetwork.Testnet,
      NewsletterProgramId,
      'main',
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

  /**
   * Allow the operater to update a newsletter.  This event handler will update the newsletter title, template, and contents.
   * @param event
   */
  const handleUpdateNewsletter = async (event: ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!publicKey) throw new WalletNotConnectedError();

    // Make immutable hash of the string values.
    const title_address = await ipfsAdd(title_ciphertext.ciphertext);
    const template_address = await ipfsAdd(template_ciphertext.ciphertext);
    const content_address = await ipfsAdd(content_ciphertext.ciphertext);

    const title_bigints = padArray(splitStringToBigInts(title_address.Hash), 4);
    const template_bigints = padArray(splitStringToBigInts(template_address.Hash), 4);
    const content_bigints = padArray(splitStringToBigInts(content_address.Hash), 4);

    const inputs = [
      record,
      `${format_bigints(title_bigints)}`,
      `${format_u8s(title_nonce)}`,
      `${format_bigints(template_bigints)}`,
      `${format_u8s(template_nonce)}`,
      `${format_bigints(content_bigints)}`,
      `${format_u8s(content_nonce)}`,
    ];

    const fee_value: number = parseFloat(fee) || 1.0;

    const fee_microcredits = 1_000_000 * fee_value; // This will fail if fee is not set high enough

    const aleoTransaction = Transaction.createTransaction(
      publicKey,
      WalletAdapterNetwork.Testnet,
      NewsletterProgramId,
      'update',
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

  /**
   * Handle the deliver call to the newsletter program. This event handler will create a new issue of the newsletter.
   * @param event
   */
  const handleCreateNewsletterIssue = async (event: ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!publicKey) throw new WalletNotConnectedError();

    // Make immutable hash of the string values.
    const title_address = await ipfsAdd(title_ciphertext.ciphertext);
    const content_address = await ipfsAdd(content_ciphertext.ciphertext);
    const issue_cipher = encryptGroupMessage(JSON.stringify(selected_recipients), group_symmetric_key);
    const issue_address = await ipfsAdd(issue_cipher.ciphertext);

    const ciphertext = issue_cipher.ciphertext as string;
    const nonce = issue_cipher.nonce as string;
    const decrypted_issue: DeliveryDraft[] = JSON.parse(
      decryptGroupMessage(ciphertext, nonce, group_symmetric_key) as string,
    );
    console.log(decrypted_issue);

    const title_bigints = padArray(splitStringToBigInts(title_address.Hash), 4);
    const content_bigints = padArray(splitStringToBigInts(content_address.Hash), 4);
    const issue_bigints = padArray(splitStringToBigInts(issue_address.Hash), 4);
    const issue_nonce_bigints = padArray(splitStringToBigInts(issue_cipher.nonce), 4);

    // Desired format is a string of the form:
    // `{ b0: ${bigint[0]}u128, b1: ${bigint[1]}u128, ... }`

    // The record here is an output from the Requesting Records above
    const inputs = [
      record,
      `${format_bigints(title_bigints)}`,
      `${format_u8s(title_nonce)}`,
      `${format_bigints(content_bigints)}`,
      `${format_u8s(content_nonce)}`,
      `${format_bigints(issue_bigints)}`,
      `${format_bigints(issue_nonce_bigints)}`,
    ];

    const fee_value: number = parseFloat(fee) || 1.0;

    const fee_microcredits = 1_000_000 * fee_value; // This will fail if fee is not set high enough

    const aleoTransaction = Transaction.createTransaction(
      publicKey,
      WalletAdapterNetwork.Testnet,
      NewsletterProgramId,
      'deliver',
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
      ipfsRm(title_address.Hash);
      ipfsRm(content_address.Hash);
      ipfsRm(issue_address.Hash);
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

  const actionLabel =
    newsletter && newsletter.id && !selected_recipients.length
      ? 'Update'
      : newsletter && newsletter.id && selected_recipients.length
      ? 'Deliver Issue'
      : 'Create';

  const action = {
    Create: handleCreateNewsletter,
    Update: handleUpdateNewsletter,
    'Deliver Issue': async (event: ChangeEvent<HTMLFormElement>) => {
      return handleCreateNewsletterIssue(event);
    },
  };

  return (
    <section className="Editor">
      <header className="App-header">
        <input
          className="App-header-input"
          value={title}
          onChange={(event) => dispatch(setTitle(event.target.value))}
          disabled={privacy_mode}
          placeholder="Title"
        />
        <WalletMultiButton />
      </header>
      <div className="App-sidebar">
        <EditorToolbar />
      </div>
      <div className="App-body">
        <div className="App-body-controls">
          <label>
            {(privacy_mode && 'Privacy mode (on) ') || 'Privacy mode (off)'}
            <Toggle defaultChecked={privacy_mode} onChange={() => dispatch(togglePrivacyMode())} />
          </label>
          <label>
            {(template_mode && 'Template mode (on) ') || 'Template mode (off)'}
            <Toggle defaultChecked={template_mode} onChange={() => dispatch(toggleTemplateMode())} />
          </label>
          {connected && (
            <label>
              Fee (Credits):
              <input
                className="App-body-input"
                value={fee}
                onChange={(event) => setFee(event.target.value)}
                placeholder="Fee"
              />
            </label>
          )}
        </div>
        <form className="App-body-form" onSubmit={action[actionLabel]}>
          <MDEditor
            className="App-body-editor"
            height={'54vh'}
            value={template_mode ? template : content}
            onChange={(value) =>
              (template_mode && privacy_mode && dispatch(setTemplate(template))) ||
              (template_mode && !privacy_mode && dispatch(setTemplate(value as string))) ||
              (!template_mode && privacy_mode && dispatch(setContent(content))) ||
              (!template_mode && !privacy_mode && dispatch(setContent(value as string)))
            }
          />
          {connected &&
            ((((isSubscriber && actionLabel === 'Deliver Issue') || isOp) && newsletter && newsletter.id) ||
              !newsletter.id) && (
              <div className="App-body-form-footer">
                {transactionId && status && (
                  <div>
                    <div>{`Transaction status: ${status}`}</div>
                  </div>
                )}
                <input
                  type="submit"
                  disabled={
                    !publicKey ||
                    (actionLabel === 'Create' && (!shared_public_key || !shared_recipient)) ||
                    (actionLabel === 'Deliver Issue' && !is_issue_valid) ||
                    privacy_mode
                  }
                  value={actionLabel}
                />
              </div>
            )}
        </form>
      </div>
      <div className="App-footer"></div>
    </section>
  );
};

export default Editor;
