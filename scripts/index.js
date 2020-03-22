'use strict';
// libraries

// modules
const dateUtil = require('./util/date-util.js');
const randomUtil = require('./util/random-util.js');
const ipUtil = require('./util/ip-util.js');
const localizationUtil = require('./util/localization-util.js');
const hashUtil = require('./util/hash-util.js');

const filesystemUtil = require('./filesystem/filesystem-util.js');

const webServerUtil = require('./web/server-util.js');

// constants
const config = require('./config.json');
const configOverride = require('../config.json');

const modules = [];

const loggingUtil = {};
loggingUtil.log = console.log;
loggingUtil.isDebugEnabled = () => {
  return false;
};
loggingUtil.debug = () => {};
// loggingUtil.debug = console.log;
loggingUtil.trace = console.trace;

const init = async () => {
  loggingUtil.log(dateUtil.getDate(), 'STARTED init');

  overrideConfig();
  calculateConfigValues();

  modules.push(dateUtil);
  modules.push(randomUtil);
  modules.push(ipUtil);
  modules.push(localizationUtil);
  modules.push(hashUtil);
  modules.push(filesystemUtil);
  modules.push(webServerUtil);

  for (let moduleIx = 0; moduleIx < modules.length; moduleIx++) {
    const item = modules[moduleIx];
    await item.init(config, loggingUtil);
  }

  webServerUtil.setCloseProgramFunction(closeProgram);

  process.on('SIGINT', closeProgram);

  loggingUtil.log(dateUtil.getDate(), 'SUCCESS init');
};

const deactivate = async () => {
  loggingUtil.log(dateUtil.getDate(), 'STARTED deactivate');
  const reverseModules = modules.slice().reverse();
  for (let moduleIx = 0; moduleIx < reverseModules.length; moduleIx++) {
    const item = reverseModules[moduleIx];
    await item.deactivate(config, loggingUtil);
  }
  loggingUtil.log(dateUtil.getDate(), 'SUCCESS deactivate');
};

const closeProgram = async () => {
  console.log('STARTED closing program.');
  await deactivate();
  console.log('SUCCESS closing program.');
  process.exit(0);
};

const isObject = function(obj) {
  return (!!obj) && (obj.constructor === Object);
};

const overrideValues = (src, dest) => {
  Object.keys(src).forEach((key) => {
    const srcValue = src[key];
    const destValue = dest[key];
    if (isObject(destValue)) {
      overrideValues(srcValue, destValue);
    } else {
      dest[key] = srcValue;
    }
  });
};

const calculateConfigValues = () => {
};

const overrideConfig = () => {
  loggingUtil.debug('STARTED overrideConfig', config);
  overrideValues(configOverride, config);
  loggingUtil.debug('SUCCESS overrideConfig', config);
};

init()
    .catch((e) => {
      console.log('FAILURE init.', e.message);
      console.trace('FAILURE init.', e);
    });
