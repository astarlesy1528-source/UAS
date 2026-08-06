const Data = (() => {
  const store = {};      // key -> { headers, rows, ok, error }
  const sources = DATA_SOURCES;

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { cell += '"'; i++; }
          else inQuotes = false;
        } else cell += ch;
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === ',') { row.push(cell); cell = ''; }
        else if (ch === '\n') { row.push(cell); cell = ''; rows.push(row); row = []; }
        else if (ch === '\r') { /* ignore */ }
        else cell += ch;
      }
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    // trim empty trailing
    while (rows.length && rows[rows.length - 1].every(c => c === '')) rows.pop();
    return rows;
  }

  async function fetchOne(key) {
    const src = sources[key];
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetch(src.url, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const text = await res.text();
        const parsed = parseCSV(text);
        if (!parsed.length) throw new Error('Data kosong');
        const headers = parsed[0].map(h => h.trim());
        const rows = [];
        for (let i = 1; i < parsed.length; i++) {
          const arr = parsed[i];
          if (!arr.some(c => String(c).trim() !== '')) continue;
          const obj = {};
          headers.forEach((h, idx) => { obj[h] = (arr[idx] !== undefined ? String(arr[idx]).trim() : ''); });
          rows.push(obj);
        }
        store[key] = { headers, rows, ok: true, error: null };
        return store[key];
      } catch (e) {
        if (attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, 800 * attempt));
        } else {
          store[key] = { headers: [], rows: [], ok: false, error: e.message };
        }
      }
    }
    return store[key];
  }

  async function loadAll() {
    store['_started'] = Date.now();
    const keys = Object.keys(sources);
    const batchSize = 4;
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);
      await Promise.all(batch.map(fetchOne));
    }
    store['_ended'] = Date.now();
    return store;
  }

  // ---- Helpers ----
  function table(key) { const s = store[key]; return (s && s.ok) ? s.rows : []; }
  function ok(key) { const s = store[key]; return !!(s && s.ok); }

  function sumRows(key, field) {
    return table(key).reduce((a, r) => a + (Number(r[field]) || 0), 0);
  }
  function countBy(key, field) {
    const m = new Map();
    table(key).forEach(r => {
      const k = r[field] || '(kosong)';
      m.set(k, (m.get(k) || 0) + 1);
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }
  function sumBy(key, field, sumField) {
    const m = new Map();
    table(key).forEach(r => {
      const k = r[field] || '(kosong)';
      m.set(k, (m.get(k) || 0) + (Number(r[sumField]) || 0));
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }

  // group by a date field into buckets "YYYY-MM"
  function groupByMonth(key, dateField) {
    const m = new Map();
    table(key).forEach(r => {
      const d = normalizeDate(r[dateField]);
      const ym = d ? d : '(tanpa tanggal)';
      m.set(ym, (m.get(ym) || 0) + 1);
    });
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }

  function normalizeDate(v) {
    if (!v) return null;
    const m = String(v).match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}`;
    return null;
  }

  function percent(part, whole) {
    if (!whole) return 0;
    return Math.round((part / whole) * 100);
  }

  function num(v) { return Number(v) || 0; }
  function fmt(n) { return Number(n || 0).toLocaleString('id-ID'); }

  // ---- Filter-aware helpers (site + date range from global Filters) ----
  function matchesFilter(r) {
    const f = (typeof window !== 'undefined') ? window.Filters : null;
    if (!f) return true;
    if (f.site && f.site !== 'all' && r.ID_Site && r.ID_Site !== f.site) return false;
    const ym = normalizeDate(r.Tanggal);
    if (ym) {
      if (f.from && ym < f.from) return false;
      if (f.to && ym > f.to) return false;
    }
    return true;
  }
  function fTable(key) { return table(key).filter(matchesFilter); }

  function fCountBy(key, field) {
    const m = new Map();
    fTable(key).forEach(r => {
      const k = r[field] || '(kosong)';
      m.set(k, (m.get(k) || 0) + 1);
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }
  function fSumBy(key, field, sumField) {
    const m = new Map();
    fTable(key).forEach(r => {
      const k = r[field] || '(kosong)';
      m.set(k, (m.get(k) || 0) + num(r[sumField]));
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }
  function fSumRows(key, field) {
    return fTable(key).reduce((a, r) => a + num(r[field]), 0);
  }
  function fGroupByMonth(key, dateField) {
    const m = new Map();
    fTable(key).forEach(r => {
      const ym = normalizeDate(r[dateField]);
      const k = ym ? ym : '(tanpa tanggal)';
      m.set(k, (m.get(k) || 0) + 1);
    });
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }
  function fSumByMonth(key, dateField, sumField) {
    const m = new Map();
    fTable(key).forEach(r => {
      const ym = normalizeDate(r[dateField]);
      const k = ym ? ym : '(tanpa tanggal)';
      m.set(k, (m.get(k) || 0) + num(r[sumField]));
    });
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }

  const api = {
    sources, store, loadAll,
    table, ok, headers: (k) => (store[k] && store[k].ok) ? store[k].headers : [],
    sumRows, countBy, sumBy, groupByMonth, normalizeDate, percent, num, fmt,
    matchesFilter, fTable, fCountBy, fSumBy, fSumRows, fGroupByMonth, fSumByMonth
  };
  if (typeof window !== 'undefined') window.Data = api;
  return api;
})();