// seed/gen-seed.js
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outFile = path.join(root, "migrations", "0002_seed.sql");

function esc(val) {
  if (val === null || val === undefined) return "NULL";
  return `'${String(val).replace(/'/g, "''")}'`;
}

function buildInsert(table, columns, rows) {
  if (!rows.length) return `-- no rows for ${table}\n`;
  const cols = columns.join(", ");
  const values = rows.map(r => {
    const vals = columns.map(c => esc(r[c]));
    return `(${vals.join(", ")})`;
  }).join(",\n");
  return `INSERT INTO ${table} (${cols}) VALUES\n${values};\n`;
}

function main() {
  const student = JSON.parse(fs.readFileSync(path.join(root, "seed", "m_student.json"), "utf-8"));
  const events  = JSON.parse(fs.readFileSync(path.join(root, "seed", "t_events.json"), "utf-8"));
  const entries = JSON.parse(fs.readFileSync(path.join(root, "seed", "t_entries.json"), "utf-8"));

  // カラムの順序は、マイグレーションスキーマと同様
  const sql = [
    "-- GENERATED: 0002_seed.sql",
    "BEGIN TRANSACTION;",
    buildInsert("m_student",
      ["f_student_id","f_student_num","f_class","f_number","f_name","f_note"],
      student
    ),
    buildInsert("t_events",
      ["f_event_id","f_event_code","f_event_name","f_time","f_duration","f_place","f_gather_time","f_summary"],
      events
    ),
    buildInsert("t_entries",
      ["f_entry_id","f_student_id","f_event_id"],
      entries
    ),
    "COMMIT;"
  ].join("\n\n");

  fs.writeFileSync(outFile, sql, "utf-8");
  console.log(`Wrote ${outFile}`);
}

main();
