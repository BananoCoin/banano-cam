'use strict';
// libraries
const http = require('http');
const https = require('https');
const cors = require('cors');
const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

// modules
const dateUtil = require('../util/date-util.js');
const ipUtil = require('../util/ip-util.js');
const randomUtil = require('../util/random-util.js');
const localizationUtil = require('../util/localization-util.js');
const hashUtil = require('../util/hash-util.js');
const filesystemUtil = require('../filesystem/filesystem-util.js');

// constants
const NUMBER_PATTERN = new RegExp('^\\d+$');

const HASH_PATTERN = new RegExp('^[0123456789abcdefABCDEF]{64}$');

const SESSION_KEY_PATTERN_STR = '^[0123456789abcdefABCDEF]{66}$';

const SEED_PATTERN_STR = '^[0123456789abcdefABCDEF]{64}$';

const ACCOUNT_PATTERN_STR = '^ban_[13][13456789abcdefghijkmnopqrstuwxyz]{59}$';

// variables
let config;
let loggingUtil;
let instance;
let closeProgramFn;

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

  await initWebServer();
};

const deactivate = async () => {
  config = undefined;
  loggingUtil = undefined;
  closeProgramFn = undefined;
  instance.close();
};

const initWebServer = async () => {
  const app = express();

  app.engine('handlebars', exphbs({
    defaultLayout: 'main',
  }));
  app.set('view engine', 'handlebars');

  app.use(express.static('static-html'));
  app.use(express.urlencoded({
    limit: '50mb',
    extended: true,
  }));
  app.use(bodyParser.json({
    limit: '50mb',
    extended: true,
  }));
  app.use((err, req, res, next) => {
    if (err) {
      loggingUtil.log(dateUtil.getDate(), 'error', err.message, err.body);
      res.send('');
    } else {
      next();
    }
  });

  app.use(cookieParser(config.cookieSecret));

  const isValidSessionKey = (sessionKey) => {
    const regex = new RegExp(SESSION_KEY_PATTERN_STR);
    const isValid = regex.test(sessionKey);
    return isValid;
  };

  const getSessionData = async (req) => {
    const data = {};
    data.sessionKey = getSessionKeyCookie(req);
    data.hasSessionKey = isValidSessionKey(data.sessionKey);
    return data;
  };

  app.get('/', async (req, res) => {
    res.redirect(302, '/session');
  });

  app.post('/', async (req, res) => {
    res.redirect(302, '/');
  });

  app.post('/', async (req, res) => {
    res.redirect(302, '/');
  });

  app.get('/session', async (req, res) => {
    const data = await getSessionData(req);
    const language = getLanguageCookie(req);
    data.accountPattern = ACCOUNT_PATTERN_STR;
    data.seedPattern = SEED_PATTERN_STR;
    data.sessionKeyPattern = SESSION_KEY_PATTERN_STR;

    const filePath = hashUtil.getHash(data.sessionKey);
    const accountData = await filesystemUtil.getAccount([filePath]);
    // loggingUtil.log(dateUtil.getDate(), 'session accountData', accountData);
    if (accountData) {
      data.hasAccount = true;
      data.account = accountData.account;
    } else {
      data.hasAccount = false;
    }

    data.languages = localizationUtil.getLanguageList(language);
    data.lang = localizationUtil.getLanguageData(language);
    data.message = getLoginMessageCookie(req);
    // loggingUtil.log(dateUtil.getDate(), 'session', data);
    res.render('session', data);
  });

  app.post('/session', async (req, res) => {
    const ip = ipUtil.getIp(req);
    // loggingUtil.log(dateUtil.getDate(), 'STARTED session');

    setLoginMessageCookie(res, '');
    const action = req.body.action;
    if (action == 'login') {
      let filePath;
      if ((req.body.session_key != undefined) && req.body.session_key.length > 0) {
        const sessionKey = req.body.session_key;
        setSessionKeyCookie(res, sessionKey);
        loggingUtil.log(dateUtil.getDate(), 'login-old', sessionKey);
        filePath = hashUtil.getHash(sessionKey);
      } else {
        const newSessionKey = randomUtil.getRandomHex33();
        setSessionKeyCookie(res, newSessionKey);
        loggingUtil.log(dateUtil.getDate(), 'login-new', newSessionKey);
        filePath = hashUtil.getHash(newSessionKey);
      }

      if ((req.body.account)&&(req.body.account.length > 0)) {
        let setAccountFlag = false;
        const account = req.body.account;
        const isValidAccount = () => {
          const validAccount = new RegExp(ACCOUNT_PATTERN_STR).test(account);
          return validAccount;
        };
        const validAccount = isValidAccount();
        if (validAccount) {
          loggingUtil.log(dateUtil.getDate(), `account '${account}'`);
          setAccountFlag = true;
        } else {
          setLoginMessageCookie(res, `WARNING: invalid account "${account}"`);
          loggingUtil.log(dateUtil.getDate(), `WARNING login, invalid account '${account}'`);
        }
        if (setAccountFlag) {
          const fileData = {};
          fileData.account = req.body.account;
          const accountKey = [filePath];
          await filesystemUtil.setAccount(accountKey, fileData);
        }
      }
    }
    if (action == 'logout') {
      setSessionKeyCookie(res, '');
    }
    // loggingUtil.log(dateUtil.getDate(), 'SUCCESS session');
    res.redirect(302, '/session');
  });

  app.post('/language', async (req, res) => {
    if (req.body.language) {
      const newLanguage = req.body.language;
      const languages = localizationUtil.getLanguages();
      if (languages[newLanguage]) {
        setLanguageCookie(res, newLanguage);
        res.send('set language to:' + languages[newLanguage]);
      } else {
        res.send('unknown language code:' + newLanguage);
      }
    } else {
      res.send('no language');
    }
  });

  app.get('/favicon.ico', async (req, res) => {
    res.redirect(302, '/favicon-16x16.png');
  });

  app.post('/favicon.ico', async (req, res) => {
    res.redirect(302, '/favicon.ico');
  });

  app.options('/api', cors());

  app.post('/api', cors(), async (req, res) => {
    // loggingUtil.log(dateUtil.getDate(), 'api STARTED', req.body);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    };
    const url = config.bananodeApiUrl;
    const proxyReq = https.request(url, options, (proxyRes) => {
      proxyRes.on('data', (response) => {
        // loggingUtil.log(dateUtil.getDate(), 'api SUCCESS', req.body);
        res.send(response);
      });
    });

    proxyReq.on('error', (error) => {
      loggingUtil.log(dateUtil.getDate(), 'api FAILURE', req.body, error);
    });

    proxyReq.write(JSON.stringify(req.body));
    proxyReq.end();
  });

  app.get('/recording', async (req, res) => {
    const data = await getSessionData(req);
    const language = getLanguageCookie(req);
    data.languages = localizationUtil.getLanguageList(language);
    data.lang = localizationUtil.getLanguageData(language);
    const filePath = hashUtil.getHash(data.sessionKey);
    const accountData = await filesystemUtil.getAccount([filePath]);
    if (accountData) {
      data.hasAccount = true;
      data.account = accountData.account;
    } else {
      data.hasAccount = false;
    }
    res.render('recording', data);
  });


  app.get('/recording.json', async (req, res) => {
    res.redirect(302, '/recording.json');
  });

  app.post('/recording.json', async (req, res) => {
    const queryObject = req.body;
    // loggingUtil.log('/recording.json queryObject', queryObject);
    const data = await getSessionData(req);
    const userFilePath = hashUtil.getHash(data.sessionKey);

    const recordingKey = [userFilePath];
    if (queryObject.action) {
      data.messageType = queryObject.action;
      if (data.hasSessionKey) {
        if (queryObject.action == 'submit_recording') {
          const recordingData = {};
          recordingData.recording = queryObject.recording;
          recordingData.public = false;
          // loggingUtil.log('/recording.json setRecording', recordingKey, recordingData);
          await filesystemUtil.setRecording(recordingKey, recordingData);
          data.messageType = 'success';
          data.message = `${queryObject.action}`;
          data.recording = recordingData;
        } else if (queryObject.action == 'change_visibility') {
          data.recording = await filesystemUtil.getRecording(recordingKey);
          // loggingUtil.log('/recording.json change_visibility', recordingKey, data.recording);
          if (data.recording == undefined) {
            data.recording = {};
            data.recording.recording = '';
          }
          if (queryObject.public) {
            data.recording.public = true;
          } else {
            data.recording.public = false;
          }
          await filesystemUtil.setRecording(recordingKey, data.recording);
        } else {
          data.messageType = 'action_error';
          data.message = `unknown action:${queryObject.action}`;
        }
      } else {
        data.messageType = 'failure';
        data.message = `failure:${queryObject.action} no session key`;
      }
    } else {
      data.recording = await filesystemUtil.getRecording(recordingKey);
    }

    const accountData = await filesystemUtil.getAccount([userFilePath]);
    if (accountData) {
      data.hasAccount = true;
      data.account = accountData.account;
    } else {
      data.hasAccount = false;
    }

    data.recordings = [];

    const recordings = await filesystemUtil.getRecordings();
    for (let recordingIx = 0; recordingIx < recordings.length; recordingIx++) {
      const recording = recordings[recordingIx];
      const recordingUser = recording.getUserHash();
      const accountData = filesystemUtil.getAccount([recordingUser]);
      if (accountData) {
        recording.account = accountData.account;
      }
      if (recording.value.public) {
        data.recordings.push(recording);
      }
      // loggingUtil.log('/recording.json accountData', recordingUser, accountData);
    }
    // loggingUtil.log('/recording.json recordings', data.recordings.length);

    res.send( data);
  });


  app.use((req, res, next) => {
    res.status(404);
    res.type('text/plain;charset=UTF-8').send('');
  });

  const server = http.createServer(app);

  instance = server.listen(config.web.port, (err) => {
    if (err) {
      loggingUtil.error(dateUtil.getDate(), 'banano-cam ERROR', err);
    }
    loggingUtil.log(dateUtil.getDate(), 'banano-cam listening on PORT', config.web.port);
  });


  const io = require('socket.io')(server);
  io.on('connection', (socket) => {
    socket.on('npmStop', () => {
      socket.emit('npmStopAck');
      socket.disconnect(true);
      closeProgramFn();
    });
  });
};

