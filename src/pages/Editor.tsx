import React, { ChangeEvent, FC, useEffect } from 'react';
import Toggle from 'react-toggle';
import MDEditor from '@uiw/react-md-editor';
import EditorToolbar from '@/components/EditorToolbar';
import CryptoJS from 'crypto-js';
import 'react-toggle/style.css';
import '@demox-labs/aleo-wallet-adapter-reactui/styles.css';
import './Editor.css';
import { WalletMultiButton } from '@demox-labs/aleo-wallet-adapter-reactui';
import { Transaction, WalletAdapterNetwork, WalletNotConnectedError } from '@demox-labs/aleo-wallet-adapter-base';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { NewsletterProgramId } from '@/aleo/newsletter-program';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { padArray, splitStringToBigInts, ipfsAdd, NewsletterRecord } from '@/lib/util';

const Editor: FC = () => {
  const { wallet, publicKey, requestTransaction } = useWallet();
  // Long assignment of a template string to a variable
  const defaultTitle = 'The Crypto Classifieds';
  const defaultTemplate = `
  # The Crypto Classifieds
  #### (A Classifieds Community Newsletter)
  
  ## Welcome to the Crypto Classifieds!
  The Crypto Classifieds is a newsletter which aims to bring communities together.
  The direct C2C nature of this newsletter allows for a more personal and intimate experience.
  You will know all of your subscribers and curate content for the benefit of all parties involved.

> A friend in need is a friend indeed.
> ~ old proverb
  
  
  -----------
  
  
  
  Reporter: 
  
  Aleo Address: 
  
  ## Community Update
  
  ## Goods and Services Available
  
  ## Goods and Services Requested
  
  ## Equipment Rental
  
  ## Meetups

`;
  const [title, setTitle] = React.useState<string | undefined>(defaultTitle);
  const [template, setTemplate] = React.useState<string | undefined>(defaultTemplate);
  const [template_mode, setTemplateMode] = React.useState<boolean>(true);
  const [content, setContent] = React.useState<string | undefined>(template);
  // Get the inital secret as a random string of chacters from a whole number
  const initSecret = (): bigint => {
    // Calcuate a 64-bit random integer and subtract 4 bytes
    const seed = BigInt(Math.floor(Math.random() * 2 ** 64)) - BigInt(4);
    return seed;
  };
  const [secret] = React.useState(initSecret().toString())[0];
  const [individual_secret] = React.useState(initSecret().toString())[0];
  const [title_ciphertext, setTitleCiphertext] = React.useState('');
  const [template_ciphertext, setTemplateCiphertext] = React.useState('');
  const [content_ciphertext, setContentCiphertext] = React.useState('');
  const [shared_secret, setSharedSecret] = React.useState('');
  const [shared_recipient, setSharedRecipient] = React.useState('');
  const [fee, setFee] = React.useState<number>(11.11);
  const [transactionId, setTransactionId] = React.useState<string | undefined>();
  const [status, setStatus] = React.useState<string | undefined>();
  const [privacy_mode, setPrivacyMode] = React.useState<boolean>(false);
  const [record, setRecord] = React.useState<NewsletterRecord | undefined>();

  useEffect(() => {
    if (typeof publicKey === 'string') {
      // Title ciphertext
      if (typeof title === 'string') {
        setTitleCiphertext(CryptoJS.AES.encrypt(title, secret).toString());
      }
      // Template ciphertext
      if (typeof template === 'string') {
        setTemplateCiphertext(CryptoJS.AES.encrypt(template, secret).toString());
      }
      // Content ciphertext
      if (typeof content === 'string') {
        setContentCiphertext(CryptoJS.AES.encrypt(content, secret).toString());
      }
      // Shared secret
      setSharedSecret(CryptoJS.AES.encrypt(individual_secret, secret).toString());
      // Shared recipient
      setSharedRecipient(CryptoJS.AES.encrypt(publicKey, secret).toString());
    }
  }, [title, template, content, secret, publicKey]);

  useEffect(() => {
    if (typeof record !== 'undefined') {
      console.log(record);
      if (
        typeof record.data.title === 'string' &&
        typeof record.data.template === 'string' &&
        typeof record.data.content === 'string'
      ) {
        setTitle(record.data.title);
        setTemplate(record.data.template);
        setContent(record.data.content);
      }
    } else {
      setTitle(defaultTitle);
      setTemplate(defaultTemplate);
      setContent(defaultTemplate);
    }
  }, [record]);

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

    console.log(publicKey);
    console.log(secret);
    console.log(title_ciphertext);
    console.log(template_ciphertext);
    console.log(content_ciphertext);

    // Make immutable hash of the string values.
    const title_address = await ipfsAdd(title_ciphertext);
    const template_address = await ipfsAdd(template_ciphertext);
    const content_address = await ipfsAdd(content_ciphertext);

    console.log('title_address', title_address.Hash);
    console.log('template_address', template_address.Hash);
    console.log('content_address', content_address.Hash);

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

    console.log(inputs);

    const fee_microcredits = 1_000_000 * fee; // This will fail if fee is not set high enough

    const aleoTransaction = Transaction.createTransaction(
      publicKey,
      WalletAdapterNetwork.Testnet,
      NewsletterProgramId,
      'main',
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
    <section className="Editor">
      <header className="App-header">
        <p>
          <input
            className="App-header-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title"
          />
        </p>
        <WalletMultiButton />
      </header>
      <div className="App-sidebar">
        <EditorToolbar
          programId={NewsletterProgramId}
          useWallet={useWallet}
          privacy={privacy_mode}
          record={record}
          setRecord={setRecord}
        />
      </div>
      <div className="App-body">
        <div className="App-body-controls">
          <label>
            {(privacy_mode && 'Privacy mode (on) ') || 'Privacy mode (off)'}
            <Toggle
              defaultChecked={privacy_mode}
              onChange={() => {
                setPrivacyMode(!privacy_mode);
              }}
            />
          </label>
          <label>
            {(template_mode && 'Template mode (on) ') || 'Template mode (off)'}
            <Toggle
              defaultChecked={template_mode}
              onChange={() => {
                setTemplateMode(!template_mode);
              }}
            />
          </label>
        </div>
        <form className="App-body-form" onSubmit={handleSubmit}>
          <MDEditor
            className="App-body-editor"
            height={'54vh'}
            value={template_mode ? template : content}
            onChange={(value) => (template_mode && setTemplate(value)) || (!template_mode && setContent(value))}
          />
          <div className="App-body-form-footer">
            <label>
              Fee (Credits):
              <input
                className="App-body-form-footer-input"
                value={fee}
                onChange={(event) => setFee(parseInt(event.target.value))}
                placeholder="Fee"
              />
            </label>
            {transactionId && (
              <div>
                <div>{`Transaction status: ${status}`}</div>
              </div>
            )}
            <input type="submit" disabled={!publicKey} value="Submit" />
          </div>
        </form>
      </div>
      <div className="App-footer"></div>
    </section>
  );
};

export default Editor;
