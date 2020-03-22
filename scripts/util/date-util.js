'use strict';
// libraries

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

const getDate = () => {
  return new Date().toISOString();
};

exports.init = init;
exports.deactivate = deactivate;
exports.getDate = getDate;
