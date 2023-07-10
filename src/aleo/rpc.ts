// Graciously borrowed from https://github.com/demox-labs/art-factory/blob/main/src/aleo/rpc.ts
// All credit goes to the original author.  NFT Functionality removed for this project, replaced by Newsletter functionality.

import { JSONRPCClient } from 'json-rpc-2.0';
import { NewsletterProgramId } from './newsletter-program';
import { bigIntToString, joinBigIntsToString, parseStringToBigIntArray } from '../lib/util';
import assert from 'assert';

export const TESTNET3_API_URL = import.meta.env.VITE_RPC_URL!;

export async function getHeight(apiUrl: string): Promise<number> {
  const client = getClient(apiUrl);
  const height = await client.request('getHeight', {});
  return height;
}

export async function getProgram(programId: string, apiUrl: string): Promise<string> {
  const client = getClient(apiUrl);
  const program = await client.request('program', {
    id: programId,
  });
  return program;
}

export async function getTransactionsForProgram(programId: string, functionName: string, apiUrl: string): Promise<any> {
  const client = getClient(apiUrl);
  const transaction = await client.request('transactionsForProgram', {
    programId,
    functionName,
    page: 0,
    maxTransactions: 1000,
  });
  return transaction;
}

export async function getAleoTransactionsForProgram(
  programId: string,
  functionName: string,
  apiUrl: string,
  page = 0,
  maxTransactions = 1000,
): Promise<any> {
  const client = getClient(apiUrl);
  const transaction = await client.request('aleoTransactionsForProgram', {
    programId,
    functionName,
    page,
    maxTransactions,
  });
  return transaction;
}

export async function getTransaction(apiUrl: string, transactionId: string): Promise<any> {
  const transactionUrl = `${apiUrl}/aleo/transaction`;
  const response = await fetch(`${transactionUrl}/${transactionId}`);
  if (!response.ok) {
    throw new Error('Transaction not found');
  }
  const transaction = await response.json();
  return transaction;
}

export const getClient = (apiUrl: string) => {
  const client = new JSONRPCClient((jsonRPCRequest: any) =>
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ ...jsonRPCRequest }),
    }).then((response: any) => {
      if (response.status === 200) {
        // Use client.receive when you received a JSON-RPC response.
        return response.json().then((jsonRPCResponse: any) => client.receive(jsonRPCResponse));
      } else if (jsonRPCRequest.id !== undefined) {
        return Promise.reject(new Error(response.statusText));
      }
    }),
  );
  return client;
};

export async function getJSON(url: string): Promise<any> {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}
