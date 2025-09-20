// scripts/addFutureEvent.js
<<<<<<< HEAD
<<<<<<< HEAD
// mock.json に「テスト競技」を常に最新1件だけ残す
// ⚠️ 現在は使用されていません。テスト用に保存中です。
/**
 * ✅ 개발용 테스트 이벤트 삽입 스크립트
 * Cloudflare 또는 mock API에 정적 테스트 데이터를 추가할 때만 사용
 * 현재는 프론트엔드에서 동적으로 처리되므로 사용되지 않음
 */

/*
<<<<<<< HEAD
=======
// 기존 mock.json 구조 유지하면서, "지금 +5분" 이벤트를 t_events에 추가
=======
// mock.json に「テスト競技」を常に最新1件だけ残す
>>>>>>> 394121f ()

>>>>>>> 31f37d1 ([feat ]機能及びファイル追加)
=======
>>>>>>> 29cf1a4 ()
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

<<<<<<< HEAD
<<<<<<< HEAD
// t_events 배열이 없으면 생성
if (!Array.isArray(data.t_events)) data.t_events = [];

// 기존 "テスト競技" 이벤트는 전부 제거
data.t_events = data.t_events.filter((ev) => ev.f_event_name !== "テスト競技");

// 새 이벤트 추가
=======
// 배열에 추가
if (!Array.isArray(data.t_events)) data.t_events = [];
>>>>>>> 31f37d1 ([feat ]機能及びファイル追加)
=======
// t_events 배열이 없으면 생성
if (!Array.isArray(data.t_events)) data.t_events = [];

// 기존 "テスト競技" 이벤트는 전부 제거
data.t_events = data.t_events.filter((ev) => ev.f_event_name !== "テスト競技");

// 새 이벤트 추가
>>>>>>> 394121f ()
data.t_events.push(newEvent);

// 저장
fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");

console.log(
<<<<<<< HEAD
<<<<<<< HEAD
  `mock.json にテストイベントを更新しました: ${newEvent.f_event_name} (${newEvent.f_start_time})`
);
*/
=======
  `✅ mock.json に新しいイベントを追加しました: ${newEvent.f_event_name} (${newEvent.f_start_time})`
=======
  `mock.json にテストイベントを更新しました: ${newEvent.f_event_name} (${newEvent.f_start_time})`
>>>>>>> 394121f ()
);
<<<<<<< HEAD
>>>>>>> 31f37d1 ([feat ]機能及びファイル追加)
=======
*/
>>>>>>> 29cf1a4 ()
