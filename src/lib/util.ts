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
    individual_sequence: string;
    base: string;
    revision: string;
    template: string[] | string;
    title: string[] | string;
    content: string[] | string;
    group_secret: string;
    individual_secret: string;
  };
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
  const chunkBuffer = Object.values(bytes).map((chunk) => {
    return BigInt(chunk.slice(0, -12));
  });
  const chunk_decoded = joinBigIntsToString(chunkBuffer);
  return chunk_decoded;
};

export const decrypt = (aes_ciphertext: string, secret: string): string => {
  let plaintext = '';
  if (typeof aes_ciphertext === 'string' && typeof secret === 'string') {
    plaintext = CryptoJS.AES.decrypt(aes_ciphertext, secret).toString(CryptoJS.enc.Utf8);
  }
  return plaintext;
};

export const resolve_ipfs = async (
  records: NewsletterRecord[],
  privacy: boolean,
  setIsLoading: (isLoading: boolean) => void,
  setRecordsDecrypted: (recordsDecoded: NewsletterRecord[]) => void,
  record: NewsletterRecord,
  setRecord: (record: NewsletterRecord) => void,
) => {
  const resolve = async (path: string) => {
    console.log('Fetching from IPFS: ' + path); // IPFS Hash/Address
    const cipher_text = await axios.get(`https://ipfs.io/ipfs/${path}`).then((response) => {
      console.log('IPFS Response: ' + response.data);
      return response.data;
    });
    return cipher_text;
  };
  // process each record of records through resolve into recordsDecoded with resolve async function.
  const data: NewsletterRecord[] = [];
  for (let i = 0; i < records.length; i++) {
    const record: NewsletterRecord = records[i];
    const decoded_title: string = await resolve(decode(record.data.title));
    const decoded_template = await resolve(decode(record.data.template));
    const decoded_content = await resolve(decode(record.data.content));
    const decoded_group_secret = record.data.group_secret.slice(0, -12);
    const decoded_data = {
      ...record.data,
      title: decoded_title,
      template: decoded_template,
      content: decoded_content,
      group_secret: decoded_group_secret,
    };
    const decrypted_title = decrypt(decoded_title, decoded_group_secret);
    const decrypted_template = decrypt(decoded_template, decoded_group_secret);
    const decrypted_content = decrypt(decoded_content, decoded_group_secret);
    const decrypted_data = {
      ...record.data,
      title: decrypted_title,
      template: decrypted_template,
      content: decrypted_content,
      group_secret: decoded_group_secret,
    };
    const record_decrypted = {
      ...record,
      data: privacy ? decoded_data : decrypted_data,
    };
    console.log(record_decrypted, 'record_decrypted');
    data.push(record_decrypted);
  }
  console.log(data, 'ipfs data');
  setRecordsDecrypted(data);
  if (typeof record !== 'undefined') {
    const record_updated: NewsletterRecord | undefined = data.find((record) => record.id === record.id);
    setRecord(record_updated);
  }

  setIsLoading(false);
};
