import React, { ChangeEvent, FC, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { createHelia } from 'helia';
import { strings } from '@helia/strings';
import Toggle from 'react-toggle';
import MDEditor from '@uiw/react-md-editor';
import CryptoJS from 'crypto-js';
import 'react-toggle/style.css';
import '@demox-labs/aleo-wallet-adapter-reactui/styles.css';
import './Editor.css';
import { WalletMultiButton } from '@demox-labs/aleo-wallet-adapter-reactui';
import { Transaction, WalletAdapterNetwork, WalletNotConnectedError } from '@demox-labs/aleo-wallet-adapter-base';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { NewsletterProgramId } from '@/aleo/newsletter-program';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { padArray, splitStringToBigInts } from '@/lib/util';

const Editor: FC = () => {
  const { wallet, publicKey, requestTransaction } = useWallet();
  // Long assignment of a template string to a variable
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
  const [titleValue, setTitleValue] = React.useState('The Crypto Classifieds');
  const [templateValue, setTemplateValue] = React.useState(defaultTemplate);
  const [contentValue, setContentValue] = React.useState(templateValue);
  // Get the inital secret as a random string of chacters from a whole number
  const initSecret = () => {
    return Math.floor(Math.random() * 1000000000000000).toString(36);
  };
  const [secret, setSecret] = React.useState(initSecret());
  const [individual_secret, setIndividualSecret] = React.useState(initSecret());
  const [title_ciphertext, setTitleCiphertext] = React.useState('');
  const [template_ciphertext, setTemplateCiphertext] = React.useState('');
  const [content_ciphertext, setContentCiphertext] = React.useState('');
  const [shared_secret, setSharedSecret] = React.useState('');
  const [shared_recipient, setSharedRecipient] = React.useState('');
  const [fee, setFee] = React.useState(5);
  const [transactionId, setTransactionId] = React.useState<string | undefined>();
  const [status, setStatus] = React.useState<string | undefined>();
  const [record, setRecord] = React.useState('');

  useEffect(() => {
    // Title ciphertext
    const title_ciphertext = CryptoJS.AES.encrypt(titleValue, secret).toString();
    // const title_plaintext = CryptoJS.AES.decrypt(title_ciphertext, secret);
    setTitleCiphertext(title_ciphertext);
    // Template ciphertext
    const template_ciphertext = CryptoJS.AES.encrypt(templateValue, secret).toString();
    // const template_plaintext = CryptoJS.AES.decrypt(template_ciphertext, secret);
    setTemplateCiphertext(template_ciphertext);
    // Content ciphertext
    const content_ciphertext = CryptoJS.AES.encrypt(contentValue, secret).toString();
    // const content_plaintext = CryptoJS.AES.decrypt(content_ciphertext, secret);
    setContentCiphertext(content_ciphertext);
    // Shared secret
    const shared_secret_ciphertext = CryptoJS.AES.encrypt(individual_secret, secret).toString();
    // const shared_plaintext = CryptoJS.AES.decrypt(shared_secret_ciphertext, secret);
    setSharedSecret(shared_secret_ciphertext);
    // Shared recipient
    const shared_recipient_ciphertext = CryptoJS.AES.encrypt(publicKey, secret).toString();
    // const shared_plaintext = CryptoJS.AES.decrypt(shared_recipient_ciphertext, secret);
    setSharedRecipient(shared_recipient_ciphertext);
  }, [titleValue, templateValue, contentValue, secret, publicKey]);

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

  const encode_bytes = (value: string) => {
    // declare variables
    const bytes: number[] = [];
    let base64 = '';
    let bigint = BigInt(0);
    // String to base64 to bytes
    base64 = btoa(value);
    for (let i = 0; i < base64.length; i++) {
      bytes.push(base64.charCodeAt(i));
    }
    // base64 to bigint
    bigint = BigInt(0);
    for (let i = 0; i < bytes.length; i++) {
      bigint = bigint << 8n;
      bigint = bigint | BigInt(bytes[i]);
    }
    return bigint;
  };

  const decode_bytes = (bigint: bigint) => {
    // declare variables
    const bytes: number[] = [];
    let base64 = '';
    let value = '';
    // bigint to base64
    // mask 8 bits at a time, shifting them to the right until bigint is 0
    while (bigint > 0) {
      const char: bigint = bigint & 0xffn;
      bytes.push(parseInt(char.toString()));
      bigint = bigint >> 8n;
    }
    // reverse bytes to base64
    for (let i = bytes.length - 1; i >= 0; i--) {
      base64 += String.fromCharCode(bytes[i]);
    }
    // reverse base64 to string
    value = atob(base64);
    return value;
  };

  const handleSubmit = async (event: ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!publicKey) throw new WalletNotConnectedError();

    console.log(publicKey);
    console.log(secret);
    console.log(title_ciphertext);
    console.log(template_ciphertext);
    console.log(content_ciphertext);

    // Make immutable hash of the string values.
    const helia = await createHelia();
    const s = strings(helia);
    const title_address = await s.add(title_ciphertext);
    const template_address = await s.add(template_ciphertext);
    const content_address = await s.add(content_ciphertext);

    console.log('title_address', title_address.toString());
    console.log('template_address', template_address.toString());
    console.log('content_address', content_address.toString());

    const title_bigints = padArray(splitStringToBigInts(title_address.toString()), 10);
    const template_bigints = padArray(splitStringToBigInts(template_address.toString()), 10);
    const content_bigints = padArray(splitStringToBigInts(content_address.toString()), 10);
    const group_secret_bigint = encode_bytes(secret);
    const individual_secret_bigint = encode_bytes(individual_secret);
    const shared_secret_bigints = padArray(splitStringToBigInts(shared_secret), 10);
    const shared_recipient_bigints = padArray(splitStringToBigInts(shared_recipient), 10);

    // Desired format is a string of the form:
    // `{ b0: ${bigint[0]}u128, b1: ${bigint[1]}u128, ... }`

    const format_bigints = (bigints: bigint[]) => {
      let result = '{ ';
      for (let i = 0; i < bigints.length; i++) {
        result += `b${i}: ${bigints[i]}u128, `;
      }
      result += '}';
      return result;
    };

    // The record here is an output from the Requesting Records above
    const inputs = [
      `${format_bigints(title_bigints)}`,
      `${format_bigints(template_bigints)}`,
      `${format_bigints(content_bigints)}`,
      `${group_secret_bigint}u64`,
      `${individual_secret_bigint}u64`,
      `${format_bigints(shared_secret_bigints)}u64`,
      `${format_bigints(shared_recipient_bigints)}u128`,
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
          <input className="App-header-input" value={titleValue} onChange={setTitleValue} placeholder="Title" />
        </p>
        <WalletMultiButton />
      </header>
      <div className="App-sidebar">
        <aside className="App-nav">
          <input className="App-nav-input" placeholder="Search" />
          <ul className="App-nav-list">
            <li className="App-nav-list-item">
              <a href="#" className="App-nav-list-item-link">
                Post 1
              </a>
            </li>
            <li className="App-nav-list-item">
              <a href="#" className="App-nav-list-item-link">
                Post 2
              </a>
            </li>
            <li className="App-nav-list-item">
              <a href="#" className="App-nav-list-item-link">
                Post 3
              </a>
            </li>
          </ul>
        </aside>
      </div>
      <div className="App-body">
        <form className="App-body-form" onSubmit={handleSubmit}>
          <MDEditor className="App-body-editor" height={'54vh'} value={templateValue} onChange={setTemplateValue} />
          <div className="App-body-form-footer">
            <label>
              Fee (Credits):
              <input className="App-body-form-footer-input" value={fee} onChange={setFee} placeholder="Fee" />
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
