// scripts/addFutureEvent.js
// 기존 mock.json 구조 유지하면서, "지금 +5분" 이벤트를 t_events에 추가

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

// 배열에 추가
if (!Array.isArray(data.t_events)) data.t_events = [];
data.t_events.push(newEvent);

// 저장
fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");

console.log(
  `✅ mock.json に新しいイベントを追加しました: ${newEvent.f_event_name} (${newEvent.f_start_time})`
);
