'use strict';
// libraries
const blake = require('blakejs');

// modules

// constants

// variables
/* eslint-disable no-unused-vars */
let config;
let loggingUtil;
/* eslint-enable no-unused-vars */

// functions
const init = async (_config, _loggingUtil) => {
  if (_config === undefined) {
    throw new Error('config is required.');
  }
  if (_loggingUtil === undefined) {
    throw new Error('loggingUtil is required.');
  }
  config = _config;
  loggingUtil = _loggingUtil;
};

const deactivate = async () => {
  config = undefined;
  loggingUtil = undefined;
};

const getHexFromBytes = (bytes) => {
  return Buffer.from(bytes).toString('hex').toUpperCase();
};

const getBytesFromHex = (hex) => {
  if (hex.length % 2 == 1) {
    hex = '0' + hex;
  }
  const ret = new Uint8Array(hex.length / 2);
  for (let i = 0; i < ret.length; i++) {
    ret[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return ret;
};


const getHash = (title) => {
  const context = blake.blake2bInit(32, null);
  const salt = getBytesFromHex(config.hashSecret);
  const data = getBytesFromHex(title);
  blake.blake2bUpdate(context, salt);
  blake.blake2bUpdate(context, data);
  const hash = getHexFromBytes(blake.blake2bFinal(context)).toUpperCase();
  // loggingUtil.log('getHash', salt, data);
  // loggingUtil.log('getHash', title, hash);
  return hash;
};

// exports
exports.init = init;
exports.deactivate = deactivate;
exports.getHash = getHash;