// const isObject = function(obj) {
//   return (!!obj) && (obj.constructor === Object);
// };

const setLoginMessageCookie = (res, message) => {
  res.cookie('loginMessage', message, {signed: true});
};

const getLoginMessageCookie = (req) => {
  if (req.signedCookies.loginMessage === undefined) {
    return '';
  } else {
    return req.signedCookies.loginMessage;
  }
};

const setLanguageCookie = (res, language) => {
  res.cookie('language', language, {signed: true});
};

const getLanguageCookie = (req) => {
  let language;
  if (req.signedCookies.language === undefined) {
    language = 'en';
  } else {
    language = req.signedCookies.language;
  }
  return language;
};

const setSessionKeyCookie = (res, sessionKey) => {
  res.cookie('sessionKey', sessionKey, {signed: true});
};

const getSessionKeyCookie = (req) => {
  let sessionKey;
  if (req.signedCookies.sessionKey === undefined) {
    sessionKey = '';
  } else {
    sessionKey = req.signedCookies.sessionKey;
  }
  if (sessionKey.length != 66) {
    sessionKey = '';
  }
  return sessionKey;
};

const setCloseProgramFunction = (fn) => {
  closeProgramFn = fn;
};

// exports
exports.init = init;
exports.deactivate = deactivate;
exports.setCloseProgramFunction = setCloseProgramFunction;
