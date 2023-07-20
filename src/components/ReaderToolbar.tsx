import React, { Dispatch, SetStateAction, useEffect } from 'react';
import {
  resolve_ipfs,
  NewsletterRecord,
  SubscriptionRecord,
  isNewsletterRecord,
  isSubscriptionRecord,
} from '@/lib/util';
import { WalletContextState } from '@demox-labs/aleo-wallet-adapter-react';

interface Props {
  programId: string;
  useWallet: () => WalletContextState;
  privacy: boolean;
  record: NewsletterRecord | undefined;
  setRecord: Dispatch<SetStateAction<NewsletterRecord | undefined>>;
  status: string | undefined;
  setStatus: Dispatch<SetStateAction<string | undefined>>;
}

const EditorToolbar = ({ programId, useWallet, privacy, record, setRecord, status, setStatus }: Props) => {
  const { publicKey, requestRecords } = useWallet();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [records, setRecords] = React.useState<NewsletterRecord[]>([]);
  const [subscriptions, setSubscriptions] = React.useState<SubscriptionRecord[]>([]);
  const [subscription, setSubscription] = React.useState<SubscriptionRecord | undefined>(undefined);
  const [subscriptionMap, setSubscriptionMap] = React.useState<Map<string, string>>(new Map());
  const [invites, setInvites] = React.useState<NewsletterRecord[]>([]);
  const [issues, setIssues] = React.useState<NewsletterRecord[]>([]);
  const [recordsDecrypted, setRecordsDecrypted] = React.useState<NewsletterRecord[]>([]);
  const [invitesDecrypted, setInvitesDecrypted] = React.useState<NewsletterRecord[]>([]);
  const [issuesDecrypted, setIssuesDecrypted] = React.useState<NewsletterRecord[]>([]);

  useEffect(() => {
    const fetch = async (programId: string) => {
      if (
        (publicKey && requestRecords && typeof status === 'undefined') ||
        (publicKey && requestRecords && status === 'Finalized')
      ) {
        console.log(programId);
        const res = await requestRecords(programId);
        setRecords(
          res.filter((record: NewsletterRecord | SubscriptionRecord) => !record.spent && isNewsletterRecord(record)),
        );
        setSubscriptions(
          res.filter((record: NewsletterRecord | SubscriptionRecord) => !record.spent && isSubscriptionRecord(record)),
        );
        setInvites(
          res.filter(
            (record: NewsletterRecord) =>
              !record.spent &&
              isNewsletterRecord(record) &&
              record.data.op.slice(0, -8) !== publicKey &&
              record.data.base.slice(0, -8) === 'true' &&
              record.data.revision.slice(0, -8) === 'false',
          ),
        );
        setIssues(
          res.filter(
            (record: NewsletterRecord) =>
              !record.spent &&
              isNewsletterRecord(record) &&
              record.data.op.slice(0, -8) !== publicKey &&
              record.data.base.slice(0, -8) === 'false' &&
              record.data.revision.slice(0, -8) === 'true',
          ),
        );
        setIsLoading(true);
        if (status === 'Finalized') {
          setStatus(undefined);
        }
      }
    };
    fetch(programId);
  }, [publicKey, programId, status]);

  useEffect(() => {
    if (records && records.length >= 1) {
      console.log(records, 'records');
      resolve_ipfs(records, privacy, setIsLoading, setRecordsDecrypted, record, setRecord);
    }
  }, [records, privacy]);

  useEffect(() => {
    if (records.length >= 1 && recordsDecrypted.length >= 1) {
      console.log(records, 'records');
      console.log(invites, 'invites');

      // Get invite records from recordsDecrypted, where the data.id matches the decrypted invite id
      if (invites && invites.length >= 1 && recordsDecrypted && recordsDecrypted.length >= 1) {
        const invite_ids = invites.map((invite: NewsletterRecord) => invite.id);
        setInvitesDecrypted(
          recordsDecrypted.filter((record: NewsletterRecord) => {
            return invite_ids.includes(record.id);
          }),
        );
        console.log(invitesDecrypted, 'invitesDecrypted');
      }
    }
  }, [recordsDecrypted, invites]);

  useEffect(() => {
    if (records.length >= 1 && recordsDecrypted.length >= 1) {
      console.log(records, 'records');
      console.log(subscriptions, 'subscriptions');

      // Get subscription records from recordsDecrypted, where the data.id matches the decrypted invite id
      if (subscriptions && subscriptions.length >= 1 && recordsDecrypted && recordsDecrypted.length >= 1) {
        console.log(subscriptionMap, 'subscriptionMap');
        setSubscriptionMap(new Map());
      }
    }
  }, [subscription]);

  useEffect(() => {
    if (records.length >= 1 && recordsDecrypted.length >= 1) {
      console.log(records, 'records');
      console.log(issues, 'issues');

      // Get issue records from recordsDecrypted, where the data.id matches the decrypted invite id
      if (issues && issues.length >= 1 && recordsDecrypted && recordsDecrypted.length >= 1) {
        const issue_ids = issues.map((issue: NewsletterRecord) => issue.id);
        setIssuesDecrypted(
          recordsDecrypted.filter((record: NewsletterRecord) => {
            return issue_ids.includes(record.id);
          }),
        );
        console.log(issuesDecrypted, 'issuesDecrypted');
      }
    }
  }, [recordsDecrypted, issues]);

  return (
    <aside className="App-nav">
      <input className="App-nav-input" placeholder="Filter" />
      <hr />
      {publicKey && !isLoading && (
        <>
          {invitesDecrypted.length >= 1 && (
            <>
              <h4>Invites</h4>
              <ul className="App-nav-list">
                {invitesDecrypted.map((value: NewsletterRecord, index: number) => (
                  <li className="{record.idApp-nav-list-item" key={index}>
                    <a
                      href="/#"
                      onClick={(e) => {
                        e.preventDefault();
                        setRecord(value);
                      }}
                      className="App-nav-list-item-link"
                    >
                      {(value && record && value.id == record.id && value.data && value.data.title && (
                        <i>{value.data.title}</i>
                      )) ||
                        (value && value.data && value.data.title && value.data.title)}
                    </a>
                  </li>
                ))}
              </ul>
              <hr />
            </>
          )}

          {subscriptions.length >= 1 && (
            <>
              <h4>Subscriptions</h4>
              <ul className="App-nav-list">
                {subscriptions.map((value: SubscriptionRecord, index: number) => (
                  <li className="{record.idApp-nav-list-item" key={index}>
                    <a
                      href="/#"
                      onClick={(e) => {
                        e.preventDefault();
                        setSubscription(value);
                      }}
                      className="App-nav-list-item-link"
                    >
                      {value.data.id.slice(0, -8)}
                    </a>
                  </li>
                ))}
              </ul>
              <hr />
            </>
          )}

          {issuesDecrypted.length >= 1 && (
            <>
              <h4>Newsletters</h4>
              <ul className="App-nav-list">
                {issuesDecrypted.map((value: NewsletterRecord, index: number) => (
                  <li className="{record.idApp-nav-list-item" key={index}>
                    <a
                      href="/#"
                      onClick={(e) => {
                        e.preventDefault();
                        setRecord(value);
                      }}
                      className="App-nav-list-item-link"
                    >
                      {(value && record && value.id == record.id && value.data && value.data.title && (
                        <i>{value.data.title}</i>
                      )) ||
                        (value && value.data && value.data.title && value.data.title)}
                    </a>
                  </li>
                ))}
              </ul>
              {record && record.id && (
                <>
                  <hr />
                  <h4>Subscribers</h4>
                </>
              )}
            </>
          )}
        </>
      )}
    </aside>
  );
};

export default EditorToolbar;
