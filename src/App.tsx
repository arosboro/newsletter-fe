// Import necessary React modules
import React, { FC, useMemo } from 'react';
// Hook for data fetching
import useSWR from 'swr';
// Adapter for Leo Wallet integration
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo';
// Wallet decryption permission setting
import { DecryptPermission } from '@demox-labs/aleo-wallet-adapter-base';
// Wallet context providers for React
import { WalletProvider } from '@demox-labs/aleo-wallet-adapter-react';
import { WalletModalProvider } from '@demox-labs/aleo-wallet-adapter-reactui';
// React Router components for routing setup
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// Import individual page components
import Deploy from '@/pages/Deploy';
import Editor from '@/pages/Editor';
import Reader from '@/pages/Reader';
// Navbar component import
import Navbar from '@/components/Navbar';
// Not Found component for handling invalid routes
import NotFound from '@/components/NotFound';
// Wallet Adapter styles
import '@demox-labs/aleo-wallet-adapter-reactui/styles.css';
// Main app styles
import '@/App.css';
// RPC related utilities and constants
import { TESTNET3_API_URL, getProgram } from '@/aleo/rpc';
import { NewsletterProgramId } from './aleo/newsletter-program';
// Error handling boundary component
import ErrorBoundary from './containers/ErrorBoundary';
// Main layout wrapper component
import Layout from './containers/Layout';

// Define the main App component
const App: FC = () => {
  // Memoized list of wallet adapters
  const wallets = useMemo(
    () => [
      new LeoWalletAdapter({
        appName: 'Newsletter',
      }),
    ],
    [],
  );

  // Fetch program data using SWR hook
  const { data, error, isLoading } = useSWR('programData', () => getProgram(NewsletterProgramId, TESTNET3_API_URL));

  return (
    // Error Boundary to catch any exceptions in children
    <ErrorBoundary>
      {/* Provide wallet context */}
      <WalletProvider wallets={wallets} decryptPermission={DecryptPermission.AutoDecrypt}>
        {/* Wallet Modal Provider to render any required modals */}
        <WalletModalProvider>
          {/* Main application layout */}
          <Layout className="App">
            {/* Conditional rendering based on fetched program data */}
            {(!error && (
              // Router component for defining routes
              <Router>
                {/* Navbar component, passing whether the app is deployed as a prop */}
                <Navbar isDeployed={!isLoading && !!data} />
                {/* Define the application's routes */}
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

// Export the main App component
export default App;
