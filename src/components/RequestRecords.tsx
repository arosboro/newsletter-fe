import { WalletNotConnectedError } from '@demox-labs/aleo-wallet-adapter-base';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { FC } from 'react';
import { NewsletterProgramId } from '../aleo/newsletter-program';

export const RequestRecords: FC = () => {
  const { publicKey, requestRecords } = useWallet();

  const onClick = async () => {
    if (!publicKey) throw new WalletNotConnectedError();
    if (requestRecords) {
      const records = await requestRecords(NewsletterProgramId);
      console.log('Records: ' + JSON.stringify(records));
    }
  };

  return (
    <button onClick={onClick} disabled={!publicKey}>
      Request Records
    </button>
  );
};
