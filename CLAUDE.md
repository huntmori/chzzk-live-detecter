# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chrome Extension (Manifest V3) that monitors a Chzzk (치지직) channel for live stream changes. When the `liveId` changes (new stream detected), it auto-refreshes the browser tab after a configurable delay. All code is vanilla JavaScript with no build step or dependencies.

## Development

No build system, package manager, or compilation step. Load the extension directly in Chrome via `chrome://extensions/` with Developer Mode enabled ("Load unpacked" pointing to this directory). Reload the extension manually after code changes.

## Architecture

Three-component Chrome Extension MV3 architecture communicating via `chrome.runtime.sendMessage()`:

- **background.js** — Service worker. Central state management, periodic Chzzk API polling via Chrome Alarms, liveId change detection, auto-refresh triggering, state persistence to `chrome.storage.local`. Message types: `GET_STATE`, `START_MONITORING`, `STOP_MONITORING`, `GET_CHANNEL_ID`, `STATE_UPDATE`.
- **content.js** — Content script injected on `chzzk.naver.com/live/*` pages. Extracts `channelId` from the URL and sends it to the background worker.
- **popup.html / popup.js** — Extension popup UI (dark theme, Korean). Reads state from background, renders monitoring status, and sends start/stop commands. `renderState()` handles all UI updates.

## Key API

Chzzk live detail endpoint: `https://api.chzzk.naver.com/service/v2/channels/{channelId}/live-detail` — fetched with credentials in `background.js:checkLive()`.

## Known Issues

`popup.js` contains duplicate function definitions (`formatDate`, `renderState`) — later definitions shadow earlier ones. This is technical debt that should be cleaned up.
