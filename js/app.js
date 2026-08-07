(function () {
  const TITLES = {
    ringkasan: ['Ringkasan', 'Dashboard keselamatan & kesehatan kerja (K3)'],
    kecelakaan: ['Kecelakaan & Insiden', 'Kecelakaan, hampir celaka, dan henti kerja'],
    kerja: ['Izin & Jam Kerja', 'Izin kerja, kualitas JSA, dan akumulasi jam kerja'],
    observasi: ['Observasi & Program', 'Audit, observasi energi tinggi, kunjungan, pelatihan, program'],
    sdm: ['SDM & Kepatuhan', 'Karyawan, survei iklim K3, dan tindak lanjut']
  };
  const PAGES = {
    ringkasan: 'ringkasan',
    kecelakaan: 'kecelakaan',
    kerja: 'kerja',
    observasi: 'observasi',
    sdm: 'sdm'
  };

  const statusEl = document.getElementById('data-status');
  const lastUpdEl = document.getElementById('last-updated');

  function setStatus(html, cls) {
    if (statusEl) {
      statusEl.innerHTML = html;
      statusEl.className = 'data-status';
      if (cls) statusEl.classList.add(cls);
    }
  }

  function renderPage(page) {
    const section = document.getElementById('page-' + PAGES[page]);
    if (!section) return;
    // Keep existing <canvas> nodes so Chart instances can be reused via chart.update()
    // instead of being destroyed and recreated on every render.
    const oldCanvases = {};
    section.querySelectorAll('canvas').forEach(c => { oldCanvases[c.id] = c; });
    const temp = document.createElement('div');
    temp.innerHTML = Pages[PAGES[page]]();
    temp.querySelectorAll('canvas').forEach(c => {
      const old = oldCanvases[c.id];
      if (old) c.parentNode.replaceChild(old, c);
    });
    section.replaceChildren(...temp.childNodes);
    UI.flush();
  }

  function setActive(page) {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    const t = TITLES[page] || TITLES.ringkasan;
    document.getElementById('page-title').textContent = t[0];
    document.getElementById('page-subtitle').textContent = t[1];
  }

  function navTo(page) {
    if (!PAGES[page]) page = 'ringkasan';
    setActive(page);
    renderPage(page);
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + PAGES[page]);
    if (target) target.classList.add('active');
    history.replaceState(null, '', '#' + PAGES[page]);
    closeMenu();
  }

  // ---- Mobile menu ----
  const appEl = document.getElementById('app');
  function openMenu() { appEl.classList.add('menu-open'); }
  function closeMenu() { appEl.classList.remove('menu-open'); }

  document.getElementById('btn-menu').addEventListener('click', openMenu);
  document.getElementById('overlay').addEventListener('click', closeMenu);

  // ---- Filters ----
  const siteEl = document.getElementById('f-site');
  const fromEl = document.getElementById('f-from');
  const toEl = document.getElementById('f-to');

  function fillSiteOptions() {
    const sites = Data.table('site');
    if (!sites.length) return;
    const opt = document.createElement('option');
    opt.value = 'all';
    opt.textContent = 'Semua Site';
    siteEl.replaceChildren(opt);
    sites.forEach(s => {
      const o = document.createElement('option');
      o.value = s.ID_Site;
      o.textContent = s.ID_Site + ' · ' + s.Nama_Site;
      siteEl.appendChild(o);
    });
  }

  function fillDateRange() {
    const rows = Data.table('jamKerja');
    if (!rows.length) return;
    let min = rows[0].Tanggal, max = rows[0].Tanggal;
    rows.forEach(r => {
      if (r.Tanggal < min) min = r.Tanggal;
      if (r.Tanggal > max) max = r.Tanggal;
    });
    fromEl.min = toEl.min = (min || '').slice(0, 7);
    fromEl.max = toEl.max = (max || '').slice(0, 7);
  }

  function applyFilters() {
    Filters.set({
      site: siteEl.value,
      from: fromEl.value,
      to: toEl.value
    });
    const current = (location.hash || '#ringkasan').replace('#', '') || 'ringkasan';
    renderPage(current);
  }

  siteEl.addEventListener('change', applyFilters);
  fromEl.addEventListener('change', applyFilters);
  toEl.addEventListener('change', applyFilters);
  document.getElementById('f-reset').addEventListener('click', () => {
    siteEl.value = 'all';
    fromEl.value = '';
    toEl.value = '';
    applyFilters();
  });

  // Filters should not re-trigger page render via Filters.onchange when set() is called by app code.
  // UI events call applyFilters directly, so keep onchange empty unless needed.
  Filters.onchange = null;

  document.getElementById('nav').addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-item');
    if (btn) navTo(btn.dataset.page);
  });

  document.getElementById('btn-refresh').addEventListener('click', init);

  function renderCurrent() {
    fillSiteOptions();
    fillDateRange();
    const initial = (location.hash || '#ringkasan').replace('#', '');
    navTo(initial);
  }

  async function init() {
    setStatus('<span class="spinner"></span> Memuat data...');
    renderCurrent();
    await Data.loadAll((done, total) => {
      lastUpdEl.textContent = 'Memuat ' + done + '/' + total + ' sumber...';
      setStatus('<span class="spinner"></span> Memuat ' + done + '/' + total + ' sumber...');
      renderCurrent();
    });
    const okCount = Object.keys(Data.store).filter(k => k[0] !== '_' && Data.store[k].ok).length;
    const total = Object.keys(Data.sources).length;
    lastUpdEl.textContent = 'Diperbarui: ' + new Date().toLocaleTimeString('id-ID');
    if (okCount === total) {
      setStatus('<span class="ok-dot"></span> ' + okCount + '/' + total + ' sumber data aktif', 'ok');
    } else {
      const missing = Object.keys(Data.sources).filter(k => !Data.store[k].ok).map(k => Data.sources[k].label);
      setStatus('<span class="err-dot"></span>' + okCount + '/' + total + ' dimuat. Gagal: ' + missing.join(', '), 'err');
    }
    renderCurrent();
  }

  init();
})();
