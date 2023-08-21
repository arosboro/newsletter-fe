/**
 * @file Unit tests for utility functions in the `util` module.
 */

import { expect, test } from 'vitest';

import {
  bigIntToString,
  decode,
  // decode_u8,
  // decryptGroupMessage,
  // decryptMessage,
  // encryptGroupMessage,
  // encryptMessage,
  format_bigints,
  format_u8s,
  // generateGroupSymmetricKey,
  // generateKeyPair,
  getRandomElement,
  joinBigIntsToString,
  // nacl_from_hex,
  padArray,
  parseStringToBigIntArray,
  safeParseInt,
  splitStringToBigInts,
  stringToBigInt,
  truncateAddress,
} from './util';

/**
 * Tests for the `safeParseInt` function.
 */
test('safeParseInt', () => {
  expect(safeParseInt('')).toBe(0);
  expect(safeParseInt('0')).toBe(0);
  expect(safeParseInt('1')).toBe(1);
  expect(safeParseInt('foobar')).toBe(0);
});

/**
 * Tests for the `stringToBigInt` function.
 */
test('stringToBigInt', () => {
  expect(stringToBigInt('')).toBe(0n);
  expect(stringToBigInt('a')).toBe(97n);
  expect(stringToBigInt('ab')).toBe(25185n);
  expect(stringToBigInt('abc')).toBe(6513249n);
  expect(stringToBigInt('abcd')).toBe(1684234849n);
  expect(stringToBigInt('abcde')).toBe(435475931745n);
  expect(stringToBigInt('abcdef')).toBe(112585661964897n);
  expect(stringToBigInt('abcdefg')).toBe(29104508263162465n);
  expect(stringToBigInt('abcdefgh')).toBe(BigInt(7523094288207667809n));
  expect(stringToBigInt('abcdefghi')).toBe(BigInt(1944431222027710587489n));
});

/**
 * Tests for the `bigIntToString` function.
 */
test('bigIntToString', () => {
  expect(bigIntToString(0n)).toBe('');
  expect(bigIntToString(97n)).toBe('a');
  expect(bigIntToString(25185n)).toBe('ab');
  expect(bigIntToString(6513249n)).toBe('abc');
  expect(bigIntToString(1684234849n)).toBe('abcd');
  expect(bigIntToString(435475931745n)).toBe('abcde');
  expect(bigIntToString(112585661964897n)).toBe('abcdef');
  expect(bigIntToString(29104508263162465n)).toBe('abcdefg');
  expect(bigIntToString(7523094288207667809n)).toBe('abcdefgh');
  expect(bigIntToString(1944431222027710587489n)).toBe('abcdefghi');
});

/**
 * Tests for the `splitStringToBigInts` function.
 */
test('splitStringToBigInts', () => {
  expect(splitStringToBigInts('')).toEqual([]);
  expect(splitStringToBigInts('a')).toEqual([97n]);
  expect(splitStringToBigInts('ab')).toEqual([25185n]);
  expect(splitStringToBigInts('abc')).toEqual([6513249n]);
  expect(splitStringToBigInts('abcd')).toEqual([1684234849n]);
  expect(splitStringToBigInts('abcde')).toEqual([435475931745n]);
  expect(splitStringToBigInts('abcdef')).toEqual([112585661964897n]);
  expect(splitStringToBigInts('abcdefg')).toEqual([29104508263162465n]);
  expect(splitStringToBigInts('abcdefgh')).toEqual([7523094288207667809n]);
  expect(splitStringToBigInts('abcdefghi')).toEqual([1944431222027710587489n]);
});

/**
 * Tests for the `joinBigIntsToString` function.
 */
test('joinBigIntsToString', () => {
  expect(joinBigIntsToString([97n, 98n, 99n])).toBe('abc');
  expect(joinBigIntsToString([1944431222027710587489n, 1944431222027710587489n])).toBe('abcdefghiabcdefghi');
});

/**
 * Tests for the `padArray` function.
 */
test('padArray', () => {
  expect(padArray([], 0)).toEqual([]);
  expect(padArray([], 1)).toEqual([BigInt(0)]);
  expect(padArray([], 2)).toEqual([BigInt(0), BigInt(0)]);
  expect(padArray([], 3)).toEqual([BigInt(0), BigInt(0), BigInt(0)]);
  expect(padArray([], 4)).toEqual([BigInt(0), BigInt(0), BigInt(0), BigInt(0)]);
  expect(padArray([], 5)).toEqual([BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0)]);
  expect(padArray([], 6)).toEqual([BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0)]);
  expect(padArray([], 7)).toEqual([BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0), BigInt(0)]);
  expect(padArray([], 8)).toEqual([
    BigInt(0),
    BigInt(0),
    BigInt(0),
    BigInt(0),
    BigInt(0),
    BigInt(0),
    BigInt(0),
    BigInt(0),
  ]);
});

/**
 * Tests for the `parseStringToBigIntArray` function.
 */
