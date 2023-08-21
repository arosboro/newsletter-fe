// Graciously borrowed from https://github.com/demox-labs/art-factory/blob/main/src/lib/util.ts
// All credit goes to the original author.

import axios from 'axios';
import FormData from 'form-data';
import nacl_factory from 'js-nacl';

let nacl: nacl_factory.Nacl;

nacl_factory.instantiate((instance: nacl_factory.Nacl) => {
  nacl = instance;
});

/**
 * Represents a cipher with hexadecimal encoding.
 */
export interface HexCipher {
  ciphertext: string;
  nonce: string;
}

/**
 * Safely parses a string into an integer.
 * If the parsed value is NaN, returns 0.
 * @param value - The string value to parse.
 * @returns - Parsed integer or 0.
 */
export function safeParseInt(value: string): number {
  const parsedValue = parseInt(value, 10);
  return isNaN(parsedValue) ? 0 : parsedValue;
}

/**
 * Converts a string into a bigint value.
 * @param input - The input string.
 * @returns - Corresponding bigint value.
 */
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

/**
 * Converts a bigint value to its string representation.
 * @param bigIntValue - The bigint value.
 * @returns - String representation of the bigint.
 */
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

/**
 * Splits a string into chunks and converts each chunk into a bigint.
 * @param input - The input string.
 * @returns - An array of bigints.
 */
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

/**
 * Joins an array of bigints into a string.
 * @param bigInts - An array of bigints.
 * @returns - Combined string representation.
 */
export function joinBigIntsToString(bigInts: bigint[]): string {
  let result = '';

  for (let i = 0; i < bigInts.length; i++) {
    const chunkString = bigIntToString(bigInts[i]);
    result += chunkString;
  }

  return result;
}

/**
 * Pads an array of bigints to a specified length.
 * @param array - The array to be padded.
 * @param length - The desired length of the array.
 * @returns - The padded array.
 */
export function padArray(array: bigint[], length: number): bigint[] {
  const paddingLength = length - array.length;
  if (paddingLength <= 0) {
    return array; // No padding needed
  }

  const padding = Array(paddingLength).fill(BigInt(0));
  const paddedArray = array.concat(padding);
  return paddedArray;
}

/**
 * Parses a string into an array of bigints.
 * @param input - The input string.
 * @returns - An array of bigints.
 */
export function parseStringToBigIntArray(input: string): bigint[] {
  const bigIntRegex = /([0-9]+)u128/g;
  const matches = input.match(bigIntRegex);

  if (!matches) {
    return [];
  }

  const bigInts = matches.map((match) => BigInt(match.slice(0, -4)));
  return bigInts;
}

/**
 * Fetches a random element from a given list.
 * @param list - The input list.
 * @returns - A random element from the list.
 */
export function getRandomElement<T>(list: T[]): T {
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}

/**
 * Adds data to IPFS.
 * @param data - The data to be added to IPFS.
 * @returns - Response from IPFS or undefined in case of an error.
 */
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
        return response.data;
      });

    return response;
  } catch (error) {
    console.error('IPFS error', error);
    return undefined;
  }
}

/**
 * Formats an array of bigints.
 * @param bigints - An array of bigints to a specific format to be used in an Aleo Transaction.
 * @returns - Formatted string.
 */
export const format_bigints = (bigints: bigint[]) => {
  let result = '{ ';
  for (let i = 0; i < bigints.length; i++) {
    if (i == bigints.length - 1) result += `b${i}: ${bigints[i]}u128 `;
    else result += `b${i}: ${bigints[i]}u128, `;
  }
  result += '}';
  return result;
};

/**
 * Formats a Uint8Array or string to a specific format to be used in an Aleo Transaction.
 * @param u8s - Uint8Array or string to format.
 * @returns - Formatted string.
 */
export const format_u8s = (u8s: Uint8Array | string) => {
  if (typeof u8s === 'string') {
    u8s = nacl_from_hex(u8s);
  }
  let result = '{ ';
  for (let i = 0; i < u8s.length; i++) {
    if (i == u8s.length - 1) result += `b${i}: ${u8s[i]}u8 `;
    else result += `b${i}: ${u8s[i]}u8, `;
  }
  result += '}';
  return result;
};

/**
 * Removes content from IPFS (indirectly by unpinning it).
 * @param hash - The hash of the content to be removed.
 * @returns - Response from IPFS or undefined in case of an error.
 */
