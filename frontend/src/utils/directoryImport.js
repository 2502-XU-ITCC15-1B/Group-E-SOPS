import * as XLSX from 'xlsx';
import {
  collection,
  doc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';

const FIELD_SYNONYMS = {
  fullName: [
    'name',
    'full name',
    'fullname',
    'officer',
    'officers',
    'member name',
    'student name',
    'directory name',
    'complete name',
    'completename',
    'nominee',
    'representative',
  ],
  firstName: ['first name', 'firstname', 'given name', 'fname'],
  lastName: ['last name', 'lastname', 'surname', 'family name', 'lname'],
  department: [
    'department',
    'dept',
    'committee',
    'division',
    'unit',
    'section',
    'bureau',
    'program',
    'organization',
    'organisation',
    'org',
    'team',
    'cluster',
    'strand',
    'college',
    'school',
    'board',
    'commission',
    'chapter',
    'council',
    'area',
    'group',
    'wing',
    'sector',
    'portfolio',
  ],
  email: [
    'email',
    'e-mail',
    'e mail',
    'mail',
    'e-mail address',
    'xu email',
    'xavier email',
    'school email',
    'institutional email',
  ],
  position: [
    'position',
    'role',
    'title',
    'designation',
    'office',
    'rank',
    'designation title',
    'post',
  ],
  phone: [
    'phone',
    'mobile',
    'mobile number',
    'contact',
    'tel',
    'telephone',
    'cell',
    'cp no',
    'contact no',
    'cellphone',
  ],
  nickname: ['nickname', 'nick', 'alias', 'called'],
  birthdate: ['birthdate', 'birth date', 'birthday', 'dob', 'date of birth', 'bday'],
  sex: ['sex', 'gender'],
  preferredPronouns: ['preferred pronouns', 'pronouns', 'pronoun'],
  photo: ['photo', 'picture', 'image', 'avatar', 'pic'],
  signatures: ['signature', 'signatures'],
  schedules: ['schedule', 'schedules', 'timetable', 'availability'],
};

/**
 * XCITES directory: map spreadsheet abbreviations / variants to official department names.
 * First string in each group is the stored label; rest are lowercase aliases (exact or substring).
 */
const DEPARTMENT_ALIAS_GROUPS = [
  [
    'executives',
    'executive',
    'exec',
  ],
  [
    'MEDIA RELATIONS AND PROMOTIONS DEPARTMENT (MRPD)',
    'mrpd',
    'media relations and promotions department',
    'media relations and promotions',
  ],
  [
    'DEPARTMENT OF EVENTS AND MANAGEMENT',
    'dem',
    'department of events and management',
    'events and management',
  ],
  [
    'DEPARTMENT OF STUDENT SERVICES AND ACADEMIC AFFAIRS',
    'dssaa',
    'department of student services and academic affairs',
    'student services and academic affairs',
  ],
  [
    'DEPARTMENT OF SOCIAL ENGAGEMENT AND EXTERNAL AFFAIRS',
    'dseea',
    'department of social engagement and external affairs',
    'social engagement and external affairs',
  ],
  [
    'RECREATION AND SPORTS MANAGEMENT DIVISION',
    'drsmd',
    'recreation and sports management division',
    'recreation and sports management',
  ],
];

const CANONICAL_DEPARTMENT_LABELS = new Set(DEPARTMENT_ALIAS_GROUPS.map((g) => g[0]));

/** Canonical labels for XCITES top leadership block (before MRPD roster section). */
const EXECUTIVES_DEPT_CANONICAL = DEPARTMENT_ALIAS_GROUPS[0][0];
const MRPD_DEPT_CANONICAL = DEPARTMENT_ALIAS_GROUPS[1][0];

/** Map a section banner (e.g. MEDIA RELATIONS… (MRPD)) to a stored department; '' if unknown. */
function inferDepartmentFromBanner(title) {
  const t = nz(title);
  if (!t) return '';
  const mapped = normalizeDepartmentLabel(t);
  if (CANONICAL_DEPARTMENT_LABELS.has(mapped)) return mapped;
  return '';
}

export function normalizeDepartmentLabel(raw) {
  const t = String(raw ?? '').trim();
  if (!t) return '';
  const key = t.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();

  for (const group of DEPARTMENT_ALIAS_GROUPS) {
    const [canonical, ...aliases] = group;
    if (key === canonical.toLowerCase()) return canonical;
    for (const a of aliases) {
      if (key === a) return canonical;
    }
  }

  for (const group of DEPARTMENT_ALIAS_GROUPS) {
    const [canonical, ...aliases] = group;
    const canonLc = canonical.toLowerCase();
    if (key.includes(canonLc)) return canonical;
    for (const a of aliases) {
      if (a.length >= 5 && key.includes(a)) return canonical;
    }
  }

  return t;
}

function normalizeHeader(h) {
  return String(h ?? '')
    .replace(/^\ufeff/, '')
    .toLowerCase()
    .replace(/[''′`]/g, '')
    .replace(/[^\w\s/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findColumnIndex(headers, synonyms) {
  const normalized = headers.map((h) => normalizeHeader(h));
  for (const syn of synonyms) {
    const idx = normalized.indexOf(syn);
    if (idx !== -1) return idx;
  }
  for (let i = 0; i < normalized.length; i++) {
    const n = normalized[i];
    if (!n) continue;
    for (const syn of synonyms) {
      if (syn.length <= 3 && n !== syn) continue;
      if (syn === 'name' && n !== syn && !/\bname\b/.test(n)) continue;
      if (n.includes(syn) || (syn.length >= 4 && syn.includes(n))) return i;
    }
  }
  return -1;
}

function splitFullName(full) {
  const s = String(full).trim();
  if (!s) return { firstName: '', lastName: '' };
  const parts = s.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function cell(row, idx) {
  if (!row || idx < 0) return '';
  return String(row[idx] ?? '').trim();
}

function padRow(row, width) {
  const arr = Array.isArray(row) ? [...row] : [];
  while (arr.length < width) arr.push('');
  return arr;
}

function rowHasData(row) {
  if (!Array.isArray(row)) return false;
  return row.some((c) => String(c).trim());
}

function looksLikePersonName(s) {
  const t = String(s ?? '').trim();
  if (t.length < 3) return false;
  if (/^\d+$/.test(t)) return false;
  if (t === '—' || t === '-' || t === '–') return false;
  if (/^[#\s\-–—.]+$/i.test(t)) return false;
  if (!/[a-zA-ZÀ-ž]/.test(t)) return false;
  return true;
}

/** Block / section titles (e.g. EXECUTIVES, MEDIA RELATIONS…) — ALL CAPS, length ≥ 6 */
function looksLikeSectionHeader(s) {
  const t = String(s ?? '').trim();
  if (t.length < 6) return false;
  const letters = t.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 6) return false;
  return letters === letters.toUpperCase();
}

function cellRaw(row, idx) {
  if (!row || idx < 0) return null;
  const v = row[idx];
  if (v === undefined || v === null || v === '') return null;
  return v;
}

function formatBirthdateCell(raw) {
  if (typeof raw === 'number' && raw > 20000 && raw < 100000) {
    try {
      const d = XLSX.SSF.parse_date_code(raw);
      if (d && d.y > 1900 && d.y < 2100) {
        return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
      }
    } catch (_) {
      /* ignore */
    }
  }
  return String(raw ?? '').trim();
}

/** Prefer real table headers (NAME + DEPARTMENT) over divider rows like "EXECUTIVES". */
function headerRowQuality(headers) {
  const nameI = findColumnIndex(headers, FIELD_SYNONYMS.fullName);
  const deptI = findColumnIndex(headers, FIELD_SYNONYMS.department);
  const posI = findColumnIndex(headers, FIELD_SYNONYMS.position);

  if (nameI === -1 && deptI === -1 && posI === -1) {
    const anySection = headers.some((h) => {
      const t = String(h ?? '').trim();
      return t && looksLikeSectionHeader(t);
    });
    if (anySection) return -9999;
  }

  let q = 0;
  if (nameI >= 0) q += 100;
  if (deptI >= 0) q += 200;
  if (posI >= 0) q += 30;
  if (findColumnIndex(headers, FIELD_SYNONYMS.email) >= 0) q += 10;
  if (findColumnIndex(headers, FIELD_SYNONYMS.phone) >= 0) q += 5;
  return q;
}

function scoreNameColumn(dataSlice, colIdx, width, maxRows = 15) {
  let score = 0;
  const n = Math.min(maxRows, dataSlice.length);
  for (let i = 0; i < n; i++) {
    const row = padRow(dataSlice[i], width);
    if (looksLikePersonName(cell(row, colIdx))) score++;
  }
  return score;
}

function headerLooksLikeIndexColumn(headers, colIdx) {
  const n = normalizeHeader(headers[colIdx]);
  if (!n) return true;
  if (/^no\.?$/.test(n)) return true;
  if (n === '#' || n === 'nr' || n === 'seq' || n === 'order' || n === 'idx') return true;
  if (/^#/.test(n)) return true;
  return false;
}

/**
 * Fix "Name" column that actually holds row numbers (11, 12…) when another column has real names.
 */
function refineNameColumn(headers, dataSlice, col, width) {
  if (col.fullName === -1 && col.firstName === -1 && col.lastName === -1) {
    let best = -1;
    let bestScore = 0;
    for (let c = 0; c < width; c++) {
      if (headerLooksLikeIndexColumn(headers, c)) continue;
      const sc = scoreNameColumn(dataSlice, c, width);
      if (sc > bestScore) {
        bestScore = sc;
        best = c;
      }
    }
    if (best >= 0 && bestScore >= 2) col.fullName = best;
    return;
  }

  if (col.fullName === -1) return;

  const sampleN = Math.min(12, dataSlice.length);
  if (sampleN === 0) return;

  let bad = 0;
  for (let i = 0; i < sampleN; i++) {
    const row = padRow(dataSlice[i], width);
    const v = cell(row, col.fullName);
    if (/^\d+$/.test(v) || !v || v === '—' || v === '-' || v === '–') bad++;
  }

  if (bad < sampleN * 0.45) return;

  let best = col.fullName;
  let bestScore = scoreNameColumn(dataSlice, col.fullName, width);
  for (let c = 0; c < width; c++) {
    if (c === col.fullName) continue;
    const sc = scoreNameColumn(dataSlice, c, width);
    if (sc > bestScore) {
      bestScore = sc;
      best = c;
    }
  }
  if (best !== col.fullName && bestScore >= 3) {
    col.fullName = best;
    col._nameColumnAdjusted = true;
  }
}

/**
 * Try parsing using row `headerRowIndex` as the header line.
 * @returns {{ records: object[], warnings: string[] }}
 */
function tryParseWithHeaderRow(rows, headerRowIndex) {
  const warnings = [];
  const headerCells = rows[headerRowIndex];
  if (!Array.isArray(headerCells)) return { records: [], warnings };

  const headers = headerCells.map((h) => String(h).trim());
  if (!headers.some((h) => h)) return { records: [], warnings };

  const col = {
    fullName: findColumnIndex(headers, FIELD_SYNONYMS.fullName),
    firstName: findColumnIndex(headers, FIELD_SYNONYMS.firstName),
    lastName: findColumnIndex(headers, FIELD_SYNONYMS.lastName),
    department: findColumnIndex(headers, FIELD_SYNONYMS.department),
    email: findColumnIndex(headers, FIELD_SYNONYMS.email),
    position: findColumnIndex(headers, FIELD_SYNONYMS.position),
    phone: findColumnIndex(headers, FIELD_SYNONYMS.phone),
    nickname: findColumnIndex(headers, FIELD_SYNONYMS.nickname),
    birthdate: findColumnIndex(headers, FIELD_SYNONYMS.birthdate),
    sex: findColumnIndex(headers, FIELD_SYNONYMS.sex),
    preferredPronouns: findColumnIndex(headers, FIELD_SYNONYMS.preferredPronouns),
    photo: findColumnIndex(headers, FIELD_SYNONYMS.photo),
    signatures: findColumnIndex(headers, FIELD_SYNONYMS.signatures),
    schedules: findColumnIndex(headers, FIELD_SYNONYMS.schedules),
  };

  const dataSlice = rows.slice(headerRowIndex + 1);
  const width = Math.max(
    headers.length,
    ...dataSlice.map((r) => (Array.isArray(r) ? r.length : 0))
  );

  refineNameColumn(headers, dataSlice, col, width);

  if (col.fullName !== -1 && col.department !== -1 && col.fullName === col.department) {
    col.department = -1;
    warnings.push(
      'Name and Department pointed at the same column after auto-fix — department cells were left blank unless the sheet has a separate Department column.'
    );
  }

  let usedDeptFallback = false;
  let usedInheritedDepartment = false;
  let inheritedDepartment = '';
  /** True from EXECUTIVES banner until the MRPD department section banner (dept heads stay true). */
  let inExecutiveCouncilRoster = false;

  const records = [];
  for (let i = 0; i < dataSlice.length; i++) {
    const raw = dataSlice[i];
    if (!rowHasData(raw)) continue;
    const row = padRow(raw, width);

    const idx0 = cell(row, 0);
    if (col.fullName >= 0) {
      const nameColCell = cell(row, col.fullName);
      // XCITES: later blocks put the department banner in column A, name column empty (e.g. row
      // "DEPARTMENT OF EVENTS AND MANAGEMENT" | blank name | …).
      if (nz(idx0) && !nz(nameColCell) && looksLikeSectionHeader(idx0)) {
        const next = inferDepartmentFromBanner(idx0);
        if (next) {
          if (next === EXECUTIVES_DEPT_CANONICAL) inExecutiveCouncilRoster = true;
          else if (next === MRPD_DEPT_CANONICAL) inExecutiveCouncilRoster = false;
          inheritedDepartment = next;
        }
        continue;
      }
      // Earlier blocks: banner in the Name column, index column A empty (EXECUTIVES, MRPD title).
      if (!nz(idx0) && nameColCell && looksLikeSectionHeader(nameColCell)) {
        const next = inferDepartmentFromBanner(nameColCell);
        if (next) {
          if (next === EXECUTIVES_DEPT_CANONICAL) inExecutiveCouncilRoster = true;
          else if (next === MRPD_DEPT_CANONICAL) inExecutiveCouncilRoster = false;
          inheritedDepartment = next;
        }
        continue;
      }
    }

    let firstName = col.firstName !== -1 ? cell(row, col.firstName) : '';
    let lastName = col.lastName !== -1 ? cell(row, col.lastName) : '';
    let fullName = col.fullName !== -1 ? cell(row, col.fullName) : '';

    if (!fullName && (firstName || lastName)) {
      fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    }
    if (!fullName && col.fullName === -1 && !firstName && !lastName) {
      continue;
    }
    if (!fullName) {
      const parts = splitFullName(`${firstName} ${lastName}`.trim());
      fullName = [parts.firstName, parts.lastName].filter(Boolean).join(' ').trim();
      firstName = firstName || parts.firstName;
      lastName = lastName || parts.lastName;
    }
    if (!firstName && !lastName && fullName) {
      const parts = splitFullName(fullName);
      firstName = parts.firstName;
      lastName = parts.lastName;
    }

    if (/^(name|department|position|no\.?)$/i.test(fullName) && fullName.length < 40) {
      continue;
    }

    if (/^\d+$/.test(fullName) && !looksLikePersonName(fullName)) {
      continue;
    }

    if (looksLikeSectionHeader(fullName)) {
      continue;
    }

    let department = col.department !== -1 ? cell(row, col.department) : '';
    department = normalizeDepartmentLabel(department);
    if (!department && inheritedDepartment) {
      department = normalizeDepartmentLabel(inheritedDepartment) || inheritedDepartment;
      usedInheritedDepartment = true;
    }
    const positionVal = col.position !== -1 ? cell(row, col.position) : '';

    if (!department) {
      department = '';
      usedDeptFallback = true;
    }

    if (!fullName) continue;

    records.push({
      fullName,
      firstName: firstName || '',
      lastName: lastName || '',
      department,
      executiveBoard: inExecutiveCouncilRoster,
      email: col.email !== -1 ? cell(row, col.email) : '',
      position: positionVal,
      phone: col.phone !== -1 ? cell(row, col.phone) : '',
      nickname: col.nickname !== -1 ? cell(row, col.nickname) : '',
      birthdate:
        col.birthdate !== -1 ? formatBirthdateCell(cellRaw(row, col.birthdate)) : '',
      sex: col.sex !== -1 ? cell(row, col.sex) : '',
      preferredPronouns: col.preferredPronouns !== -1 ? cell(row, col.preferredPronouns) : '',
      photo: col.photo !== -1 ? cell(row, col.photo) : '',
      signatures: col.signatures !== -1 ? cell(row, col.signatures) : '',
      schedules: col.schedules !== -1 ? cell(row, col.schedules) : '',
    });

    // After MRPD (and similar blocks), the sheet often leaves Department blank until the next
    // row that has an explicit unit in column M — advance inherited dept so we don't tag the
    // whole roster as MRPD.
    if (nz(department)) {
      inheritedDepartment = department;
    }
  }

  if (col._nameColumnAdjusted) {
    warnings.push(
      'The "Name" column looked like row numbers — the importer used the column that contains full names instead.'
    );
  }
  if (col.department === -1) {
    warnings.push(
      'No Department column found — department was left blank for those rows. Use the Position filter or add a Department column.'
    );
  } else if (usedDeptFallback) {
    warnings.push('Some rows had an empty department cell in the file.');
  }
  if (usedInheritedDepartment) {
    warnings.push(
      'Some departments were taken from section headers (e.g. MRPD block) where the Department column was left blank.'
    );
  }

  return { records, warnings };
}

function pickBestParseForRows(rows) {
  let best = { records: [], warnings: [], headerRowIndex: 0, score: -Infinity };
  const maxHeader = Math.min(30, Math.max(0, rows.length - 2));
  for (let h = 0; h <= maxHeader; h++) {
    const headerCells = rows[h];
    if (!Array.isArray(headerCells)) continue;
    const headers = headerCells.map((x) => String(x).trim());
    if (!headers.some((x) => x)) continue;

    const hq = headerRowQuality(headers);
    if (hq < 0) continue;

    const { records, warnings } = tryParseWithHeaderRow(rows, h);
    const score = hq * 1000 + records.length;
    if (score > best.score) {
      best = { records, warnings, headerRowIndex: h, score };
    }
  }

  if (best.score === -Infinity) {
    for (let h = 0; h <= maxHeader; h++) {
      const { records, warnings } = tryParseWithHeaderRow(rows, h);
      if (records.length > best.records.length) {
        best = { records, warnings, headerRowIndex: h, score: records.length };
      }
    }
  }

  return best;
}

function nz(s) {
  return String(s ?? '').trim();
}

/** Combine two rows for the same person (e.g. listed under Executives and again under DEM). */
function mergeTwoRecords(a, b) {
  const pick = (fa, fb) => nz(fb) || nz(fa);
  const pickDept = () => {
    const d1 = nz(a.department);
    const d2 = nz(b.department);
    if (!d1) return d2;
    if (!d2) return d1;
    const n1 = normalizeDepartmentLabel(d1) || d1;
    const n2 = normalizeDepartmentLabel(d2) || d2;
    if (n1 === n2) return n1;
    return n1.length >= n2.length ? n1 : n2;
  };
  const mergedDept = pickDept();
  const department = normalizeDepartmentLabel(mergedDept) || mergedDept;

  return {
    fullName: pick(a.fullName, b.fullName),
    firstName: pick(a.firstName, b.firstName),
    lastName: pick(a.lastName, b.lastName),
    department,
    executiveBoard: !!(a.executiveBoard || b.executiveBoard),
    email: pick(a.email, b.email),
    position: pick(a.position, b.position),
    phone: pick(a.phone, b.phone),
    nickname: pick(a.nickname, b.nickname),
    birthdate: pick(a.birthdate, b.birthdate),
    sex: pick(a.sex, b.sex),
    preferredPronouns: pick(a.preferredPronouns, b.preferredPronouns),
    photo: pick(a.photo, b.photo),
    signatures: pick(a.signatures, b.signatures),
    schedules: pick(a.schedules, b.schedules),
  };
}

/**
 * One person often appears twice in XCITES-style sheets (e.g. executive block + dept block).
 * Collapse by email, or by normalized full name if email is missing.
 */
function dedupeDirectoryRecords(records) {
  const byKey = new Map();
  for (const r of records) {
    const email = nz(r.email).toLowerCase();
    const nameKey = nz(r.fullName).toLowerCase().replace(/\s+/g, ' ');
    const key = email ? `e:${email}` : nameKey ? `n:${nameKey}` : null;
    if (!key) continue;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...r, executiveBoard: !!r.executiveBoard });
    } else {
      byKey.set(key, mergeTwoRecords(existing, r));
    }
  }
  return Array.from(byKey.values());
}

/**
 * Parse Excel workbook or CSV into directory records.
 * Tries multiple possible header rows (many org sheets have a title block above the real headers).
 * @param {ArrayBuffer} arrayBuffer
 * @returns {{ records: object[], warnings: string[], rowCount: number }}
 */
export function parseSpreadsheetToRecords(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' });
  if (!wb.SheetNames.length) {
    throw new Error('The file has no sheets.');
  }

  let best = { records: [], warnings: [], headerRowIndex: 0, score: -Infinity };

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (rows.length < 2) continue;

    const candidate = pickBestParseForRows(rows);
    if (candidate.score > best.score) {
      best = candidate;
    }
  }

  if (!best.records.length) {
    throw new Error(
      'No valid rows found. Put a header row (e.g. Name, Department or Name, Position) and data below it. ' +
        'If titles sit above the table, leave them — the importer scans the first rows for headers.'
    );
  }

  const rawCount = best.records.length;
  const records = dedupeDirectoryRecords(best.records);
  const mergedDupes = rawCount - records.length;

  const note =
    best.headerRowIndex > 0
      ? `Detected header row on line ${best.headerRowIndex + 1} of the sheet.`
      : null;
  const dedupeNote =
    mergedDupes > 0
      ? `Merged ${mergedDupes} duplicate roster row(s) with the same email (or same name if email was empty).`
      : null;
  const warnings = [note, dedupeNote, ...best.warnings].filter(Boolean);

  return { records, warnings, rowCount: records.length };
}

function nameDeptKey(fullName, department) {
  return `${String(fullName).toLowerCase().trim()}|${String(department).toLowerCase().trim()}`;
}

/**
 * Remove all documents in `directory` and insert new rows (full replace).
 */
export async function replaceDirectoryEntries(db, records) {
  const now = new Date().toISOString();
  const snap = await getDocs(collection(db, 'directory'));
  const refs = snap.docs.map((d) => d.ref);

  for (let i = 0; i < refs.length; i += 500) {
    const batch = writeBatch(db);
    refs.slice(i, i + 500).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }

  for (let i = 0; i < records.length; i += 500) {
    const batch = writeBatch(db);
    const chunk = records.slice(i, i + 500);
    chunk.forEach((r) => {
      const ref = doc(collection(db, 'directory'));
      batch.set(ref, {
        fullName: r.fullName,
        firstName: r.firstName || '',
        lastName: r.lastName || '',
        department: r.department,
        executiveBoard: !!r.executiveBoard,
        email: r.email || '',
        position: r.position || '',
        phone: r.phone || '',
        nickname: r.nickname || '',
        birthdate: r.birthdate || '',
        sex: r.sex || '',
        preferredPronouns: r.preferredPronouns || '',
        photo: r.photo || '',
        signatures: r.signatures || '',
        schedules: r.schedules || '',
        createdAt: now,
        updatedAt: now,
      });
    });
    await batch.commit();
  }

  return records.length;
}

/**
 * Upsert by email when present, otherwise by fullName + department.
 */
export async function mergeDirectoryEntries(db, records) {
  const now = new Date().toISOString();
  const snap = await getDocs(collection(db, 'directory'));
  const existingIds = new Set(snap.docs.map((d) => d.id));

  const byEmail = new Map();
  const byNameDept = new Map();
  snap.forEach((d) => {
    const x = d.data();
    if (x.email && String(x.email).trim()) {
      byEmail.set(String(x.email).toLowerCase().trim(), d.ref);
    }
    byNameDept.set(nameDeptKey(x.fullName, x.department), d.ref);
  });

  let batch = writeBatch(db);
  let ops = 0;

  const flush = async () => {
    if (ops === 0) return;
    await batch.commit();
    batch = writeBatch(db);
    ops = 0;
  };

  for (const r of records) {
    let ref;
    if (r.email && String(r.email).trim()) {
      const ek = String(r.email).toLowerCase().trim();
      ref = byEmail.get(ek);
      if (!ref) {
        ref = doc(collection(db, 'directory'));
        byEmail.set(ek, ref);
      }
    } else {
      const key = nameDeptKey(r.fullName, r.department);
      ref = byNameDept.get(key);
      if (!ref) {
        ref = doc(collection(db, 'directory'));
        byNameDept.set(key, ref);
      }
    }

    const payload = {
      fullName: r.fullName,
      firstName: r.firstName || '',
      lastName: r.lastName || '',
      department: r.department,
      executiveBoard: !!r.executiveBoard,
      email: r.email || '',
      position: r.position || '',
      phone: r.phone || '',
      nickname: r.nickname || '',
      birthdate: r.birthdate || '',
      sex: r.sex || '',
      preferredPronouns: r.preferredPronouns || '',
      photo: r.photo || '',
      signatures: r.signatures || '',
      schedules: r.schedules || '',
      updatedAt: now,
    };

    if (!existingIds.has(ref.id)) {
      payload.createdAt = now;
    }

    batch.set(ref, payload, { merge: true });
    ops++;
    if (ops >= 500) await flush();
  }

  await flush();
  return records.length;
}
