import React, { FC, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import MDEditor from '@uiw/react-md-editor';
import CryptoJS from 'crypto-js';
import '@demox-labs/aleo-wallet-adapter-reactui/styles.css';
import { WalletMultiButton } from '@demox-labs/aleo-wallet-adapter-reactui';
import './Editor.css';

const Editor: FC = () => {
  const [value, setValue] = React.useState('**Hello world!!!**');
  // Get the inital secret as a random string of chacters from a whole number
  const initSecret = (Math.random() * 10000000000000000).toString(36);
  const [secret, setSecret] = React.useState(initSecret);
  const [ciphertext, setCiphertext] = React.useState('');
  const [records, setRecords] = React.useState([]);

  useEffect(() => {
    const ciphertext = CryptoJS.AES.encrypt(value, secret).toString();
    const plaintext = CryptoJS.AES.decrypt(ciphertext, secret);
    setCiphertext(ciphertext);
    console.log(ciphertext);
    console.log(plaintext.toString(CryptoJS.enc.Utf8));
  }, [value, secret]);

  return (
    <section className="Editor">
      <header className="App-header">
        <p>
          <input className="App-header-input" placeholder="Title" />
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
        <MDEditor className="App-body-editor" value={value} onChange={setValue} />
      </div>
      <div className="App-footer"></div>
    </section>
  );
};

export default Editor;
