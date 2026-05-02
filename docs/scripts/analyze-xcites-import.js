/**
 * One-off analysis: compare raw sheet vs expected person rows.
 * Run: node docs/scripts/analyze-xcites-import.js
 */
const XLSX = require('xlsx');
const fs = require('fs');

const path = process.argv[2] || "d:/Downloads/Copy of XCITES OFFICERS' DIRECTORY 2526.xlsx";
if (!fs.existsSync(path)) {
  console.error('File not found:', path);
  process.exit(1);
}

const wb = XLSX.readFile(path);
console.log('Sheets:', wb.SheetNames);

for (const sheetName of wb.SheetNames) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' });
  console.log('\n===', sheetName, 'total lines', rows.length, '===');

  let headerIdx = -1;
  for (let h = 0; h < Math.min(35, rows.length); h++) {
    const r = rows[h];
    if (!r) continue;
    const joined = r.map((c) => String(c).toLowerCase()).join('|');
    if (joined.includes('name') && joined.includes('department')) {
      headerIdx = h;
      console.log('Header row index', h, r.slice(0, 14));
      break;
    }
  }

  if (headerIdx < 0) {
    console.log('No header found');
    continue;
  }

  const headers = rows[headerIdx].map((x) => String(x).trim());
  const nameCol = headers.findIndex((h) => /^name$/i.test(String(h).trim()));
  const deptCol = headers.findIndex((h) => /^department$/i.test(String(h).trim()));

  let dataRows = 0;
  let withName = 0;
  let withIndexCol = 0;
  const deptCounts = {};

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r.some((c) => String(c).trim())) continue;
    dataRows++;
    const name = nameCol >= 0 ? String(r[nameCol] ?? '').trim() : '';
    const dept = deptCol >= 0 ? String(r[deptCol] ?? '').trim() : '';
    const idx = String(r[0] ?? '').trim();
    if (idx && /^\d+$/.test(idx)) withIndexCol++;
    if (name && !/^name$/i.test(name)) {
      const letters = name.replace(/[^a-zA-Z]/g, '');
      const allCaps = letters && letters === letters.toUpperCase() && name.length >= 8;
      if (!allCaps) {
        withName++;
        const k = dept || '(empty)';
        deptCounts[k] = (deptCounts[k] || 0) + 1;
      }
    }
  }

  console.log('Data rows (non-empty):', dataRows);
  console.log('Rows with plausible person name (not ALLCAPS section):', withName);
  console.log('Rows with numeric col A:', withIndexCol);
  console.log('Dept col tallies (raw):', deptCounts);
}
