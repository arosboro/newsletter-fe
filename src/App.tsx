import React, { FC, useEffect, useMemo } from 'react';
import { WalletProvider } from '@demox-labs/aleo-wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@demox-labs/aleo-wallet-adapter-reactui';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { DecryptPermission, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Deploy from './components/Deploy';
import Editor from './components/Editor';
import Reader from './components/Reader';
import NotFound from './components/NotFound';
import './App.css';
import '@demox-labs/aleo-wallet-adapter-reactui/styles.css';

const App: FC = () => {
  const wallets = useMemo(
    () => [
      new LeoWalletAdapter({
        appName: 'Newsletter',
      }),
    ],
    [],
  );

  return (
    <WalletProvider
      wallets={wallets}
      decryptPermission={DecryptPermission.UponRequest}
      network={WalletAdapterNetwork.Testnet}
    >
      <WalletModalProvider>
        <div className="App">
          <Router>
            <Navbar />
            <Routes>
              <Route path="/" element={<Editor />} />
              <Route path="/consume" element={<Reader />} />
              <Route path="/deploy" element={<Deploy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </div>
      </WalletModalProvider>
    </WalletProvider>
  );
};

export default App;
