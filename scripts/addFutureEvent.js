// scripts/addFutureEvent.js
// mock.json に「テスト競技」を常に最新1件だけ残す

import fs from "fs";
import path from "path";

const file = path.resolve("public/mock.json");
const raw = fs.readFileSync(file, "utf-8");
const data = JSON.parse(raw);

// 현재 시각 +5분 (HHmm 포맷)
const now = new Date();
now.setMinutes(now.getMinutes() + 5);
const hh = String(now.getHours()).padStart(2, "0");
const mm = String(now.getMinutes()).padStart(2, "0");
const hhmm = hh + mm;

// 새로운 이벤트 객체
const newEvent = {
  f_event_id: String(Date.now()), // 유니크 ID
  f_event_name: "テスト競技",
  f_start_time: hhmm,
  f_duration: "10",
  f_place: "グラウンドB",
  f_gather_time: null,
  f_summary: "テスト用 自動追加イベント",
};

// t_events 배열이 없으면 생성
if (!Array.isArray(data.t_events)) data.t_events = [];

// 기존 "テスト競技" 이벤트는 전부 제거
data.t_events = data.t_events.filter((ev) => ev.f_event_name !== "テスト競技");

// 새 이벤트 추가
data.t_events.push(newEvent);

// 저장
fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");

console.log(
  `mock.json にテストイベントを更新しました: ${newEvent.f_event_name} (${newEvent.f_start_time})`
);
