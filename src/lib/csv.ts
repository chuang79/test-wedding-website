export function toCsv(rows: Record<string, string | number | boolean | null | undefined>[]) {
  if (rows.length === 0) {
    return '';
  }

  const columns = Object.keys(rows[0]);

  const escape = (value: string | number | boolean | null | undefined) => {
    const normalized = value === null || value === undefined ? '' : String(value);
    return `"${normalized.replace(/"/g, '""')}"`;
  };

  const header = columns.map(escape).join(',');
  const lines = rows.map((row) => columns.map((column) => escape(row[column])).join(','));

  return [header, ...lines].join('\n');
}
