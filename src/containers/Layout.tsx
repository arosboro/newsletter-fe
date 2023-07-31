import React, { useEffect } from 'react';
import { setPublicKey } from '@/features/accounts/accountsSlice';
import { fetchRecords } from '@/features/records/recordsSlice';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/app/store';

interface Props {
  className?: string;
  children: React.ReactNode;
}

const Layout = ({ className, children }: Props) => {
  const { connected, publicKey, wallet, requestRecords } = useWallet();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (connected && typeof wallet !== 'undefined') {
      if (typeof publicKey === 'string' && publicKey.length > 0) {
        dispatch(setPublicKey(publicKey));
      }
      dispatch(fetchRecords({ connected, requestRecords }));
    }
  }, [connected, wallet, requestRecords]);

  return (
    <>
      <div className={className}>{children}</div>
    </>
  );
};

export default Layout;
