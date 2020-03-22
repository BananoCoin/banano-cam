const numberRegex = new RegExp('^\\d+$');

const getDate = () => {
  return new Date().toISOString();
};

const addText = (parent, childText) => {
  parent.appendChild(document.createTextNode(childText));
};

const addChildElement = (parent, childType, attributes) => {
  // console.log('addChildElement', parent, childType, attributes);
  const child = document.createElement(childType);

  parent.appendChild(child);

  if (attributes) {
    Object.keys(attributes).forEach((attibute) => {
      const value = attributes[attibute];
      child.setAttribute(attibute, value);
    });
  }

  return child;
};

const setLanguage = () => {
  const languageElt = document.getElementById('language');
  const language = languageElt.value;

  const xmlhttp = new XMLHttpRequest();
  const url = 'language';

  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      window.location.reload(true);
    }
  };

  xmlhttp.open('POST', url, true);
  xmlhttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  xmlhttp.send(`{"language":"${language}"}`);

  return false;
};

let countdownInteval;
const countdownElt = document.getElementById('countdown');
const refreshTimeElt = document.getElementById('refreshTime');
const refreshTime = parseInt(refreshTimeElt.innerText);

const resetCountdown = () => {
  clearInterval(countdownInteval);
  countdown();
};

const countdown = () => {
  const countdownFn = () => {
    if (c < 0) {
      c = 0;
    }
    if (countdownElt !== null) {
      if (c > 0) {
        c = c - 1;
      }
      countdownElt.innerHTML = c;
    }
    if (c == 0) {
      clearInterval(countdownInteval);
      if (typeof refresh == 'function') {
        refresh();
      }
      countdown();
    }
  };
  countdownInteval = setInterval(countdownFn, 1000);
  let c = refreshTime;
  if (countdownElt !== null) {
    countdownElt.innerHTML = c;
  }
};

let recaptchaToken = '';
let recaptchaFn = () => {};
let recaptchaReadyFn;

const initRecaptchaVariables = () => {
  recaptchaToken = '';
  recaptchaFn = () => {};
  recaptchaReadyFn = () => {};
};
initRecaptchaVariables();

const displayErrorMessage = (label, message) => {
  const errorMessageElt = document.getElementById('errorMessage');
  if ((message == undefined) || (message.length == 0)) {
    errorMessageElt.innerText = '';
  } else {
    errorMessageElt.innerText = label + ':' + message;
    if (typeof automaticOffOnError === 'function') {
      automaticOffOnError(message);
    }
  }
};


const enable = (id) => {
  const elt = document.getElementById(id);
  if (elt) {
    elt.classList.remove('gray_tab');
    elt.classList.add('yellow_tab');
    elt.disabled = false;
  }
};

const disable = (id) => {
  const elt = document.getElementById(id);
  if (elt) {
    elt.classList.remove('yellow_tab');
    elt.classList.add('gray_tab');
    elt.disabled = true;
  }
};

const hide = (id) => {
  const elt = document.getElementById(id);
  if (elt) {
    elt.style = 'display:none';
  }
};

const show = (id) => {
  const elt = document.getElementById(id);
  if (elt) {
    elt.style = 'display:block;';
  }
};

const copyToClipboard = (data) => {
  const body = document.getElementsByTagName('body')[0];
  const tempInput = document.createElement('input');
  body.appendChild(tempInput);
  tempInput.setAttribute('value', data);
  tempInput.select();
  document.execCommand('copy');
  body.removeChild(tempInput);
};
