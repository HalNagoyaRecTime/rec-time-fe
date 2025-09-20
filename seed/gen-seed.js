// seed/gen-seed.js
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "migrations");

// 1行ずつ入れても安全に処理
const BATCH_STUDENT = 50;
const BATCH_EVENTS = 50;
const BATCH_ENTRIES = 1; // エントリーは数が多いので1行ずつ

function esc(val) {
  if (val === null || val === undefined) return "NULL";
  return `'${String(val).replace(/'/g, "''")}'`;
}

function buildInsertBatched(table, columns, rows, batchSize) {
  if (!rows.length) return `-- no rows for ${table}\n`;
  const cols = columns.join(", ");
  let sql = `-- ${table} seed\n\n`;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const values = batch
      .map((r) => `(${columns.map((c) => esc(r[c])).join(", ")})`)
      .join(",\n");
    sql += `INSERT INTO ${table} (${cols}) VALUES\n${values};\n\n`;
  }
  return sql;
}

function main() {
  const student = JSON.parse(
    fs.readFileSync(path.join(root, "seed", "m_student.json"), "utf-8")
  );
  const events = JSON.parse(
    fs.readFileSync(path.join(root, "seed", "t_events.json"), "utf-8")
  );
  const entries = JSON.parse(
    fs.readFileSync(path.join(root, "seed", "t_entries.json"), "utf-8")
  );

  // ファイルパス
  const fStudents = path.join(outDir, "0002_seed_students.sql");
  const fEvents = path.join(outDir, "0002_seed_events.sql");
  const fEntries = path.join(outDir, "0002_seed_entries.sql");

  // BEGIN/COMMITなし (D1が独自処理)
  const sqlStudents = [
    "-- GENERATED: 0002_seed_students.sql",
    buildInsertBatched(
      "m_student",
      [
        "f_student_id",
        "f_student_num",
        "f_class",
        "f_number",
        "f_name",
        "f_note",
      ],
      student,
      BATCH_STUDENT
    ),
  ].join("\n\n");

  const sqlEvents = [
    "-- GENERATED: 0002_seed_events.sql",
    buildInsertBatched(
      "t_events",
      [
        "f_event_id",
        "f_event_code",
        "f_event_name",
        "f_time",
        "f_duration",
        "f_place",
        "f_gather_time",
        "f_summary",
      ],
      events,
      BATCH_EVENTS
    ),
  ].join("\n\n");

  const sqlEntries = [
    "-- GENERATED: 0002_seed_entries.sql",
    buildInsertBatched(
      "t_entries",
      ["f_entry_id", "f_student_id", "f_event_id"],
      entries,
      BATCH_ENTRIES
    ),
  ].join("\n\n");

  fs.writeFileSync(fStudents, sqlStudents, "utf-8");
  fs.writeFileSync(fEvents, sqlEvents, "utf-8");
  fs.writeFileSync(fEntries, sqlEntries, "utf-8");
  console.log(`Wrote:\n- ${fStudents}\n- ${fEvents}\n- ${fEntries}`);
}

main();
