// The width and height of the captured photo. We will set the
// width to the value defined here, but the height will be
// calculated based on the aspect ratio of the input stream.

const width = 320; // We will scale the photo width to this
let height = 0; // This will be computed based on the input stream

// |streaming| indicates whether or not we're currently streaming
// video from the camera. Obviously, we start at false.

let streaming = false;

// The various HTML elements we need to configure or control. These
// will be set by the startup() function.

let video = null;
let canvas = null;
let photo = null;
let startVideo = null;
let stopVideo = null;
let startRecording = null;
let stopRecording = null;
let publicVideo = null;
let privateVideo = null;
let otherVideos = null;
let otherVideosHeader = null;
let visibilityMessage = null;
let recordingInterval;
let stopRecordingFlag = true;

const startup = () => {
  video = document.getElementById('video');
  canvas = document.getElementById('canvas');
  photo = document.getElementById('photo');
  startVideo = document.getElementById('startVideo');
  stopVideo = document.getElementById('stopVideo');
  startRecording = document.getElementById('startRecording');
  stopRecording = document.getElementById('stopRecording');
  otherVideos = document.getElementById('otherVideos');
  otherVideosHeader = document.getElementById('otherVideosHeader');
  visibilityMessage = document.getElementById('visibilityMessage');
  publicVideo = document.getElementById('publicVideo');
  privateVideo = document.getElementById('privateVideo');

  video.addEventListener('canplay', (ev) => {
    if (!streaming) {
      height = video.videoHeight / (video.videoWidth/width);

      // Firefox currently has a bug where the height can't be read from
      // the video, so we will make assumptions if this happens.

      if (isNaN(height)) {
        height = width / (4/3);
      }

      video.setAttribute('width', width);
      video.setAttribute('height', height);
      canvas.setAttribute('width', width);
      canvas.setAttribute('height', height);
      streaming = true;
    }
  }, false);

  startVideo.addEventListener('click', async (ev) => {
    if (navigator.mediaDevices) {
      displayErrorMessage('video', 'starting...');
      try {
        video.srcObject = await navigator.mediaDevices.getUserMedia({video: true, audio: false});
        await video.play();
        displayErrorMessage('video');
      } catch (error) {
        displayErrorMessage('video', 'error:' + error.message);
      }
    }
    ev.preventDefault();
  }, false);

  stopVideo.addEventListener('click', (ev) => {
    clearInterval(recordingInterval);
    if (video.srcObject) {
      video.srcObject.getTracks().forEach((track) => {
        track.stop();
      });
    }
    video.srcObject = null;
    ev.preventDefault();
  }, false);

  startRecording.addEventListener('click', (ev) => {
    stopRecordingFlag = false;
    clearInterval(recordingInterval);
    getRecording();
    ev.preventDefault();
  }, false);

  stopRecording.addEventListener('click', (ev) => {
    stopRecordingFlag = true;
    clearInterval(recordingInterval);
    ev.preventDefault();
  }, false);

  publicVideo.addEventListener('click', (ev) => {
    getRecording(undefined, true);
    ev.preventDefault();
  }, false);

  privateVideo.addEventListener('click', (ev) => {
    getRecording(undefined, false);
    ev.preventDefault();
  }, false);

  clearphoto();
  getRecording();
};

// Fill the photo with an indication that none has been
// captured.

const clearphoto = () => {
  const context = canvas.getContext('2d');
  context.fillStyle = '#AAA';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const data = canvas.toDataURL('image/png');
  photo.setAttribute('src', data);
};

// Capture a photo by fetching the current contents of the video
// and drawing it into a canvas, then converting that to a PNG
// format data URL. By drawing it on an offscreen canvas and then
// drawing that to the screen, we can change its size and/or apply
// other changes before drawing it.

const takepicture = () => {
  const context = canvas.getContext('2d');
  if (width && height) {
    canvas.width = width;
    canvas.height = height;
    context.drawImage(video, 0, 0, width, height);

    const data = canvas.toDataURL('image/png');
    // photo.setAttribute('src', data);
    getRecording(data);
  } else {
    clearphoto();
  }
};

const onLoad = () => {
  startup();
  showAccountBalance();
};


