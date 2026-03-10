// content.js - 치지직 페이지에 주입되는 스크립트

// 페이지 로드 시 channelId를 background에 전달
(function () {
  const channelId = location.href
    .replace("https://chzzk.naver.com/live/", "")
    .split("?")[0]
    .split("/")[0];

  if (channelId) {
    chrome.runtime.sendMessage({
      type: 'PAGE_LOADED',
      channelId: channelId
    });
  }
})();
