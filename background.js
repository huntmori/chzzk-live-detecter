// background.js - Service Worker

let checkInterval = null;
let state = {
  channelId: null,
  liveId: null,
  lastChecked: null,
  refreshCountdown: null,
  isMonitoring: false,
  error: null,
  checkIntervalSec: 10,   // 갱신 주기 (초)
  refreshDelaySec: 5      // 새로고침까지 대기 시간 (초)
};

// 알람 이름
const ALARM_NAME = 'chzzk-live-check';
const REFRESH_ALARM_NAME = 'chzzk-refresh';

// 저장된 상태 불러오기
async function loadState() {
  const saved = await chrome.storage.local.get(['chzzkState']);
  if (saved.chzzkState) {
    state = { ...state, ...saved.chzzkState };
  }
}

// 상태 저장
async function saveState() {
  await chrome.storage.local.set({ chzzkState: state });
}

// liveId 가져오기
async function getLiveId(channelId) {
  const response = await fetch(
    `https://api.chzzk.naver.com/service/v2/channels/${channelId}/live-detail`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include"
    }
  );

  const data = await response.json();
  const liveId = data.content?.liveId || data.liveId;

  if (!liveId) {
    throw new Error('라이브 중이 아니거나 liveId를 찾을 수 없습니다.');
  }

  return String(liveId);
}

// 치지직 탭 찾기
async function findChzzkTab(channelId) {
  const tabs = await chrome.tabs.query({ url: `https://chzzk.naver.com/live/${channelId}*` });
  return tabs[0] || null;
}

// 탭 새로고침
async function refreshTab(channelId) {
  const tab = await findChzzkTab(channelId);
  if (tab) {
    await chrome.tabs.reload(tab.id);
    console.log('[치지직] 탭 새로고침 완료:', tab.id);
  }
}

// 라이브 체크 메인 로직
async function checkLive() {
  if (!state.channelId) return;

  try {
    const newLiveId = await getLiveId(state.channelId);
    const now = new Date();
    const prevLiveId = state.liveId;

    state.lastChecked = now.toISOString();
    state.error = null;

    if (prevLiveId && prevLiveId !== newLiveId) {
      // liveId 변경 감지! → refreshDelaySec 후 새로고침
      console.log(`[치지직] liveId 변경 감지: ${prevLiveId} → ${newLiveId}`);
      state.liveId = newLiveId;
      state.refreshCountdown = state.refreshDelaySec;

      await saveState();
      notifyPopup();

      // 1초마다 카운트다운 업데이트
      let countdown = state.refreshDelaySec;
      const countdownTimer = setInterval(async () => {
        countdown--;
        state.refreshCountdown = countdown;
        await saveState();
        notifyPopup();

        if (countdown <= 0) {
          clearInterval(countdownTimer);
          state.refreshCountdown = null;
          await refreshTab(state.channelId);
          await saveState();
          notifyPopup();
        }
      }, 1000);

    } else {
      state.liveId = newLiveId;
      state.refreshCountdown = null;
      await saveState();
      notifyPopup();
    }

  } catch (error) {
    console.error('[치지직] 체크 실패:', error);
    state.error = error.message;
    state.lastChecked = new Date().toISOString();
    await saveState();
    notifyPopup();
  }
}

// 팝업에 상태 알리기 (runtime message)
function notifyPopup() {
  chrome.runtime.sendMessage({ type: 'STATE_UPDATE', state }).catch(() => {
    // 팝업이 닫혀있으면 무시
  });
}

// 모니터링 시작
async function startMonitoring(channelId, checkIntervalSec, refreshDelaySec) {
  state.channelId = channelId;
  state.isMonitoring = true;
  state.liveId = null;
  state.refreshCountdown = null;
  state.error = null;
  state.checkIntervalSec = checkIntervalSec || state.checkIntervalSec;
  state.refreshDelaySec = refreshDelaySec || state.refreshDelaySec;
  await saveState();

  // 즉시 1회 체크
  await checkLive();

  // 가변 주기 알람 등록
  chrome.alarms.clear(ALARM_NAME);
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: state.checkIntervalSec / 60 });
}

// 모니터링 중지
async function stopMonitoring() {
  state.isMonitoring = false;
  state.refreshCountdown = null;
  chrome.alarms.clear(ALARM_NAME);
  await saveState();
  notifyPopup();
}

// 알람 리스너
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await checkLive();
  }
});

// 메시지 리스너 (팝업 ↔ background)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATE') {
    sendResponse({ state });
  } else if (message.type === 'START_MONITORING') {
    startMonitoring(message.channelId, message.checkIntervalSec, message.refreshDelaySec).then(() => {
      sendResponse({ success: true });
    });
    return true;
  } else if (message.type === 'STOP_MONITORING') {
    stopMonitoring().then(() => {
      sendResponse({ success: true });
    });
    return true;
  } else if (message.type === 'GET_CHANNEL_ID') {
    // 현재 활성 탭에서 channelId 추출
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab && tab.url && tab.url.includes('chzzk.naver.com/live/')) {
        const channelId = tab.url.replace('https://chzzk.naver.com/live/', '').split('?')[0].split('/')[0];
        sendResponse({ channelId });
      } else {
        sendResponse({ channelId: null });
      }
    });
    return true;
  }
});

// 초기화
loadState();
