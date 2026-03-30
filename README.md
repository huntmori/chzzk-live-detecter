# 치지직 라이브 감지기

치지직 라이브 페이지의 `liveId` 변경을 감지해 자동으로 새로고침해 주는 크롬 확장 프로그램입니다.

방송이 재시작되거나 세션이 갱신되어 기존 페이지가 멈춘 것처럼 보일 때, 새 라이브 상태를 빠르게 반영할 수 있도록 도와줍니다.


<a href="https://www.donericano.com/creator/huntmori" target="_blank" style="display: inline-flex; align-items: center; gap: 12px; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); border: 2px solid transparent; max-width: 320px; transition: transform 0.3s ease, box-shadow 0.3s ease;">
  <div style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.5); background: rgba(255, 255, 255, 0.2); flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; color: white; font-weight: bold;">H</div>
  <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 2px; min-width: 0; flex: 1; overflow: hidden;">
    <div style="font-size: 15px; font-weight: 700; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">huntmori</div>
    <div style="font-size: 12px; opacity: 0.9; font-weight: 500;">응원하기</div>
  </div>
</a>

## 주요 기능

- 치지직 라이브 채널의 `liveId` 주기적 확인
- `liveId` 변경 감지 시 자동 새로고침
- 새로고침 전 카운트다운 표시
- 현재 탭 기준 채널 ID 자동 감지
- 체크 주기 / 새로고침 대기 시간 설정 가능
- 모니터링 상태, 마지막 확인 시각, 에러 메시지 표시

## 동작 방식

1. 사용자가 치지직 라이브 채널의 `channelId`를 입력하거나, 현재 열려 있는 라이브 페이지에서 자동 감지합니다.
2. 확장 프로그램이 일정 주기로 치지직 API를 조회합니다.
3. 현재 저장된 `liveId`와 새로 조회한 `liveId`를 비교합니다.
4. 값이 달라지면 일정 시간 카운트다운 후 해당 탭을 자동으로 새로고침합니다.

## 프로젝트 구성
```
text
chzzk-live-detector/
├─ background.js
├─ content.js
├─ manifest.json
├─ popup.html
├─ popup.js
├─ icons/
└─ README.md
```
## 설치 방법

### 1) 프로젝트 다운로드
저장소를 클론하거나 ZIP으로 다운로드합니다.
```
bash
git clone <REPOSITORY_URL>
```
### 2) 크롬 확장 프로그램으로 불러오기
1. 크롬에서 `chrome://extensions` 로 이동합니다.
2. 우측 상단의 **개발자 모드**를 활성화합니다.
3. **압축해제된 확장 프로그램을 로드합니다.**
4. 이 프로젝트 폴더를 선택합니다.

## 사용 방법

1. 치지직 라이브 페이지를 엽니다.  
   예: `https://chzzk.naver.com/live/...`

2. 확장 프로그램 팝업을 엽니다.

3. 아래 중 하나로 채널 ID를 준비합니다.
   - 현재 탭에서 자동 감지
   - 직접 채널 ID 입력

4. 설정값을 입력합니다.
   - **갱신 주기(초)**: 몇 초마다 `liveId`를 확인할지 설정
   - **새로고침 대기(초)**: 변경 감지 후 몇 초 뒤 새로고침할지 설정

5. **시작** 버튼을 누르면 모니터링이 시작됩니다.

6. `liveId`가 변경되면 카운트다운 후 페이지가 자동 새로고침됩니다.

## 권한 설명

이 확장 프로그램은 다음 권한을 사용합니다.

- `activeTab`  
  현재 활성 탭의 URL에서 채널 정보를 확인하기 위해 사용합니다.

- `alarms`  
  설정한 주기에 맞춰 백그라운드에서 체크 작업을 수행하기 위해 사용합니다.

- `storage`  
  모니터링 상태, 채널 ID, 설정값 등을 저장하기 위해 사용합니다.

- `host_permissions`
  - `https://chzzk.naver.com/*`
  - `https://api.chzzk.naver.com/*`

  치지직 페이지 접근 및 라이브 정보 조회를 위해 필요합니다.

## 개발 참고

이 프로젝트는 크롬 확장 프로그램 **Manifest V3** 기반으로 작성되었습니다.

### 주요 파일 설명

- `manifest.json`  
  확장 프로그램 설정 파일

- `background.js`  
  주기적 체크, 상태 저장, `liveId` 변경 감지, 자동 새로고침 처리

- `content.js`  
  치지직 라이브 페이지에서 채널 정보를 감지

- `popup.html`  
  팝업 UI

- `popup.js`  
  팝업 상태 표시 및 사용자 입력 처리

## 주의 사항

- 치지직 API 응답 형식이 변경되면 동작에 영향을 받을 수 있습니다.
- 로그인이 필요한 환경이나 세션 상태에 따라 API 응답이 달라질 수 있습니다.
- 브라우저 정책 또는 확장 프로그램 제한으로 인해 백그라운드 동작 타이밍이 약간 지연될 수 있습니다.
