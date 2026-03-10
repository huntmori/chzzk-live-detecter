// popup.js

const channelInput = document.getElementById('channelInput');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const liveIdDisplay = document.getElementById('liveIdDisplay');
const lastCheckedDisplay = document.getElementById('lastCheckedDisplay');
const refreshNotice = document.getElementById('refreshNotice');
const countdownEl = document.getElementById('countdown');
const errorCard = document.getElementById('errorCard');
const autoDetectBanner = document.getElementById('autoDetectBanner');
const checkIntervalInput = document.getElementById('checkIntervalInput');
const refreshDelayInput = document.getElementById('refreshDelayInput');
const footerText = document.getElementById('footerText');

// 날짜 포맷 (월/일 시:분:초)
function formatDate(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${month}/${day}\n${hh}:${mm}:${ss}`;
}

// UI 업데이트
function renderState(state) {
  if (!state) return;

  // 채널 입력
  if (state.channelId && !channelInput.value) {
    channelInput.value = state.channelId;
  }

  // 설정값 반영 (모니터링 중일 때는 실제 적용된 값 표시)
  if (state.isMonitoring) {
    checkIntervalInput.value = state.checkIntervalSec;
    refreshDelayInput.value = state.refreshDelaySec;
    checkIntervalInput.disabled = true;
    refreshDelayInput.disabled = true;
    footerText.textContent = `${state.checkIntervalSec}초 주기로 자동 체크 • chzzk.naver.com`;
  } else {
    checkIntervalInput.disabled = false;
    refreshDelayInput.disabled = false;
    footerText.textContent = `${checkIntervalInput.value || 10}초 주기로 자동 체크 • chzzk.naver.com`;
  }

  // 모니터링 상태
  if (state.isMonitoring) {
    statusDot.className = 'status-dot active';
    statusText.className = 'status-text active';
    statusText.textContent = `모니터링 중 (${state.channelId || ''})`;
    startBtn.style.display = 'none';
    stopBtn.style.display = '';
    channelInput.disabled = true;
  } else {
    statusDot.className = 'status-dot';
    statusText.className = 'status-text';
    statusText.textContent = '대기 중';
    startBtn.style.display = '';
    stopBtn.style.display = 'none';
    channelInput.disabled = false;
  }

  // Live ID
  if (state.liveId) {
    liveIdDisplay.textContent = state.liveId;
    liveIdDisplay.className = 'card-value mono';
  } else {
    liveIdDisplay.textContent = '-';
    liveIdDisplay.className = 'card-value mono muted';
  }

  // 마지막 갱신
  if (state.lastChecked) {
    lastCheckedDisplay.style.whiteSpace = 'pre';
    lastCheckedDisplay.textContent = formatDate(state.lastChecked);
  } else {
    lastCheckedDisplay.textContent = '-';
  }

  // 새로고침 카운트다운
  if (state.refreshCountdown !== null && state.refreshCountdown > 0) {
    refreshNotice.classList.add('visible');
    countdownEl.innerHTML = `${state.refreshCountdown}<span>초 후 새로고침 됩니다.</span>`;
  } else {
    refreshNotice.classList.remove('visible');
  }

  // 에러
  if (state.error) {
    statusDot.className = 'status-dot error';
    errorCard.classList.add('visible');
    errorCard.textContent = `⚠️ ${state.error}`;
  } else {
    errorCard.classList.remove('visible');
    errorCard.textContent = '';
  }
}

// 현재 탭에서 channelId 자동 감지
function autoDetectChannel() {
  chrome.runtime.sendMessage({ type: 'GET_CHANNEL_ID' }, (res) => {
    if (res && res.channelId) {
      channelInput.value = res.channelId;
      autoDetectBanner.classList.add('visible');
    }
  });
}

// 초기 상태 로드
chrome.runtime.sendMessage({ type: 'GET_STATE' }, (res) => {
  if (res && res.state) {
    // 저장된 설정값이 있으면 input에 반영
    if (res.state.checkIntervalSec) checkIntervalInput.value = res.state.checkIntervalSec;
    if (res.state.refreshDelaySec) refreshDelayInput.value = res.state.refreshDelaySec;
    renderState(res.state);
    if (!res.state.isMonitoring) {
      autoDetectChannel();
    }
  } else {
    autoDetectChannel();
  }
});

// background에서 실시간 상태 업데이트 수신
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'STATE_UPDATE') {
    renderState(message.state);
  }
});

// 설정 input 변경 시 footer 실시간 반영
checkIntervalInput.addEventListener('input', () => {
  footerText.textContent = `${checkIntervalInput.value || 10}초 주기로 자동 체크 • chzzk.naver.com`;
});

// 시작 버튼
startBtn.addEventListener('click', () => {
  const channelId = channelInput.value.trim();
  if (!channelId) {
    alert('채널 ID를 입력하세요.');
    return;
  }

  const checkIntervalSec = Math.max(5, parseInt(checkIntervalInput.value, 10) || 10);
  const refreshDelaySec = Math.max(1, parseInt(refreshDelayInput.value, 10) || 5);

  chrome.runtime.sendMessage({
    type: 'START_MONITORING',
    channelId,
    checkIntervalSec,
    refreshDelaySec
  }, (res) => {
    if (res && res.success) {
      console.log('모니터링 시작');
    }
  });
});

// 중지 버튼
stopBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'STOP_MONITORING' }, () => {
    channelInput.disabled = false;
  });
});


// 날짜 포맷 (월/일 시:분:초)
function formatDate(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${month}/${day}\n${hh}:${mm}:${ss}`;
}

