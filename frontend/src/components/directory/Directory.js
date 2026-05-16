import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import {
  parseSpreadsheetToRecords,
  replaceDirectoryEntries,
  mergeDirectoryEntries,
  normalizeDepartmentLabel,
} from '../../utils/directoryImport';
import {
  BookOpen,
  Search,
  Upload,
  Filter,
  AlertCircle,
  Users,
  Building2,
  Mail,
  Briefcase,
  Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Directory = () => {
  const { userRole, logEvent, currentUser } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState('replace');
  const canManage = userRole === 'admin' || userRole === 'executive';

  const loadEntries = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'directory'));
      const list = snap.docs.map((d) => {
        const data = d.data();
        const deptRaw = data.department != null ? String(data.department).trim() : '';
        let department = normalizeDepartmentLabel(deptRaw) || deptRaw;
        if (!department || department.toLowerCase() === 'general') {
          department = '';
        }
        return { id: d.id, ...data, department };
      });
      list.sort((a, b) => {
        const da = (a.department || '').localeCompare(b.department || '');
        if (da !== 0) return da;
        return (a.fullName || '').localeCompare(b.fullName || '');
      });
      setEntries(list);
    } catch (e) {
      console.error(e);
      const code = e?.code || '';
      if (code === 'permission-denied') {
        toast.error(
          'Directory blocked by Firestore rules. Deploy updated rules: firebase deploy --only firestore:rules'
        );
      } else if (code === 'unavailable' || code === 'failed-precondition') {
        toast.error('Could not reach Firestore. Check your network or Firebase project status.');
      } else {
        toast.error(e?.message || 'Could not load directory');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const departments = useMemo(() => {
    const set = new Set();
    entries.forEach((e) => {
      const d = (e.department || '').trim();
      if (d && d.toLowerCase() !== 'general') set.add(d);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [entries]);

  const positions = useMemo(() => {
    const set = new Set();
    entries.forEach((e) => {
      if (e.position) set.add(e.position);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [entries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (deptFilter !== 'all') {
        const wantNorm = normalizeDepartmentLabel(deptFilter) || deptFilter;
        const haveNorm = normalizeDepartmentLabel(e.department) || e.department;
        if (wantNorm === 'executives') {
          if (haveNorm !== 'executives' && !e.executiveBoard) return false;
        } else if (haveNorm !== wantNorm && e.department !== deptFilter) {
          return false;
        }
      }
      if (positionFilter !== 'all' && e.position !== positionFilter) return false;
      if (!q) return true;
      const blob = [
        e.fullName,
        e.firstName,
        e.lastName,
        e.department,
        e.position,
        e.email,
        e.phone,
        e.nickname,
        e.birthdate,
        e.sex,
        e.preferredPronouns,
        e.photo,
        e.signatures,
        e.schedules,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }, [entries, search, deptFilter, positionFilter]);

  useEffect(() => {
    if (deptFilter !== 'all' && !departments.includes(deptFilter)) {
      setDeptFilter('all');
    }
  }, [deptFilter, departments]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !canManage) return;

    try {
      setImporting(true);
      const buf = await file.arrayBuffer();
      const { records, warnings, rowCount } = parseSpreadsheetToRecords(buf);

      warnings.forEach((w) => toast(w, { icon: 'ℹ️' }));

      if (importMode === 'replace') {
        const ok = window.confirm(
          `Replace the entire directory with ${rowCount} row(s) from "${file.name}"? Existing entries will be removed.`
        );
        if (!ok) {
          setImporting(false);
          return;
        }
        await replaceDirectoryEntries(db, records);
        toast.success(`Imported ${rowCount} directory row(s) (replaced all).`);
      } else {
        await mergeDirectoryEntries(db, records);
        toast.success(`Merged ${rowCount} directory row(s).`);
      }

      await logEvent({
        type: 'directory_import',
        mode: importMode,
        rowCount,
        fileName: file.name,
        performedBy: currentUser?.uid,
        email: currentUser?.email,
      });
      await loadEntries();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-blue-600" />
          Member directory
        </h1>
        <p className="mt-2 text-gray-600">
          Officers and members by department. Import from an Excel or CSV export when needed.
        </p>
      </div>

      {canManage && (
        <div className="bg-white shadow rounded-lg border border-gray-100 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              Import spreadsheet
            </h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              Use the first sheet with a header row. Columns include{' '}
              <strong>Name</strong>, <strong>Department</strong>, <strong>Email</strong> (incl. XU
              email), <strong>Position</strong>, <strong>Mobile</strong>, <strong>Nickname</strong>,{' '}
              <strong>Birthdate</strong>, <strong>Sex</strong>, <strong>Pronouns</strong>,{' '}
              <strong>Photo</strong>, <strong>Signatures</strong>, <strong>Schedules</strong>. Codes
              (Executive, MRPD, DEM, DSSAA, DSEEA, DRSMD) map to your six official units on import.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Mode</span>
              <select
                value={importMode}
                onChange={(ev) => setImportMode(ev.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 text-sm max-w-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="replace">Replace entire directory</option>
                <option value="merge">Merge (update matching rows)</option>
              </select>
            </div>
            <div>
              <label className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 cursor-pointer disabled:opacity-50">
                <Upload className="h-4 w-4 mr-2" />
                {importing ? 'Processing…' : 'Choose .xlsx or .csv'}
                <input
                  type="file"
                  accept=".csv,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                  className="hidden"
                  disabled={importing}
                  onChange={handleFile}
                />
              </label>
            </div>
            <div className="flex gap-2 text-sm text-amber-900 bg-amber-50 border border-amber-100 rounded-md p-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
              <span>
                <strong>Replace</strong> removes all directory rows, then inserts the file.{' '}
                <strong>Merge</strong> updates by email or by name + department.
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Entries</p>
              <p className="text-2xl font-semibold text-gray-900">{entries.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Departments</p>
              <p className="text-2xl font-semibold text-gray-900">{departments.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Filter className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Showing</p>
              <p className="text-2xl font-semibold text-gray-900">{filtered.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/80">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="search"
                placeholder="Search (name, nickname, email, schedules…)"
                value={search}
                onChange={(ev) => setSearch(ev.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:w-auto">
              <select
                value={deptFilter}
                onChange={(ev) => setDeptFilter(ev.target.value)}
                className="w-full sm:w-56 border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <select
                value={positionFilter}
                onChange={(ev) => setPositionFilter(ev.target.value)}
                className="w-full sm:w-56 border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All positions</option>
                {positions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  More
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {entries.length === 0
                      ? 'No directory data yet. Import a spreadsheet if you have access, or check back later.'
                      : 'No rows match your filters.'}
                  </td>
                </tr>
              )}
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    <div>{row.fullName}</div>
                    {(row.nickname || row.preferredPronouns) && (
                      <div className="text-xs font-normal text-gray-500 mt-0.5">
                        {[row.nickname && `“${row.nickname}”`, row.preferredPronouns]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {row.department ? (
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-gray-400" />
                        {row.department}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {row.position ? (
                      <span className="inline-flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        {row.position}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex flex-col gap-1">
                      {row.email && (
                        <a
                          href={`mailto:${row.email}`}
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          {row.email}
                        </a>
                      )}
                      {row.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {row.phone}
                        </span>
                      )}
                      {!row.email && !row.phone && '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600 max-w-xs">
                    <div className="space-y-1">
                      {[row.birthdate, row.sex].filter(Boolean).join(' · ') || null}
                      {row.schedules && (
                        <div className="line-clamp-2" title={row.schedules}>
                          {row.schedules}
                        </div>
                      )}
                      {row.photo && (
                        <a
                          href={row.photo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline block truncate"
                        >
                          Photo link
                        </a>
                      )}
                      {row.signatures && (
                        <div className="line-clamp-2" title={row.signatures}>
                          Sig.: {row.signatures}
                        </div>
                      )}
                      {!row.birthdate &&
                        !row.sex &&
                        !row.schedules &&
                        !row.photo &&
                        !row.signatures &&
                        '—'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Directory;