const getRecording = (recording, public) => {
  // console.log('STARTED getRecording', (recording?recording.length:''));
  const xmlhttp = new XMLHttpRequest();
  const actionAndParms = {};
  if (recording !== undefined) {
    actionAndParms.action = 'submit_recording';
    actionAndParms.recording = recording;
  } else if (public !== undefined) {
    actionAndParms.action = 'change_visibility';
    actionAndParms.public = public;
  }
  const url = `recording.json`;

  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      // console.log('SUCCESS getRecording', this.responseText.length);
      const recordingData = JSON.parse(this.responseText);
      // console.log('SUCCESS getRecording equal', recordingData.recording == recording);
      // console.log('SUCCESS getRecording input', recording);
      // console.log('SUCCESS getRecording output', recordingData.recording.recording);
      if (recordingData) {
        const seed = localStorage.getItem('seed');
        if (recordingData.recording) {
          if (recordingData.recording.public) {
            visibilityMessage.innerText = 'Your video is public';
          } else {
            visibilityMessage.innerText = 'Your video is private';
          }
          photo.setAttribute('src', recordingData.recording.recording);
        }
        if (recordingData.recordings) {
          let html = '';
          html += '<table class="h_centered centered align_top">';
          recordingData.recordings.forEach((recording) => {
            // console.log('recording', recording);
            html += '<tr>';
            html += '<td>';
            html += `<img class="output" src="${recording.value.recording}">`;
            html += '</td>';
            html += '<td>';
            if (recording.account) {
              const toAccount = recording.account;
              const id = recording.key[0];
              html += '<div class="highlighted h_centered centered padding_20px">';
              html += 'Tip Account:';
              html += '<p>';
              html += toAccount;
              html += '</p>';
              if (seed && seed.length == 64) {
                html += 'Tip Amount:';
                html += '<br>';
                html += `<input class="yellow_text_input" type="text" id="${id}Amount" size="32" value=""></input>`;
                html += '<br>';
                html += 'Tip Result:';
                html += '<br>';
                html += `<p id="${id}Result">`;
                html += 'No Tip Sent Yet';
                html += '</p>';
                html += '<br>';
                html += `<button class="yellow_input" type="button" onclick="sendBanano('${id}','${toAccount}');">Send</button>`;
              }
              html += '</div>';
            }
            html += '</td>';
            html += '</tr>';
          });
          html += '</table">';
          otherVideosHeader.innerText = `${recordingData.recordings.length} Videos (Public Only)`;
          otherVideos.innerHTML = html;
        }
      }
      if (!stopRecordingFlag) {
        recordingInterval = setTimeout(takepicture, 0);
      }
    }
  };
  xmlhttp.open('POST', url, true);
  xmlhttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  xmlhttp.send(JSON.stringify(actionAndParms));
};

const showAccountBalance = () => {
  const seed = localStorage.getItem('seed');
  const fromElt = document.getElementById('account');
  // console.log('INTERIM showAccountBalance', getDate(), 'fromElt', fromElt);
  if (fromElt) {
    const fromAccount = fromElt.innerText;
    // console.log('INTERIM showAccountBalance', getDate(), 'fromAccount', fromAccount);
    let balanceParts;
    if (seed.length == 64) {
      let wrapperHtml = '';
      wrapperHtml += '<td class="bordered">';
      wrapperHtml += '<p>';
      wrapperHtml += 'Account Balance';
      wrapperHtml += '</p>';
      wrapperHtml += '<p id="accountBalance">';
      wrapperHtml += '</p>';
      wrapperHtml += ' ';
      wrapperHtml += `<button  class="yellow_input" onclick="return checkPending()">Refresh</button>`;
      wrapperHtml += '<br>';
      wrapperHtml += '<div id="checkPendingMessage"><div>';
      wrapperHtml += '</td>';
      const accountBalanceWrapperElt = document.getElementById('accountBalanceWrapper');
      accountBalanceWrapperElt.innerHTML = wrapperHtml;

      updateAccountBalance();

      setTimeout(checkPending, 0);
    }
  }
};

const updateAccountBalance = async () => {
  const fromElt = document.getElementById('account');
  if (fromElt) {
    const fromAccount = fromElt.innerText;
    const accountBalanceElt = document.getElementById('accountBalance');
    // console.log('getAccountInfo', fromAccount);
    const accountInfo = await getAccountInfo(fromAccount);
    // console.log('getAccountInfo', accountInfo);
    if (accountInfo.balance !== undefined) {
      balanceParts = await getBananoPartsFromRaw(accountInfo.balance);
    } else {
      balanceParts = {};
      balanceParts.banano = 0;
    }
    // console.log('balanceParts', balanceParts);
    accountBalanceElt.innerText = balanceParts.banano;
  }
};

const checkPending = async () => {
  document.querySelector(`#checkPendingMessage`).innerText = 'checking for pending.';
  const seed = localStorage.getItem('seed');
  if (seed.length == 64) {
    const privateKey = window.bananocoinBananojs.getPrivateKey(seed, 0);
    const publicKey = window.bananocoinBananojs.getPublicKey(privateKey);
    const account = window.bananocoinBananojs.getAccount(publicKey);
    const checkPendingMessageElt = document.querySelector(`#checkPendingMessage`);
    const response = await window.bananocoinBananojs.receiveDepositsForSeed(seed, 0, account);
    let text = '';
    text += response.pendingMessage;
    text += response.receiveMessage;
    checkPendingMessageElt.innerText = text;

    setTimeout(updateAccountBalance, 0);
  }
  return false;
};

const sendBanano = async (id, toAccount) => {
  const resultElt = document.getElementById(`${id}Result`);
  if (!resultElt) {
    throw Error(`result elt not found for ID '${id}'`);
  }
  const amountElt = document.getElementById(`${id}Amount`);
  if (!amountElt) {
    throw Error(`amount elt not found for ID '${id}'`);
  }
  try {
    const amount = amountElt.value;
    const seed = localStorage.getItem('seed');
    if (seed.length == 64) {
      const hash = await sendAmountToAccount(seed, 0, toAccount, amount);
      resultElt.innerHTML = `sent ${amount} banano to ${toAccount} ${hash}`;
    }
  } catch (error) {
    resultElt.innerHTML = `error: ${error.message}`;
    alert(error);
  }
};