// UI 업데이트
function renderState(state) {
  if (!state) return;

  // 채널 입력
  if (state.channelId && !channelInput.value) {
    channelInput.value = state.channelId;
  }

  // 모니터링 상태
  if (state.isMonitoring) {
    statusDot.className = 'status-dot active';
    statusText.className = 'status-text active';
    statusText.textContent = `모니터링 중 (${state.channelId || ''})`;
    startBtn.style.display = 'none';
    stopBtn.style.display = '';
    channelInput.disabled = true;
  } else {
    statusDot.className = 'status-dot';
    statusText.className = 'status-text';
    statusText.textContent = '대기 중';
    startBtn.style.display = '';
    stopBtn.style.display = 'none';
    channelInput.disabled = false;
  }

  // Live ID
  if (state.liveId) {
    liveIdDisplay.textContent = state.liveId;
    liveIdDisplay.className = 'card-value mono';
  } else {
    liveIdDisplay.textContent = '-';
    liveIdDisplay.className = 'card-value mono muted';
  }

  // 마지막 갱신
  if (state.lastChecked) {
    lastCheckedDisplay.style.whiteSpace = 'pre';
    lastCheckedDisplay.textContent = formatDate(state.lastChecked);
  } else {
    lastCheckedDisplay.textContent = '-';
  }

  // 새로고침 카운트다운
  if (state.refreshCountdown !== null && state.refreshCountdown > 0) {
    refreshNotice.classList.add('visible');
    countdownEl.innerHTML = `${state.refreshCountdown}<span>초 후 새로고침 됩니다.</span>`;
  } else {
    refreshNotice.classList.remove('visible');
  }

  // 에러
  if (state.error) {
    statusDot.className = 'status-dot error';
    errorCard.classList.add('visible');
    errorCard.textContent = `⚠️ ${state.error}`;
  } else {
    errorCard.classList.remove('visible');
    errorCard.textContent = '';
  }
}

// 현재 탭에서 channelId 자동 감지
function autoDetectChannel() {
  chrome.runtime.sendMessage({ type: 'GET_CHANNEL_ID' }, (res) => {
    if (res && res.channelId) {
      channelInput.value = res.channelId;
      autoDetectBanner.classList.add('visible');
    }
  });
}

// 초기 상태 로드
chrome.runtime.sendMessage({ type: 'GET_STATE' }, (res) => {
  if (res && res.state) {
    renderState(res.state);
    // 이미 모니터링 중이 아닐 때만 자동감지
    if (!res.state.isMonitoring) {
      autoDetectChannel();
    }
  } else {
    autoDetectChannel();
  }
});

// background에서 실시간 상태 업데이트 수신
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'STATE_UPDATE') {
    renderState(message.state);
  }
});

// 시작 버튼
startBtn.addEventListener('click', () => {
  const channelId = channelInput.value.trim();
  if (!channelId) {
    alert('채널 ID를 입력하세요.');
    return;
  }
  chrome.runtime.sendMessage({ type: 'START_MONITORING', channelId }, (res) => {
    if (res && res.success) {
      console.log('모니터링 시작');
    }
  });
});

// 중지 버튼
stopBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'STOP_MONITORING' }, () => {
    channelInput.disabled = false;
  });
});
