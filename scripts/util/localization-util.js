'use strict';
// libraries

// modules
// constants
const localization = require('../localization.json');

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

const getLanguages = () => {
  return localization.languages;
};

const getLanguageList = (defaultCode) => {
  const languages = {};
  const options = [];
  Object.keys(localization.languages).forEach((languageCode) => {
    const option = {};
    option.code = languageCode;
    option.name = localization.languages[languageCode];
    if (defaultCode == languageCode) {
      option.selected = 'selected';
    } else {
      option.selected = '';
    }
    options.push(option);
  });
  languages.options = options;
  return languages;
};

const getLanguageData = (language) => {
  const data = {};
  Object.keys(localization).forEach((key) => {
    data[key] = localization[key][language];
  });
  return data;
};

exports.init = init;
exports.deactivate = deactivate;
exports.getLanguageData = getLanguageData;
exports.getLanguages = getLanguages;
exports.getLanguageList = getLanguageList;
