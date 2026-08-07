const UI = (() => {
  const charts = {};
  let pending = [];

  const PALETTE = ['#0e5fd8', '#18a05e', '#f59e0b', '#e0453e', '#7c5cff', '#14b8a6', '#ec4899', '#6366f1', '#f97316', '#14b8a6'];

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // Queue a chart; it is created by flush() once canvases exist in the DOM.
  function schedule(canvasId, config) { pending.push({ canvasId, config }); }

  function chart(canvasId, config) {
    const el = document.getElementById(canvasId);
    if (!el) return;
    const existing = charts[canvasId];
    if (existing && existing.canvas === el) {
      // Reuse the chart instance: swap data/options and redraw in place.
      try {
        existing.data = config.data;
        existing.options = config.options;
        existing.update();
        return;
      } catch (e) {}
    }
    if (existing) { try { existing.destroy(); } catch (e) {} }
    try { charts[canvasId] = new Chart(el, config); } catch (e) {}
  }

  // Create all queued charts (DOM must already contain the canvases).
  function flush() {
    pending.forEach(({ canvasId, config }) => chart(canvasId, config));
    pending = [];
  }

  function baseConfig(type, labels, data, opts) {
    const o = opts || {};
    const cfg = {
      type,
      data: { labels, datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: o.legend || 'bottom', labels: { boxWidth: 12, boxHeight: 12, font: { size: 11 } } },
          tooltip: { callbacks: {} }
        },
        scales: {}
      }
    };
    return cfg;
  }

  function bar(canvasId, labels, values, o) {
    o = o || {};
    const cfg = baseConfig('bar', labels, [{ data: values, backgroundColor: PALETTE, borderRadius: 6 }], o);
    cfg.options.indexAxis = o.horizontal ? 'y' : 'x';
    cfg.options.scales = {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { beginAtZero: true, grid: { color: '#eff3f9' }, ticks: { font: { size: 11 } } }
    };
    if (o.percent) { cfg.options.scales.y.max = 100; cfg.options.scales.y.ticks.callback = v => v + '%'; }
    schedule(canvasId, cfg);
  }

  function line(canvasId, labels, series, o) {
    o = o || {};
    const ds = series.map((s, i) => ({
      label: s.label,
      data: s.data,
      borderColor: s.color || PALETTE[i],
      backgroundColor: s.color || PALETTE[i],
      pointRadius: 3,
      tension: 0.35,
      fill: o.fill ? true : false
    }));
    const cfg = baseConfig('line', labels, ds, o);
    cfg.options.scales = {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { beginAtZero: true, grid: { color: '#eff3f9' }, ticks: { font: { size: 11 } } }
    };
    schedule(canvasId, cfg);
  }

  function doughnut(canvasId, labels, data, o) {
    o = o || {};
    const cfg = baseConfig('doughnut', labels, [{ data, backgroundColor: PALETTE, borderWidth: 2, borderColor: '#fff' }], o);
    cfg.options.cutout = o.cutout || '62%';
    cfg.options.plugins.legend.position = o.legend || 'right';
    cfg.options.scales = {};
    schedule(canvasId, cfg);
  }

  function destroyAll() {
    Object.keys(charts).forEach(k => { try { charts[k].destroy(); } catch (e) {} });
    Object.keys(charts).forEach(k => delete charts[k]);
    pending = [];
  }

  // ---- HTML builders ----
  function kpi(label, value, sub, tone) {
    return `<div class="card kpi ${tone || ''}">
      <div class="kpi-label">${esc(label)}</div>
      <div class="kpi-value">${esc(value)}</div>
      ${sub ? `<div class="kpi-sub">${sub}</div>` : ''}
    </div>`;
  }

  function card(title, sub, inner, cls) {
    return `<div class="card ${cls || ''}">
      ${title ? `<h3>${esc(title)}</h3>` : ''}
      ${sub ? `<div class="card-sub">${esc(sub)}</div>` : ''}
      ${inner}
    </div>`;
  }

  function sectionTitle(t) { return `<div class="section-title">${esc(t)}</div>`; }

  function placeholder(msg, error) {
    return `<div class="placeholder ${error ? 'error' : ''}">${esc(msg)}</div>`;
  }

  function table(cols, rows, emptyMsg) {
    if (!rows.length) return placeholder(emptyMsg || 'Belum ada data.');
    const head = `<tr>${cols.map(c => `<th>${esc(c.head)}</th>`).join('')}</tr>`;
    const body = rows.map(r =>
      `<tr>${cols.map((c, i) => `<td class="${i === cols.length - 1 ? '' : ''}">${c.cell(r)}</td>`).join('')}</tr>`
    ).join('');
    return `<div class="table-wrap"><table class="data"><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
  }

  function badgeState(status) {
    const s = String(status || '').toLowerCase();
    if (s.includes('selesai') || s.includes('terverifikasi') || s.includes('lulus')) return 'badge green';
    if (s.includes('terlambat') || s.includes('belum') || s.includes('tidak ada')) return 'badge red';
    if (s.includes('proses') || s.includes('terjadwal')) return 'badge amber';
    return 'badge amber';
  }

  function stat(value, label) {
    return `<span><b>${esc(value)}</b> ${esc(label)}</span>`;
  }

  const api = {
    PALETTE, destroyAll, flush, schedule, bar, line, doughnut,
    kpi, card, sectionTitle, placeholder, table, badgeState, stat, esc
  };
  if (typeof window !== 'undefined') window.UI = api;
  return api;
})();