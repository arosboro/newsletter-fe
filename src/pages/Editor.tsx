import React, { ChangeEvent, FC, useEffect } from 'react';
import Toggle from 'react-toggle';
import MDEditor from '@uiw/react-md-editor';
import EditorToolbar from '@/components/EditorToolbar';
import './Editor.css';
import { WalletMultiButton } from '@demox-labs/aleo-wallet-adapter-reactui';
import { Transaction, WalletAdapterNetwork, WalletNotConnectedError } from '@demox-labs/aleo-wallet-adapter-base';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { NewsletterProgramId } from '@/aleo/newsletter-program';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { padArray, splitStringToBigInts, ipfsAdd, encrypt, ipfsRm, format_bigints } from '@/lib/util';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '@/app/store';
import {
  selectContent,
  selectContentCiphertext,
  selectTemplateMode,
  selectPrivacyMode,
  selectTemplate,
  selectTemplateCiphertext,
  selectTitle,
  selectTitleCiphertext,
  setTitle,
  setTemplate,
  setContent,
  togglePrivacyMode,
  toggleTemplateMode,
  selectGroupSecret,
  selectIndividualSecret,
  NewsletterRecord,
  selectNewsletter,
} from '@/features/newsletters/newslettersSlice';
import 'react-toggle/style.css';
import '@demox-labs/aleo-wallet-adapter-reactui/styles.css';
import { fetchRecords } from '@/features/records/recordsSlice';

const Editor: FC = () => {
  const { connected, wallet, publicKey, requestTransaction, requestRecords } = useWallet();
  const title = useSelector(selectTitle);
  const template = useSelector(selectTemplate);
  const content = useSelector(selectContent);
  const title_ciphertext = useSelector(selectTitleCiphertext);
  const template_ciphertext = useSelector(selectTemplateCiphertext);
  const content_ciphertext = useSelector(selectContentCiphertext);
  const template_mode = useSelector(selectTemplateMode);
  const privacy_mode: boolean = useSelector(selectPrivacyMode);
  const secret: string = useSelector(selectGroupSecret);
  const individual_secret: string = useSelector(selectIndividualSecret);
  const newsletter: NewsletterRecord = useSelector(selectNewsletter);
  const dispatch = useDispatch<AppDispatch>();

  // Long assignment of a template string to a variable
  // Get the inital secret as a random string of chacters from a whole number
  const [shared_secret, setSharedSecret] = React.useState('');
  const [shared_recipient, setSharedRecipient] = React.useState('');
  const [fee, setFee] = React.useState<string>('3.0365');
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

  useEffect(() => {
    // set the sharedSecret and sharedRecipient
    if (!publicKey) return;
    setSharedSecret(encrypt(individual_secret, secret));
    setSharedRecipient(encrypt(publicKey, secret));
  }, [secret, individual_secret, publicKey]);

  const handleCreateNewsletter = async (event: ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!publicKey) throw new WalletNotConnectedError();

    // Make immutable hash of the string values.
    const title_address = await ipfsAdd(title_ciphertext);
    const template_address = await ipfsAdd(template_ciphertext);
    const content_address = await ipfsAdd(content_ciphertext);

    const title_bigints = padArray(splitStringToBigInts(title_address.Hash), 4);
    const template_bigints = padArray(splitStringToBigInts(template_address.Hash), 4);
    const content_bigints = padArray(splitStringToBigInts(content_address.Hash), 4);
    const group_secret_bigint = padArray([BigInt(secret)], 1);
    const individual_secret_bigint = padArray([BigInt(individual_secret)], 1);
    const shared_secret_bigints = padArray(splitStringToBigInts(shared_secret), 4);
    const shared_recipient_bigints = padArray(splitStringToBigInts(shared_recipient), 7);

    // Desired format is a string of the form:
    // `{ b0: ${bigint[0]}u128, b1: ${bigint[1]}u128, ... }`

    const format_bigints = (bigints: bigint[]) => {
      let result = '{ ';
      for (let i = 0; i < bigints.length; i++) {
        if (i == bigints.length - 1) result += `b${i}: ${bigints[i]}u128 `;
        else result += `b${i}: ${bigints[i]}u128, `;
      }
      result += '}';
      return result;
    };

    // The record here is an output from the Requesting Records above
    const inputs = [
      `${format_bigints(title_bigints)}`,
      `${format_bigints(template_bigints)}`,
      `${format_bigints(content_bigints)}`,
      `${group_secret_bigint[0]}u128`,
      `${individual_secret_bigint[0]}u128`,
      `${format_bigints(shared_secret_bigints)}`,
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

  const handleCreateNewsletterIssue = async (event: ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!publicKey) throw new WalletNotConnectedError();

    // Make immutable hash of the string values.
    const title_address = await ipfsAdd(title_ciphertext);
    const template_address = await ipfsAdd(template_ciphertext);
    const content_address = await ipfsAdd(content_ciphertext);

    const title_bigints = padArray(splitStringToBigInts(title_address.Hash), 4);
    const template_bigints = padArray(splitStringToBigInts(template_address.Hash), 4);
    const content_bigints = padArray(splitStringToBigInts(content_address.Hash), 4);
    const group_secret_bigint = padArray([BigInt(secret)], 1);
    const individual_secret_bigint = padArray([BigInt(individual_secret)], 1);
    const shared_secret_bigints = padArray(splitStringToBigInts(shared_secret), 4);
    const shared_recipient_bigints = padArray(splitStringToBigInts(shared_recipient), 7);

    // Desired format is a string of the form:
    // `{ b0: ${bigint[0]}u128, b1: ${bigint[1]}u128, ... }`

    // The record here is an output from the Requesting Records above
    const inputs = [
      `${format_bigints(title_bigints)}`,
      `${format_bigints(template_bigints)}`,
      `${format_bigints(content_bigints)}`,
      `${group_secret_bigint[0]}u128`,
      `${individual_secret_bigint[0]}u128`,
      `${format_bigints(shared_secret_bigints)}`,
      `${format_bigints(shared_recipient_bigints)}`,
    ];

    const fee_value: number = parseFloat(fee) || 1.0;

    const fee_microcredits = 1_000_000 * fee_value; // This will fail if fee is not set high enough

    const test1 = encrypt('13509774859604697084', '11708986043611107324');
    console.log(test1, 'shared_secret');
    const test2 = encrypt('aleo1rzhda63qd45uwg46qtf4ahv5zpuap5s9u8qdtlks7239hghckg8qhvqcgu', '11708986043611107324');
    console.log(test2, 'shared_recipient');
    const test1_bigints = padArray(splitStringToBigInts(test1), 4);
    const test2_bigints = padArray(splitStringToBigInts(test2), 7);
    console.log(`${format_bigints(test1_bigints)}`);
    console.log(`${format_bigints(test2_bigints)}`);

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
      ipfsRm(title_address);
      ipfsRm(template_address);
      ipfsRm(content_address);
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
        <form
          className="App-body-form"
          onSubmit={newsletter && newsletter.id ? handleCreateNewsletterIssue : handleCreateNewsletter}
        >
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

          {connected && (
            <div className="App-body-form-footer">
              {transactionId && status && (
                <div>
                  <div>{`Transaction status: ${status}`}</div>
                </div>
              )}
              <input type="submit" disabled={!publicKey || !shared_secret || !shared_recipient} value="Submit" />
            </div>
          )}
        </form>
      </div>
      <div className="App-footer"></div>
    </section>
  );
};

export default Editor;