export async function ipfsRm(hash: string) {
  try {
    const authorization =
      'Basic ' + btoa(`${import.meta.env.VITE_INFURA_IPFS_API_KEY}:${import.meta.env.VITE_INFURA_IPFS_API_SECRET}`);

    const response = await axios
      .post(`${import.meta.env.VITE_IPFS_API_ENDPOINT}/rm?arg=${hash}`, {
        headers: {
          authorization,
        },
      })
      .then((response) => {
        return response.data;
      });

    return response;
  } catch (error) {
    console.error('IPFS error', error);
    return undefined;
  }
}

/**
 * Converts int to string assuming utf8 encoding.
 * @param bytes - The bytes to be converted.
 * @returns - The converted string.
 */
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

/**
 * Converts hex encoded Uint8Array to string.
 * @param bytes {
 *   "b0": "247u8.private",
 *   "b1": "236u8.private",
 *   "b2": "220u8.private",
 *   "b3": "41u8.private",
 *   "b4": "30u8.private",
 *   "b5": "161u8.private",
 *   "b6": "192u8.private",
 *   "b7": "159u8.private",
 *   "b8": "12u8.private",
 *   "b9": "180u8.private",
 *   "b10": "244u8.private",
 *   "b11": "143u8.private",
 *   "b12": "165u8.private",
 *   "b13": "13u8.private",
 *   "b14": "179u8.private",
 *   "b15": "131u8.private",
 *   "b16": "50u8.private",
 *   "b17": "126u8.private",
 *   "b18": "110u8.private",
 *   "b19": "156u8.private",
 *   "b20": "223u8.private",
 *   "b21": "152u8.private",
 *   "b22": "37u8.private",
 *   "b23": "118u8.private"
 * }
 * @returns string - hex decoded Uint8Array
 */
export const decode_u8 = (bytes: string[] | string): string => {
  if (!nacl) {
    throw new Error('nacl is not defined');
  }
  if (typeof bytes === 'string') {
    bytes = [bytes];
  }
  let chunk_decoded: Uint8Array = new Uint8Array();
  // Convert to Uint8Array
  const chunkBuffer = Object.values(bytes).map((chunk) => {
    return Number(chunk.replace(/(u\d{1,3}|.private|.public)/g, ''));
  });
  chunk_decoded = new Uint8Array(chunkBuffer);
  return nacl.to_hex(chunk_decoded);
};

/**
 * Generates a random 64-bit integer.
 * @returns { bigint } - The random 64-bit integer.
 * @remarks
 * This function is used to generate a random seed for the group in past iterations of the app.
 * It is no longer used. I would not trust it to generate secure random seeds.
 * It is kept here for reference.
 */
export const initSecret = (): bigint => {
  // Calcuate a 64-bit random integer and subtract 4 bytes
  const seed = BigInt(Math.floor(Math.random() * 2 ** 64)) - BigInt(4);
  return seed;
};

/**
 * Converts hex encoded string to Uint8Array.
 * @param hex - The hex encoded string.
 * @returns Uint8Array - The Uint8Array.
 */
export const nacl_from_hex = (hex: string): Uint8Array => {
  if (!nacl || hex.length === 0) {
    return new Uint8Array();
  }
  return nacl.from_hex(hex);
};

/**
 * Generate a 32 byte symmetric key for the group to use.
 * @returns { string } - The group symmetric key.
 */
export const generateGroupSymmetricKey = (): string => {
  if (!nacl) throw new Error('Nacl is not loaded');
  const key: Uint8Array = nacl.random_bytes(32);
  return nacl.to_hex(key);
};

/**
 * Generate a key pair for encryption and decryption.
 * @returns { publicKey: string, privateKey: string } - The key pair containing the public key and private key.
 */
export const generateKeyPair = (): { publicKey: string; privateKey: string } => {
  if (!nacl) throw new Error('Nacl is not loaded');
  const keypair = nacl.crypto_box_keypair();
  return { publicKey: nacl.to_hex(keypair.boxPk), privateKey: nacl.to_hex(keypair.boxSk) };
};

/**
 * Encrypt a message using the group symmetric key.
 * @param message - The message to be encrypted.
 * @param group_symmetric_key - The group symmetric key used for encryption.
 * @returns HexCipher - The encrypted ciphertext and nonce.
 */
