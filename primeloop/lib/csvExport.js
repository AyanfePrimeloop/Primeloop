// Converts an array of flat objects into a CSV file and triggers a download
// — opens straight in Excel, Google Sheets, or Numbers. No extra library
// needed for this; a hand-rolled CSV writer is plenty for admin exports.
export function downloadCSV(filename, rows) {
  if (!rows || rows.length === 0) {
    alert('Nothing to export.');
    return;
  }

  const headers = Object.keys(rows[0]);
  const escape = (value) => {
    const str = value === null || value === undefined ? '' : String(value);
    // Wrap in quotes and escape any existing quotes if the value contains
    // a comma, quote, or newline — standard CSV escaping.
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ];
  const csvContent = lines.join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
