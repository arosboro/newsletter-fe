import React, { useEffect, CSSProperties, useState } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/app/store';
import { setPublicKey, selectIsLoading as selectIsLoadingAccounts } from '@/features/accounts/accountsSlice';
import { fetchRecords, selectIsLoading as selectIsLoadingRecords } from '@/features/records/recordsSlice';
import { selectIsLoading as selectIsLoadingNewsletter } from '@/features/newsletters/newslettersSlice';
import { selectIsLoading as selectIsLoadingSubscriptions } from '@/features/subscriptions/subscriptionsSlice';
import ClipLoader from 'react-spinners/ClipLoader';

const override: CSSProperties = {
  display: 'block',
  margin: '0 auto',
  borderColor: 'red',
};

interface Props {
  className?: string;
  children: React.ReactNode;
}

const Layout = ({ className, children }: Props) => {
  const { connected, publicKey, wallet, requestRecords } = useWallet();
  const isLoadingAccounts = useSelector(selectIsLoadingAccounts);
  const isLoadingRecords = useSelector(selectIsLoadingRecords);
  const isLoadingNewsletter = useSelector(selectIsLoadingNewsletter);
  const isLoadingSubscriptions = useSelector(selectIsLoadingSubscriptions);
  const isLoading = isLoadingAccounts || isLoadingRecords || isLoadingNewsletter || isLoadingSubscriptions;
  const color = useState('#ffffff')[0];

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
      {isLoading && (
        <ClipLoader
          color={color}
          loading={isLoading}
          cssOverride={override}
          size={150}
          aria-label="Loading Spinner"
          data-testid="loader"
          className="spinner"
        />
      )}
      {!isLoading && <div className={className}>{children}</div>}
    </>
  );
};

export default Layout;
