const onLoad = () => {
  hide('countdownInfo');
  hideSessionKey();
  showNewSession();
};

const refresh = () => {
};

const showNewSession = () => {
  hide('returningSession');
  enable('returningSessionButton');
  show('newSession');
  disable('newSessionButton');
};

const showReturningSession = () => {
  show('returningSession');
  disable('returningSessionButton');
  hide('newSession');
  enable('newSessionButton');
};

const showSessionKey = () => {
  hide('session-key-show');
  show('session-key');
  show('session-key-hide');
};

const hideSessionKey = () => {
  show('session-key-show');
  hide('session-key');
  hide('session-key-hide');
};

const clearSeed = () => {
  const seedElt = document.getElementById('seed');
  if (seedElt) {
    seedElt.value = '';
  }
  localStorage.clear();
};

const setSeed = () => {
  localStorage.setItem('seed', document.getElementById('seed').value);
  const seed = localStorage.getItem('seed');
  if (seed.length == 64) {
    const privateKey = window.bananocoinBananojs.getPrivateKey(seed, 0);
    const publicKey = window.bananocoinBananojs.getPublicKey(privateKey);
    const account = window.bananocoinBananojs.getAccount(publicKey);
    document.getElementsByName('account').forEach((elt) => {
      elt.value = account;
    });
  }
};
