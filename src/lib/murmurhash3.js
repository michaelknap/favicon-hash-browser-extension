/**
 * MurmurHash3 32-bit JavaScript Implementation
 * ============================================
 * 
 * Author: Michael Knap
 * Date: 4/12/2023
 * 
 * Overview:
 * --------
 * This is a MurmurHash3 algorithm implementation for strings.
 * Yes, it's written in snake case... deal with it.
 * 
 * The MurmurHash3 is a non-cryptographic hash function.
 * 
 * Usage:
 * -----
 * The main function, `mmh3`, takes a string input and an optional seed value (defaulted to 0).
 * It processes the input and returns a 32-bit hash.
 * 
 * Example:
 * -------
 * let favicon_hash = mmh3(base64_encoded_favicon);
 * 
 * @param {string} input - The input string to hash.
 * @param {number} [seed=0] - Optional seed value for the hash calculation.
 * @returns {number} - The 32-bit unsigned integer hash result.
 * 
 * License:
 * -------
 * MIT
 * This software is provided "as is", without warranty of any kind, express or implied.
 * 
 */
'use strict';

function mmh3(input, seed = 0) {
  let const_multiplier_1 = 0xcc9e2d51;
  let const_multiplier_2 = 0x1b873593;
  let rotate_bits_1 = 15;
  let rotate_bits_2 = 13;
  let hash_multiplier = 5;
  let hash_increment = 0xe6546b64;
  let hash = seed;
  let input_length = input.length;
  let num_rounds = Math.floor(input_length / 4);

  for (let i = 0; i < num_rounds; i++) {
    let block_value = (input.charCodeAt(i * 4) & 0xff) |
      ((input.charCodeAt(i * 4 + 1) & 0xff) << 8) |
      ((input.charCodeAt(i * 4 + 2) & 0xff) << 16) |
      ((input.charCodeAt(i * 4 + 3) & 0xff) << 24);

    block_value = (((block_value & 0xffff) * const_multiplier_1) + ((((
        block_value >>> 16) * const_multiplier_1) & 0xffff) << 16)) &
      0xffffffff;
    block_value = (block_value << rotate_bits_1) | (block_value >>> (32 -
      rotate_bits_1));
    block_value = (((block_value & 0xffff) * const_multiplier_2) + ((((
        block_value >>> 16) * const_multiplier_2) & 0xffff) << 16)) &
      0xffffffff;

    hash ^= block_value;
    hash = (hash << rotate_bits_2) | (hash >>> (32 - rotate_bits_2));
    hash = (((hash & 0xffff) * hash_multiplier) + ((((hash >>> 16) *
        hash_multiplier) & 0xffff) << 16)) &
      0xffffffff;
    hash += hash_increment;
  }

  let tail_value = 0;

  switch (input_length % 4) {
    case 3:
      tail_value ^= (input.charCodeAt(input_length - 1) & 0xff) << 16;
    case 2:
      tail_value ^= (input.charCodeAt(input_length - 2) & 0xff) << 8;
    case 1:
      tail_value ^= (input.charCodeAt(input_length - 3) & 0xff);
      tail_value = (((tail_value & 0xffff) * const_multiplier_1) + ((((
          tail_value >>> 16) * const_multiplier_1) & 0xffff) << 16)) &
        0xffffffff;
      tail_value = (tail_value << rotate_bits_1) | (tail_value >>> (32 -
        rotate_bits_1));
      tail_value = (((tail_value & 0xffff) * const_multiplier_2) + ((((
          tail_value >>> 16) * const_multiplier_2) & 0xffff) << 16)) &
        0xffffffff;
      hash ^= tail_value;
  }

  hash ^= input_length;
  hash ^= (hash >>> 16);
  hash = (((hash & 0xffff) * 0x85ebca6b) + ((((hash >>> 16) * 0x85ebca6b) &
    0xffff) << 16)) & 0xffffffff;
  hash ^= (hash >>> 13);
  hash = (((hash & 0xffff) * 0xc2b2ae35) + ((((hash >>> 16) * 0xc2b2ae35) &
    0xffff) << 16)) & 0xffffffff;
  hash ^= (hash >>> 16);

  return hash & 0xFFFFFFFF;
}
