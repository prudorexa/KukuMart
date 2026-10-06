// src/lib/csv.js
// Builds a CSV that opens correctly in Excel/Google Sheets and can't run formulas.

const FORMULA_START = /^[=+\-@\t\r]/;
const PLAIN_NUMBER  = /^\+?\d[\d\s]*$/;       // phone numbers like +254712345678 are fine

function cell(value) {
  let s = value == null ? "" : String(value);
  // A cell starting with = + - @ can run as a formula in Excel (CSV injection). Neutralise it,
  // except plain numbers/phones.
  if (FORMULA_START.test(s) && !PLAIN_NUMBER.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** columns: [{ header, value: (row) => any }] */
export function toCsv(columns, rows) {
  const head = columns.map((c) => cell(c.header)).join(",");
  const body = rows.map((r) => columns.map((c) => cell(c.value(r))).join(","));
  return `\uFEFF${[head, ...body].join("\r\n")}`;   // BOM so Excel reads UTF-8 names correctly
}

export function downloadCsv(filename, csvText) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
