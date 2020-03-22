'use strict';
// libraries
const crypto = require('crypto');

// modules

// constants

// variables
/* eslint-disable no-unused-vars */
let config;
let loggingUtil;
/* eslint-enable no-unused-vars */

// functions
const init = (_config, _loggingUtil) => {
  if (_config === undefined) {
    throw new Error('config is required.');
  }
  if (_loggingUtil === undefined) {
    throw new Error('loggingUtil is required.');
  }
  config = _config;
  loggingUtil = _loggingUtil;
};

const deactivate = () => {
  config = undefined;
  loggingUtil = undefined;
};

const shuffle = (array) => {
  if (array == undefined) {
    throw new Error('array is required.');
  }
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const getRandom = (min, max) => {
  return Math.random() * (max - min) + min;
};

const getRandomInt = (min, max) => {
  return Math.floor(getRandom(Math.floor(min), Math.floor(max)));
};

const getRandomArrayElt = (array) => {
  const ix = getRandomInt(0, array.length);
  return array[ix];
};

const getRandomHex32 = () => {
  return crypto.randomBytes(32).toString('hex');
};

const getRandomHex33 = () => {
  return crypto.randomBytes(33).toString('hex');
};

exports.init = init;
exports.deactivate = deactivate;
exports.getRandomArrayElt = getRandomArrayElt;
exports.shuffle = shuffle;
exports.getRandom = getRandom;
exports.getRandomInt = getRandomInt;
exports.getRandomHex32 = getRandomHex32;
exports.getRandomHex33 = getRandomHex33;
