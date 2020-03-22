'use strict';
// libraries
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');

// modules
const dateUtil = require('../util/date-util.js');

// constants
const DATA_DIR = 'data';

const ACCOUNTS_DIR = 'accounts';

const RECORDINGS_DIR = 'recordings';

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

  await mkdirp(DATA_DIR);
  await mkdirp(path.join(DATA_DIR, ACCOUNTS_DIR));
  await mkdirp(path.join(DATA_DIR, RECORDINGS_DIR));
};

const deactivate = () => {
  config = undefined;
  loggingUtil = undefined;
};

const setDataPath = async (pathParts) => {
  let dataPath = DATA_DIR;
  while (pathParts.length > 0) {
    await mkdirp(dataPath);
    dataPath =path.join(dataPath, pathParts.shift());
  }
  return dataPath;
};

const getDataPath = (pathParts) => {
  let dataPath = DATA_DIR;
  while (pathParts.length > 0) {
    dataPath =path.join(dataPath, pathParts.shift());
  }
  return dataPath;
};

const set = async (pathParts, value) => {
  loggingUtil.debug(dateUtil.getDate(), 'STARTED set', pathParts, value);
  const dataPath = await setDataPath(pathParts);
  const valuePathTmp = dataPath + '.json_';
  const valuePath = dataPath + '.json';

  fs.writeFileSync(valuePathTmp, JSON.stringify(value));
  fs.renameSync(valuePathTmp, valuePath);
  loggingUtil.debug(dateUtil.getDate(), 'SUCCESS set', valuePath);
};

const get = (pathParts) => {
  loggingUtil.debug(dateUtil.getDate(), 'STARTED get', pathParts);
  const dataPath = getDataPath(pathParts);
  const valuePath = dataPath + '.json';

  if (fs.existsSync(valuePath)) {
    const value = JSON.parse(fs.readFileSync(valuePath));
    loggingUtil.debug(dateUtil.getDate(), 'SUCCESS get', valuePath, value);
    return value;
  } else {
    loggingUtil.debug(dateUtil.getDate(), 'FAILURE get', valuePath);
    return undefined;
  }
};

const getDirs = (parent) => {
  return fs.readdirSync(parent, {withFileTypes: true})
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
};

const getFiles = (parent) => {
  return fs.readdirSync(parent, {withFileTypes: true})
      .filter((dirent) => dirent.isFile())
      .map((dirent) => dirent.name);
};

const getAll = (subdir, _userDirName) => {
  const basePath = path.join(DATA_DIR, subdir);
  const userDirs = [];
  if (_userDirName == undefined) {
    getDirs(basePath).forEach((userDirName) => {
      userDirs.push(userDirName);
    });
  } else {
    const userDirPath = path.join(basePath, _userDirName);
    if (fs.existsSync(userDirPath)) {
      userDirs.push(_userDirName);
    }
  }

  const all = [];

  putFilesIntoAll(all, basePath, []);

  for (let userIx = 0; userIx < userDirs.length; userIx++) {
    const userDirName = userDirs[userIx];
    const userDirPath = path.join(basePath, userDirName);

    putFilesIntoAll(all, userDirPath, [userDirName]);

    const storyDirs = getDirs(userDirPath);
    for (let storyIx = 0; storyIx < storyDirs.length; storyIx++) {
      const storyDirName = storyDirs[storyIx];
      const storyDirPath = path.join(userDirPath, storyDirName);

      putFilesIntoAll(all, storyDirPath, [userDirName, storyDirName]);

      const voteDirs = getDirs(storyDirPath);
      for (let voteDirIx = 0; voteDirIx < voteDirs.length; voteDirIx++) {
        const voteDirName = voteDirs[voteDirIx];
        const voteDirPath = path.join(storyDirPath, voteDirName);
        putFilesIntoAll(all, voteDirPath, [userDirName, storyDirName, voteDirName]);
      }
    }
  }
  return all;
};

const getPrefix = (str) => {
  if (str.includes('.')) {
    return str.substring(0, str.indexOf('.'));
  } else {
    return str;
  }
};

const putFilesIntoAll = (all, dirPath, dirPathElts) => {
  const files = getFiles(dirPath);
  for (let fileIx = 0; fileIx < files.length; fileIx++) {
    const fileName = files[fileIx];
    const filePath = path.join(dirPath, fileName);
    const key = [...dirPathElts, fileName];
    const value = JSON.parse(fs.readFileSync(filePath));
    const elt = {};

    for (let ix = 0; ix < key.length; ix++) {
      key[ix] = getPrefix(key[ix]);
    }

    if (key.length > 0) {
      elt.getUserHash = () => {
        return key[0];
      };
    }
    if (key.length > 1) {
      elt.getStoryHash = () => {
        return key[1];
      };
    }
    if (key.length > 2) {
      elt.getStoryIx = () => {
        return key[2];
      };
    }
    if (key.length > 3) {
      elt.getDrawingArtistHash = () => {
        return key[3];
      };
    }

    elt.key = key;
    elt.value = value;
    all.push(elt);
  }
};

const setAccount = async (key, value) => {
  const pathParts = [ACCOUNTS_DIR, ...key];
  await set(pathParts, value);
};

const getAccount = (key) => {
  const pathParts = [ACCOUNTS_DIR, ...key];
  return get(pathParts);
};

const setRecording = async (key, value) => {
  const pathParts = [RECORDINGS_DIR, ...key];
  await set(pathParts, value);
};

const getRecording = (key) => {
  const pathParts = [RECORDINGS_DIR, ...key];
  return get(pathParts);
};

const getRecordings = () => {
  return getAll(RECORDINGS_DIR);
};

exports.init = init;
exports.deactivate = deactivate;
exports.setAccount = setAccount;
exports.getAccount = getAccount;
exports.setRecording = setRecording;
exports.getRecording = getRecording;
exports.getRecordings = getRecordings;
