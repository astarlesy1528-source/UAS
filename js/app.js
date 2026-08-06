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
    kerja:'kerja',
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
    UI.destroyAll();
    const section = document.getElementById('page-' + PAGES[page]);
    if (!section) return;
    section.innerHTML = Pages[PAGES[page]]();
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
  }

  document.getElementById('nav').addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-item');
    if (btn) navTo(btn.dataset.page);
  });

  document.getElementById('btn-refresh').addEventListener('click', init);

  async function init() {
    setStatus('<span class="spinner"></span> Memuat data...');
    await Data.loadAll();
    const okCount = Object.keys(Data.store).filter(k => k[0] !== '_' && Data.store[k].ok).length;
    const total = Object.keys(Data.sources).length;
    lastUpdEl.textContent = 'Diperbarui: ' + new Date().toLocaleTimeString('id-ID');
    if (okCount === total) {
      setStatus('<span class="ok-dot"></span> ' + okCount + '/' + total + ' sumber data aktif', 'ok');
    } else {
      const missing = Object.keys(Data.sources).filter(k => !Data.store[k].ok).map(k => Data.sources[k].label);
      setStatus('<span class="err-dot"></span>' + okCount + '/' + total + ' dimuat. Gagal: ' + missing.join(', '), 'err');
    }
    const initial = (location.hash || '#ringkasan').replace('#', '');
    navTo(initial);
  }

  init();
})();