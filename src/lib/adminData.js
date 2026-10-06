// src/lib/adminData.js
// Loads EVERY row of a table for the admin. Supabase returns at most 1,000 rows per request,
// so a plain select() silently drops older orders once the shop grows — that would make
// sales totals and customer histories wrong. This pages through until the table is done.

import { supabase } from "./supabase";

const PAGE = 1000;
const HARD_CAP = 20000;   // safety stop

export async function fetchAll(table, columns = "*", orderBy = "created_at") {
  const rows = [];
  for (let from = 0; from < HARD_CAP; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order(orderBy, { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) return { data: rows, error, truncated: false };
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return { data: rows, error: null, truncated: false };
  }
  return { data: rows, error: null, truncated: true };
}
