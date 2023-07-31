import React, { FC, useMemo } from 'react';
import useSWR from 'swr';
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
import { DecryptPermission } from '@demox-labs/aleo-wallet-adapter-base';
import { WalletProvider } from '@demox-labs/aleo-wallet-adapter-react';
import { WalletModalProvider } from '@demox-labs/aleo-wallet-adapter-reactui';
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
import ErrorBoundary from './containers/ErrorBoundary';
import Layout from './containers/Layout';

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
    <ErrorBoundary>
      <WalletProvider wallets={wallets} decryptPermission={DecryptPermission.AutoDecrypt}>
        <WalletModalProvider>
          <Layout className="App">
            {(!error && (
              <Router>
                <Navbar isDeployed={!isLoading && !!data} />
                <Routes>
                  <Route path="/" element={<Editor />} />
                  <Route path="/consume" element={<Reader />} />
                  <Route path="/deploy" element={<Deploy />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Router>
            )) || <div>Failed to load program data</div>}
          </Layout>
        </WalletModalProvider>
      </WalletProvider>
    </ErrorBoundary>
  );
};

export default App;
