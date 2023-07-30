// Graciously borrowed from https://github.com/demox-labs/art-factory/blob/main/src/lib/util.ts
// All credit goes to the original author.

import axios from 'axios';
import FormData from 'form-data';
import CryptoJS from 'crypto-js';

export interface NewsletterRecord {
  id: string;
  owner: string;
  program_id: string;
  spent: boolean;
  data: {
    id: string;
    op: string;
    member_sequence: string;
    base: string;
    revision: string;
    template: string[] | string;
    title: string[] | string;
    content: string[] | string;
    group_secret: string;
    individual_secret: string;
  };
}

export interface SubscriptionRecord {
  id: string;
  owner: string;
  program_id: string;
  spent: boolean;
  data: {
    owner: string;
    op: string;
    id: string;
    member_sequence: string;
    member_secret_idx: string;
  };
}

export interface SharedSecret {
  shared_secret: string[] | string;
  recipient: string[] | string;
}

export interface SharedSecretMapping {
  key: string;
  value: SharedSecret;
}

export function safeParseInt(value: string): number {
  const parsedValue = parseInt(value, 10);
  return isNaN(parsedValue) ? 0 : parsedValue;
}

export function stringToBigInt(input: string): bigint {
  const encoder = new TextEncoder();
  const encodedBytes = encoder.encode(input);

  let bigIntValue = BigInt(0);
  for (let i = 0; i < encodedBytes.length; i++) {
    const byteValue = BigInt(encodedBytes[i]);
    const shiftedValue = byteValue << BigInt(8 * i);
    bigIntValue = bigIntValue | shiftedValue;
  }

  return bigIntValue;
}

export function bigIntToString(bigIntValue: bigint): string {
  const bytes: number[] = [];
  let tempBigInt = bigIntValue;

  while (tempBigInt > BigInt(0)) {
    const byteValue = Number(tempBigInt & BigInt(255));
    bytes.push(byteValue);
    tempBigInt = tempBigInt >> BigInt(8);
  }

  const decoder = new TextDecoder();
  const asciiString = decoder.decode(Uint8Array.from(bytes));
  return asciiString;
}

export function splitStringToBigInts(input: string): bigint[] {
  const chunkSize = 16; // Chunk size to split the string
  const numChunks = Math.ceil(input.length / chunkSize);
  const bigInts: bigint[] = [];

  for (let i = 0; i < numChunks; i++) {
    const chunk = input.substr(i * chunkSize, chunkSize);
    const bigIntValue = stringToBigInt(chunk);
    bigInts.push(bigIntValue);
  }

  return bigInts;
}

export function joinBigIntsToString(bigInts: bigint[]): string {
  let result = '';

  for (let i = 0; i < bigInts.length; i++) {
    const chunkString = bigIntToString(bigInts[i]);
    result += chunkString;
  }

  return result;
}

export function padArray(array: bigint[], length: number): bigint[] {
  const paddingLength = length - array.length;
  if (paddingLength <= 0) {
    return array; // No padding needed
  }

  const padding = Array(paddingLength).fill(BigInt(0));
  const paddedArray = array.concat(padding);
  return paddedArray;
}

export function parseStringToBigIntArray(input: string): bigint[] {
  const bigIntRegex = /([0-9]+)u128/g;
  const matches = input.match(bigIntRegex);

  if (!matches) {
    return [];
  }

  const bigInts = matches.map((match) => BigInt(match.slice(0, -4)));
  return bigInts;
}

export function getRandomElement<T>(list: T[]): T {
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}

export async function ipfsAdd(data: string) {
  try {
    const formData = new FormData();
    formData.append('file', data);

    const authorization =
      'Basic ' + btoa(`${import.meta.env.VITE_INFURA_IPFS_API_KEY}:${import.meta.env.VITE_INFURA_IPFS_API_SECRET}`);

    const response = await axios
      .post(`${import.meta.env.VITE_IPFS_API_ENDPOINT}/add`, formData, {
        headers: {
          authorization,
        },
      })
      .then((response) => {
        console.log('IPFS Response: ', response.data);
        return response.data;
      });

    return response;
  } catch (error) {
    console.error('IPFS error', error);
    return undefined;
  }
}

export const decode = (bytes: string[] | string): string => {
  if (typeof bytes === 'string') {
    bytes = [bytes];
  }
  const chunkBuffer = Object.values(bytes).map((chunk) => {
    return BigInt(chunk.replace(/(u\d{1,3}|.private|.public)/g, ''));
  });
  const chunk_decoded = joinBigIntsToString(chunkBuffer);
  return chunk_decoded;
};

export const initSecret = (): bigint => {
  // Calcuate a 64-bit random integer and subtract 4 bytes
  const seed = BigInt(Math.floor(Math.random() * 2 ** 64)) - BigInt(4);
  return seed;
};

export const encrypt = (plaintext: string, secret: string): string => {
  let ciphertext = '';
  if (typeof plaintext === 'string' && typeof secret === 'string') {
    ciphertext = CryptoJS.AES.encrypt(plaintext, secret).toString();
  }
  return ciphertext;
};

export const decrypt = (aes_ciphertext: string, secret: string): string => {
  let plaintext = '';
  console.log(typeof aes_ciphertext, typeof secret);
  console.log(aes_ciphertext, secret);
  if (typeof aes_ciphertext === 'string' && typeof secret === 'string') {
    const bytes = CryptoJS.AES.decrypt(aes_ciphertext, secret);
    console.log(bytes);
    plaintext = bytes.toString(CryptoJS.enc.Utf8);
    console.log(plaintext);
  }
  return plaintext;
};

export const resolve = async (path: string) => {
  console.log('Fetching from IPFS: ' + path); // IPFS Hash/Address
  const cipher_text = await axios.get(`https://ipfs.io/ipfs/${path}`).then((response) => {
    console.log('IPFS Response: ' + response.data);
    return response.data;
  });
  return cipher_text;
};
