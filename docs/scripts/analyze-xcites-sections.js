const XLSX = require('xlsx');
const path = "d:/Downloads/Copy of XCITES OFFICERS' DIRECTORY 2526.xlsx";
const wb = XLSX.readFile(path);
const rows = XLSX.utils.sheet_to_json(wb.Sheets.Sheet1, { header: 1, defval: '' });
const headerIdx = 2;
const width = 15;

function cell(r, i) {
  return String(r[i] ?? '').trim();
}

console.log('Row scan: idx | name | dept | notes');
for (let i = headerIdx + 1; i < rows.length; i++) {
  const r = rows[i];
  if (!r || !r.some((c) => String(c).trim())) continue;
  const c0 = cell(r, 0);
  const c1 = cell(r, 1);
  const c12 = cell(r, 12);
  let note = '';
  if (!c0 && c1 && c1 === c1.toUpperCase() && c1.replace(/[^A-Z]/g, '').length >= 6) {
    note = '<<BANNER';
  }
  if (c1 && /name/i.test(c1)) note += ' HEADER?';

  if (i < 120 || note || c12 || (c1 && c1.length > 3 && !note.includes('BANNER'))) {
    if (i < 130 || note === '<<BANNER' || (c12 && ['DEM', 'MRPD', 'DSSAA', 'DSEEA', 'DRSMD', 'Executive'].includes(c12))) {
      console.log(i, c0, '|', c1.slice(0, 35), '|', c12 || '·', note);
    }
  }
}

console.log('\n--- Rows 120-250 sample ---');
for (let i = 120; i < 250; i++) {
  const r = rows[i];
  if (!r || !r.some((c) => String(c).trim())) continue;
  const c0 = cell(r, 0);
  const c1 = cell(r, 1);
  const c12 = cell(r, 12);
  if (!c0 && c1 && c1 === c1.toUpperCase()) {
    console.log(i, 'BANNER', c1.slice(0, 70));
  }
  if (c12 || (c0 && /^\d+$/.test(c0) && c1 && c1.length > 5)) {
    console.log(i, c0, c1.slice(0, 30), c12 || '·');
  }
}