export const encryptGroupMessage = (message: string, group_symmetric_key: string): HexCipher => {
  if (!nacl) throw new Error('Nacl is not loaded');
  const nonce = nacl.crypto_secretbox_random_nonce();
  const ciphertext = nacl.crypto_secretbox(nacl.encode_utf8(message), nonce, nacl.from_hex(group_symmetric_key));
  return { ciphertext: nacl.to_hex(ciphertext), nonce: nacl.to_hex(nonce) };
};

/**
 * Decrypt a message using the group symmetric key.
 * @param ciphertext - The encrypted ciphertext.
 * @param nonce - The nonce used for encryption.
 * @param group_symmetric_key - The group symmetric key used for decryption.
 * @returns string | null - The decrypted message or null if decryption fails.
 */
export const decryptGroupMessage = (ciphertext: string, nonce: string, group_symmetric_key: string): string | null => {
  if (!nacl) throw new Error('Nacl is not loaded');
  if (nonce.length === 0) {
    return null;
  }
  const ciphertext_bytes: Uint8Array = nacl.from_hex(ciphertext);
  const nonce_bytes: Uint8Array = nacl.from_hex(nonce);
  const group_symmetric_key_bytes: Uint8Array = nacl.from_hex(group_symmetric_key);
  const plaintext = nacl.crypto_secretbox_open(ciphertext_bytes, nonce_bytes, group_symmetric_key_bytes);
  return plaintext ? nacl.decode_utf8(plaintext) : null;
};

/**
 * Encrypt a message using sender's private key and recipients's public key.
 * @param message - The message to be encrypted.
 * @param sender_private_key - The sender's private key.
 * @param recipient_public_key - The recipient's public key.
 * @returns HexCipher - The encrypted ciphertext and nonce.
 */
export const encryptMessage = (
  message: string,
  sender_private_key: string,
  recipient_public_key: string,
): HexCipher => {
  if (!nacl) throw new Error('Nacl is not loaded');
  const nonce = nacl.crypto_box_random_nonce();
  const ciphertext = nacl.crypto_box(
    nacl.encode_utf8(message),
    nonce,
    nacl.from_hex(recipient_public_key),
    nacl.from_hex(sender_private_key),
  );
  return { ciphertext: nacl.to_hex(ciphertext), nonce: nacl.to_hex(nonce) };
};

/**
 * Decrypt a message using sender's public key and recipients's private key.
 * @param ciphertext - The encrypted ciphertext.
 * @param nonce - The nonce used for encryption.
 * @param sender_public_key - The sender's public key.
 * @param recipient_private_key - The recipient's private key.
 * @returns string | null - The decrypted message or null if decryption fails.
 */
export const decryptMessage = (
  ciphertext: string,
  nonce: string,
  sender_public_key: string,
  recipient_private_key: string,
): string | null => {
  if (!nacl) throw new Error('Nacl is not loaded');
  const ciphertext_bytes: Uint8Array = nacl.from_hex(ciphertext);
  const nonce_bytes: Uint8Array = nacl.from_hex(nonce);
  const sender_public_key_bytes: Uint8Array = nacl.from_hex(sender_public_key);
  const recipient_private_key_bytes: Uint8Array = nacl.from_hex(recipient_private_key);
  const plaintext = nacl.crypto_box_open(
    ciphertext_bytes,
    nonce_bytes,
    sender_public_key_bytes,
    recipient_private_key_bytes,
  );
  return plaintext ? nacl.decode_utf8(plaintext) : null;
};

/**
 * Load content from IPFS which contains JSON or text.
 * @param path - The path to the content on IPFS.
 * @returns string - The content.
 */
export const resolve = async (path: string) => {
  const cipher_text = await axios.get(`https://ipfs.io/ipfs/${path}`).then((response) => {
    return response.data;
  });
  return cipher_text;
};

/**
 * Take an Aleo address and shorten it to first four and last four characters.
 * @param recipient - The Aleo address to be shortened.
 * @returns string - The shortened address.
 */
export const truncateAddress = (recipient: string): string => {
  if (recipient.length <= 8) {
    return recipient; // No need to truncate if length is 8 or less
  }

  const truncatedRecipient = recipient.substring(0, 4) + '...' + recipient.substring(recipient.length - 4);
  return truncatedRecipient;
};
