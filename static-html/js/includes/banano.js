const url = 'https://jungle.coranos.cc/api';
// const url = 'https://kaliumapi.appditto.com/api';

const getBananoPartsFromRaw = (balance) => {
  return window.bananocoin.bananojs.bananoUtil.getBananoPartsFromRaw(balance);
};

const sendAmountToAccount = async (seed, seedIx, destAccount, amountBananos) => {
  const amountRaw = window.bananocoin.bananojs.bananoUtil.getRawStrFromBananoStr(amountBananos);
  const response = await window.bananocoinBananojs.sendAmountToAccountWithRepresentativeAndPrevious(seed, seedIx, destAccount, amountRaw);
  return response;
};

const getAccountInfo = async (account) => {
  window.bananocoinBananojs.setBananodeApiUrl(url);
  const accountInfo = await window.bananocoinBananojs.getAccountInfo(account, true);
  return accountInfo;
};

const getHistory = async (fromAccount, toAccount) => {
  const data = {
    action: 'account_history',
    account: fromAccount,
    count: 1,
    reverse: true,
    account_filter: [toAccount],
  };

  const response = await fetch(url, {
    method: 'POST',
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'omit', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json',
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *client
    body: JSON.stringify(data), // body data type must match "Content-Type" header
  });

  //    console.log( `account_history request ${JSON.stringify( formData )}` );
  return await response.json();
};