test('parseStringToBigIntArray', () => {
  expect(parseStringToBigIntArray('')).toEqual([]);
  expect(parseStringToBigIntArray('a')).toEqual([]);
  expect(parseStringToBigIntArray('ab')).toEqual([]);
  expect(parseStringToBigIntArray('abc')).toEqual([]);
  expect(parseStringToBigIntArray('abcd')).toEqual([]);
  expect(parseStringToBigIntArray('abcde')).toEqual([]);
  expect(parseStringToBigIntArray('abcdef')).toEqual([]);
  expect(parseStringToBigIntArray('abcdefg')).toEqual([]);
  expect(parseStringToBigIntArray('abcdefgh')).toEqual([]);
  expect(parseStringToBigIntArray('abcdefghi')).toEqual([]);
});

/**
 * Tests for the `getRandomElement` function.
 */
test('getRandomElement', () => {
  expect(getRandomElement([])).toBeUndefined();
  expect(getRandomElement([1])).toBe(1);
  expect(getRandomElement([1, 2])).toBeLessThan(3);
});

/**
 * Tests for the `format_bigints` function.
 */
test('format_bigints', () => {
  expect(format_bigints([])).toBe('{ }');
  expect(format_bigints([0n])).toBe('{ b0: 0u128 }');
  expect(format_bigints([0n, 1n])).toBe('{ b0: 0u128, b1: 1u128 }');
  expect(format_bigints([0n, 1n, 2n])).toBe('{ b0: 0u128, b1: 1u128, b2: 2u128 }');
  expect(format_bigints([0n, 1n, 2n, 3n])).toBe('{ b0: 0u128, b1: 1u128, b2: 2u128, b3: 3u128 }');
});

/**
 * Tests for the `format_u8s` function.
 */
test('format_u8s', () => {
  expect(format_u8s(new Uint8Array([]))).toBe('{ }');
  expect(format_u8s(new Uint8Array([0]))).toBe('{ b0: 0u8 }');
  expect(format_u8s(new Uint8Array([0, 1]))).toBe('{ b0: 0u8, b1: 1u8 }');
  expect(format_u8s(new Uint8Array([0, 1, 2]))).toBe('{ b0: 0u8, b1: 1u8, b2: 2u8 }');
  expect(format_u8s(new Uint8Array([0, 1, 2, 3]))).toBe('{ b0: 0u8, b1: 1u8, b2: 2u8, b3: 3u8 }');
});

/**
 * Tests for the `decode` function.
 */
test('decode', () => {
  expect(
    decode([
      '130536785169552329658591906036378201425u128.private',
      '153200472312346935867020225950573999939u128.private',
      '1529045732305547980498917800371766u128.private',
      '0u128.private',
    ]),
  ).toBe('QmcYmCV8LFE7hx4bC7As1ga6hK4LtVAs6fqmtWc5Xx9EcK');
});

// test('decode_u8', () => {
//   expect(
//     decode_u8([
//       '34u8.private',
//       '15u8.private',
//       '142u8.private',
//       '66u8.private',
//       '197u8.private',
//       '207u8.private',
//       '192u8.private',
//       '145u8.private',
//       '106u8.private',
//       '81u8.private',
//       '33u8.private',
//       '99u8.private',
//       '250u8.private',
//       '9u8.private',
//       '41u8.private',
//       '38u8.private',
//       '8u8.private',
//       '193u8.private',
//       '234u8.private',
//       '91u8.private',
//       '89u8.private',
//       '77u8.private',
//       '131u8.private',
//       '105u8.private',
//     ]),
//   ).toBe('');
// });

// test('nacl_from_hex', () => {
//   expect(nacl_from_hex('')).toEqual(new Uint8Array());
//   expect(nacl_from_hex('00')).toEqual(new Uint8Array([]));
//   expect(nacl_from_hex('DEADBEEF')).toEqual(new Uint8Array([]));
// });

// test('generateGroupSymmetricKey', () => {
//   expect(generateGroupSymmetricKey()).toHaveLength(64);
// });

// test('generateKeyPair', () => {
//   expect(generateKeyPair()).toHaveLength(2);
//   expect(generateKeyPair().publicKey).toHaveLength(64);
//   expect(generateKeyPair().privateKey).toHaveLength(64);
// });

// test('encryptAndDecryptGroupMessage', () => {
//   const message = 'Hello, world!';
//   const group_symmetric_key = generateGroupSymmetricKey();
//   const { ciphertext, nonce } = encryptGroupMessage(message, group_symmetric_key);
//   const decrypted_message = decryptGroupMessage(ciphertext, nonce, group_symmetric_key);
//   expect(decrypted_message).toBe(message);
// });

// test('encryptAndDecryptMessage', () => {
//   const message = 'Hello, world!';
//   const sender_key_pair = generateKeyPair();
//   const recipient_key_pair = generateKeyPair();
//   const { ciphertext, nonce } = encryptMessage(message, sender_key_pair.privateKey, recipient_key_pair.publicKey);
//   const decrypted_message = decryptMessage(ciphertext, nonce, sender_key_pair.publicKey, recipient_key_pair.privateKey);
//   expect(decrypted_message).toBe(message);
// });

/**
 * Tests for the `truncateAddress` function.
 */
test('truncateAddress', () => {
  expect(truncateAddress('')).toBe('');
  expect(truncateAddress('a')).toBe('a');
  expect(truncateAddress('ab')).toBe('ab');
  expect(truncateAddress('abc')).toBe('abc');
  expect(truncateAddress('abcdefgh')).toBe('abcdefgh');
  expect(truncateAddress('abcdefghi')).toBe('abcd...fghi');
});
