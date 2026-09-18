// The database API returns at most 1000 rows per request — silently, with no
// error. Anything that must see EVERY row (financial totals, backups) has to
// page through. Pass a function that builds the query (with a stable
// .order(), e.g. by id) and this fetches page after page until it's done.
export async function fetchAll(makeQuery, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await makeQuery().range(from, from + pageSize - 1);
    if (error) return { data: null, error };
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return { data: rows, error: null };
}
