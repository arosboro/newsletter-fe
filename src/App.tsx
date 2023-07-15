import React, { FC, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { DecryptPermission, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base';
import { WalletProvider } from '@demox-labs/aleo-wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@demox-labs/aleo-wallet-adapter-reactui';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Deploy from '@/pages/Deploy';
import Editor from '@/pages/Editor';
import Reader from '@/pages/Reader';
import Navbar from '@/components/Navbar';
import NotFound from '@/components/NotFound';
import '@demox-labs/aleo-wallet-adapter-reactui/styles.css';
import '@/App.css';
import { TESTNET3_API_URL, getProgram } from '@/aleo/rpc';
import { NewsletterProgramId } from './aleo/newsletter-program';

const App: FC = () => {
  const wallets = useMemo(
    () => [
      new LeoWalletAdapter({
        appName: 'Newsletter',
      }),
    ],
    [],
  );

  const { data, error, isLoading } = useSWR('programData', () => getProgram(NewsletterProgramId, TESTNET3_API_URL));

  return (
    <WalletProvider wallets={wallets} decryptPermission={DecryptPermission.AutoDecrypt}>
      <WalletModalProvider>
        <div className="App">
          <Router>
            <Navbar isDeployed={!isLoading && !!data} />
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
