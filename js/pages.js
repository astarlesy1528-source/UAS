const Pages = (() => {
  const UI = window.UI, D = Data;
  const { esc, kpi, card, sectionTitle, placeholder, table, badgeState } = UI;
  const isTrue = v => String(v).toLowerCase() === 'true';

  function monthCount(key, dateField) { return D.fGroupByMonth(key, dateField); }
  function monthTotal(key, dateField, sumField) { return D.fSumByMonth(key, dateField, sumField); }
  function m2(ym) {
    if (!ym || !String(ym).includes('-')) return ym;
    const [y, m] = String(ym).split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleString('id-ID', { month: 'short' }) + ' ' + y;
  }
  function workforceSnapshot() {
    const rows = D.fTable('jamKerja');
    if (!rows.length) return 0;
    const maxDate = rows.reduce((mx, r) => (r.Tanggal || '') > mx ? r.Tanggal : mx, '');
    return rows.filter(r => r.Tanggal === maxDate).reduce((a, r) => a + D.num(r.Jml_Pekerja), 0);
  }
  function monthlyRates() {
    const kec = D.fTable('kecelakaan');
    const jk = D.fTable('jamKerja');
    const hoursMap = new Map();
    jk.forEach(r => {
      const ym = D.normalizeDate(r.Tanggal);
      hoursMap.set(ym, (hoursMap.get(ym) || 0) + D.num(r.Total_Jam));
    });
    const recMap = new Map(), ltiMap = new Map();
    kec.forEach(r => {
      const ym = D.normalizeDate(r.Tanggal);
      if (!ym) return;
      if (isTrue(r.Termasuk_TRIR)) recMap.set(ym, (recMap.get(ym) || 0) + 1);
      if (String(r.Jenis).toLowerCase().includes('lost time')) ltiMap.set(ym, (ltiMap.get(ym) || 0) + 1);
    });
    const months = [...new Set([...hoursMap.keys(), ...recMap.keys(), ...ltiMap.keys()])].sort();
    return {
      labels: months.map(m2),
      trir: months.map(m => hoursMap.get(m) ? ((recMap.get(m) || 0) * 1000000) / hoursMap.get(m) : 0),
      ltifr: months.map(m => hoursMap.get(m) ? ((ltiMap.get(m) || 0) * 1000000) / hoursMap.get(m) : 0)
    };
  }
  function overallRates() {
    const kec = D.fTable('kecelakaan');
    const rec = kec.filter(r => isTrue(r.Termasuk_TRIR)).length;
    const lti = kec.filter(r => String(r.Jenis).toLowerCase().includes('lost time')).length;
    const hours = D.fSumRows('jamKerja', 'Total_Jam');
    return {
      rec, lti, hours,
      trir: hours ? (rec * 1000000) / hours : 0,
      ltifr: hours ? (lti * 1000000) / hours : 0
    };
  }
  const fmtRate = v => (Number(v) || 0).toFixed(2);

  // ============================ PAGE 1 · RINGKASAN ============================
  function ringkasan() {
    let out = '';
    const totalJam = D.fSumRows('jamKerja', 'Total_Jam');
    const totalPekerja = workforceSnapshot();
    const kec = D.fTable('kecelakaan');
    const trirN = kec.filter(r => isTrue(r.Termasuk_TRIR)).length;
    const hc = D.fTable('hampirCelaka');
    const henti = D.fTable('hentiKerja');
    const durasiHenti = henti.reduce((a, r) => a + D.num(r.Durasi_Jam), 0);
    const izin = D.fTable('izinKerja');
    const izinV = izin.filter(r => r.Kontrol_Terverifikasi === 'Terverifikasi').length;
    const auditRows = D.fTable('audit');
    const auditAvg = auditRows.length ? (auditRows.reduce((a, r) => a + D.num(r.Skor), 0) / auditRows.length) : 0;
    const tind = D.fTable('tindakan');
    const terlambat = tind.filter(r => String(r.Status).toLowerCase().includes('terlambat')).length;
    const rates = overallRates();

    out += `<div class="grid kpis">
      ${kpi('Total Pekerja', D.fmt(totalPekerja), 'snapshot dari jam kerja', 'success')}
      ${kpi('Total Jam Kerja', D.fmt(totalJam), 'seluruh site')}
      ${kpi('Kecelakaan', D.fmt(kec.length), `${D.fmt(trirN)} kasus TRIR`, 'danger')}
      ${kpi('Hampir Celaka', D.fmt(hc.length), 'kejadian terlaporkan', 'warning')}
      ${kpi('TRIR', fmtRate(rates.trir), 'per 1.000.000 jam kerja', 'danger')}
      ${kpi('LTIFR', fmtRate(rates.ltifr), 'per 1.000.000 jam kerja', 'warning')}
      ${kpi('Henti Kerja', D.fmt(henti.length), `${D.fmt(durasiHenti)} jam`)}
      ${kpi('Izin Kerja', D.fmt(izin.length), `${D.percent(izinV, izin.length)}% terverifikasi`)}
    </div>`;

    out += `<div class="section">${sectionTitle('Tren &amp; Analisis')}<div class="grid span2">`;
    out += card('Kecelakaan per Bulan', 'Distribusi insiden berdasarkan tanggal', `<div class="chart-box"><canvas id="ch-r-kec"></canvas></div>`);
    out += card('Hampir Celaka per Energi', 'Berdasarkan jenis energi (hampir SIF)', `<div class="chart-box"><canvas id="ch-r-hc"></canvas></div>`);
    out += `</div><div class="grid span2" style="margin-top:16px">`;
    out += card('TRIR &amp; LTIFR per Bulan', 'Frekuensi kecelakaan per 1.000.000 jam kerja', `<div class="chart-box sm"><canvas id="ch-r-rate"></canvas></div>`);
    out += card('Total Jam Kerja per Bulan', 'Akumulasi seluruh site', `<div class="chart-box sm"><canvas id="ch-r-jam"></canvas></div>`);
    out += `</div></div>`;

    const mKec = monthCount('kecelakaan', 'Tanggal');
    UI.bar('ch-r-kec', mKec.map(x => m2(x[0])), mKec.map(x => x[1]));
    const hcByEnergi = D.fCountBy('hampirCelaka', 'Energi');
    UI.bar('ch-r-hc', hcByEnergi.map(x => x[0]), hcByEnergi.map(x => x[1]), { horizontal: true });
    const mRates = monthlyRates();
    UI.line('ch-r-rate', mRates.labels, [
      { label: 'TRIR', data: mRates.trir.map(v => +v.toFixed(2)), color: '#e0453e' },
      { label: 'LTIFR', data: mRates.ltifr.map(v => +v.toFixed(2)), color: '#f59e0b' }
    ]);
    const mJam = monthTotal('jamKerja', 'Tanggal', 'Total_Jam');
    UI.line('ch-r-jam', mJam.map(x => m2(x[0])), [{ label: 'Total Jam Kerja', data: mJam.map(x => x[1]) }]);
    return out;
  }

  // ============================ PAGE 2 · KECELAKAAN & INSIDEN ============================
  function kecelakaan() {
    let out = '';
    const kec = D.fTable('kecelakaan');
    const trir = kec.filter(r => isTrue(r.Termasuk_TRIR)).length;
    const lost = kec.reduce((a, r) => a + D.num(r.Jumlah_Hari_Hilang), 0);
    const hc = D.fTable('hampirCelaka');
    const hcSif = hc.filter(r => String(r.Potensi_SIF).toLowerCase().includes('sif')).length;
    const henti = D.fTable('hentiKerja');
    const durasiHenti = henti.reduce((a, r) => a + D.num(r.Durasi_Jam), 0);
    const rates = overallRates();

    out += `<div class="grid kpis">
      ${kpi('Total Kecelakaan', D.fmt(kec.length), 'semua jenis', 'danger')}
      ${kpi('Kasus TRIR', D.fmt(trir), `${D.percent(trir, kec.length)}% dari total`)}
      ${kpi('Hari Hilang', D.fmt(lost), 'akibat kecelakaan', 'warning')}
      ${kpi('TRIR', fmtRate(rates.trir), 'per 1.000.000 jam kerja')}
      ${kpi('LTIFR', fmtRate(rates.ltifr), 'per 1.000.000 jam kerja')}
      ${kpi('Hampir Celaka', D.fmt(hc.length), `${D.fmt(hcSif)} berpotensi SIF`, 'warning')}
      ${kpi('Henti Kerja', D.fmt(henti.length), `${D.fmt(durasiHenti)} jam konsekuensi`)}
    </div>`;

    out += `<div class="section">${card('Kecelakaan', 'Distribusi insiden kecelakaan')}<div class="grid span3" style="margin-top:14px">`;
    out += card('Per Jenis', '', `<div class="chart-box"><canvas id="ch-k-jenis"></canvas></div>`);
    out += card('Per Bulan', '', `<div class="chart-box"><canvas id="ch-k-bulan"></canvas></div>`);
    out += card('Status TRIR', '', `<div class="chart-box sm"><canvas id="ch-k-trir"></canvas></div>`);
    out += `</div></div>`;

    const byJenis = D.fCountBy('kecelakaan', 'Jenis');
    const byBulan = monthCount('kecelakaan', 'Tanggal');
    UI.bar('ch-k-jenis', byJenis.map(x => x[0]), byJenis.map(x => x[1]), { horizontal: true });
    UI.bar('ch-k-bulan', byBulan.map(x => m2(x[0])), byBulan.map(x => x[1]));
    UI.doughnut('ch-k-trir', ['TRIR', 'Non-TRIR'], [trir, Math.max(kec.length - trir, 0)]);

    out += `<div class="grid span2" style="margin-top:16px">`;
    out += card('Hampir Celaka per Energi', '', `<div class="chart-box"><canvas id="ch-k-hc"></canvas></div>`);
    out += card('Henti Kerja per Alasan', '', `<div class="chart-box"><canvas id="ch-k-henti"></canvas></div>`);
    out += `</div>`;

    const hcEnergi = D.fCountBy('hampirCelaka', 'Energi');
    UI.doughnut('ch-k-hc', hcEnergi.map(x => x[0]), hcEnergi.map(x => x[1]));
    const heAlasan = D.fCountBy('hentiKerja', 'Alasan');
    UI.bar('ch-k-henti', heAlasan.map(x => x[0]), heAlasan.map(x => x[1]));

    const cols = [
      { head: 'ID', cell: r => `<b>${esc(r.ID_Kecelakaan)}</b>` },
      { head: 'Site', cell: r => esc(r.ID_Site) },
      { head: 'Tanggal', cell: r => esc(r.Tanggal) },
      { head: 'Jenis', cell: r => esc(r.Jenis) },
      { head: 'Hari Hilang', cell: r => `<span class="num">${D.num(r['Jumlah_Hari_Hilang'])}</span>` },
      { head: 'TRIR', cell: r => isTrue(r.Termasuk_TRIR) ? '<span class="badge red">Ya</span>' : '<span class="badge gray">Tidak</span>' },
      { head: 'Deskripsi', cell: r => esc(r.Deskripsi) }
    ];
    out += `<div class="section">${card('Detail Kecelakaan', 'Data terbaru', table(cols, kec.slice(0, 20), 'Belum ada data kecelakaan.'))}</div>`;
    return out;
  }

  // ============================ PAGE 3 · IZIN & JAM KERJA ============================
  function kerja() {
    let out = '';
    const izin = D.fTable('izinKerja');
    const izinV = izin.filter(r => r.Kontrol_Terverifikasi === 'Terverifikasi').length;
    const jsaAvg = izin.length ? (izin.reduce((a, r) => a + D.num(r['Skor_Kualitas_JSA']), 0) / izin.length) : 0;
    const totalJam = D.fSumRows('jamKerja', 'Total_Jam');
    const totalLembur = D.fSumRows('jamKerja', 'Jam_Lembur');

    out += `<div class="grid kpis">
      ${kpi('Total Izin Kerja', D.fmt(izin.length), 'jenis pekerjaan berisiko')}
      ${kpi('Rata-rata Skor JSA', D.fmt(jsaAvg.toFixed(1)), 'analisis keselamatan kerja')}
      ${kpi('Kontrol Terverifikasi', `${D.percent(izinV, izin.length)}%`, `${D.fmt(izinV)} dari ${D.fmt(izin.length)}`)}
      ${kpi('Total Jam Kerja', D.fmt(totalJam), `${D.fmt(totalLembur)} jam lembur`)}
    </div>`;

    out += `<div class="section">${sectionTitle('Izin Kerja')}<div class="grid span2">`;
    out += card('Izin Kerja per Jenis Pekerjaan', '', `<div class="chart-box"><canvas id="ch-iz-jenis"></canvas></div>`);
    out += card('Status Kontrol', '', `<div class="chart-box sm"><canvas id="ch-iz-status"></canvas></div>`);
    out += `</div><div class="grid span2">`;
    out += card('Skor JSA per Izin', '10 izin dengan skor tertinggi', `<div class="chart-box sm"><canvas id="ch-iz-jsa"></canvas></div>`);
    out += card('Jam Kerja per Site', 'Total jam kerja keseluruhan', `<div class="chart-box sm"><canvas id="ch-jk-site"></canvas></div>`);
    out += `</div>`;

    const byJenis = D.fCountBy('izinKerja', 'Jenis_Pekerjaan');
    const jsaSorted = izin.slice().sort((a, b) => D.num(b['Skor_Kualitas_JSA']) - D.num(a['Skor_Kualitas_JSA'])).slice(0, 10);
    UI.bar('ch-iz-jenis', byJenis.map(x => x[0]), byJenis.map(x => x[1]), { horizontal: true });
    const statusIz = D.fCountBy('izinKerja', 'Kontrol_Terverifikasi');
    UI.doughnut('ch-iz-status', statusIz.map(x => x[0]), statusIz.map(x => x[1]));
    UI.bar('ch-iz-jsa', jsaSorted.map(r => r.ID_Izin), jsaSorted.map(r => D.num(r['Skor_Kualitas_JSA'])));
    const jamSite = D.fSumBy('jamKerja', 'ID_Site', 'Total_Jam');
    UI.bar('ch-jk-site', jamSite.map(x => x[0]), jamSite.map(x => x[1]));

    out += `<div class="section">${card('Jam Kerja per Bulan', 'Akumulasi total jam kerja', `<div class="chart-box"><canvas id="ch-jk-bulan"></canvas></div>`)}</div>`;
    const mJam = monthTotal('jamKerja', 'Tanggal', 'Total_Jam');
    UI.line('ch-jk-bulan', mJam.map(x => m2(x[0])), [{ label: 'Total Jam', data: mJam.map(x => x[1]) }]);

    const iCols = [
      { head: 'ID', cell: r => `<b>${esc(r.ID_Izin)}</b>` },
      { head: 'Site', cell: r => esc(r.ID_Site) },
      { head: 'Tanggal', cell: r => esc(r.Tanggal) },
      { head: 'Jenis Pekerjaan', cell: r => esc(r.Jenis_Pekerjaan) },
      { head: 'Skor JSA', cell: r => `<span class="num">${D.num(r['Skor_Kualitas_JSA'])}</span>` },
      { head: 'Kontrol', cell: r => r.Kontrol_Terverifikasi === 'Terverifikasi' ? '<span class="badge green">Terverifikasi</span>' : '<span class="badge amber">Belum</span>' },
      { head: 'Petugas', cell: r => esc(r.Petugas) }
    ];
    out += `<div class="section">${card('Daftar Izin Kerja', 'Data terbaru', table(iCols, izin.slice(0, 15), 'Belum ada data izin kerja.'))}</div>`;
    return out;
  }

  // ============================ PAGE 4 · OBSERVASI & PROGRAM ============================
  function observasi() {
    let out = '';
    const aud = D.fTable('audit');
    const oet = D.fTable('observasiEnergiTinggi');
    const oetV = oet.filter(r => r.Kontrol_Terverifikasi === 'Terverifikasi').length;
    const kl = D.fTable('kunjunganLapangan');
    const klTemuan = kl.reduce((a, r) => a + D.num(r.Jml_Temuan), 0);
    const st = D.fTable('safetyTalk');
    const stPeserta = st.reduce((a, r) => a + D.num(r.Jml_Peserta), 0);
    const pel = D.fTable('pelatihan');
    const pelPeserta = pel.reduce((a, r) => a + D.num(r.Jml_Peserta), 0);
    const pelLulus = pel.reduce((a, r) => a + D.num(r.Jml_Lulus), 0);
    const pro = D.table('program');
    const audAvg = aud.length ? (aud.reduce((a, r) => a + D.num(r.Skor), 0) / aud.length) : 0;
    const observasiOk = D.ok('observasi');
    const observRows = D.fTable('observasi');

    out += `<div class="grid kpis">
      ${kpi('Rata-rata Skor Audit', D.fmt(audAvg.toFixed(1)), `${D.fmt(aud.length)} audit`)}
      ${kpi('Observasi Energi', D.fmt(oet.length), `${D.percent(oetV, oet.length)}% kontrol terverifikasi`, 'warning')}
      ${kpi('Kunjungan Lapangan', D.fmt(kl.length), `${D.fmt(klTemuan)} temuan`)}
      ${kpi('Safety Talk', D.fmt(st.length), `${D.fmt(stPeserta)} peserta`)}
      ${kpi('Pelatihan', D.fmt(pel.length), `${D.fmt(pelLulus)}/${D.fmt(pelPeserta)} lulus`)}
      ${kpi('Program Aktif', D.fmt(pro.length), 'program K3')}
    </div>`;

    out += `<div class="section">${sectionTitle('Observasi')}<div class="grid span2">`;
    if (observasiOk) {
      out += card('Observasi Keselamatan', 'Jumlah observasi yang dicatat', `<div class="chart-box sm"><canvas id="ch-ob-umum"></canvas></div>`);
    } else {
      out += card('Observasi Keselamatan', '', placeholder('Sumber data "Observasi" tidak dapat dimuat. Periksa link/gid sheet, lalu klik "Muat Ulang".', true));
    }
    out += card('Observasi Energi Tinggi per Energi', 'Penerapan kontrol energi berpotensi fatal', `<div class="chart-box"><canvas id="ch-ob-oet"></canvas></div>`);
    out += `</div><div class="grid span2" style="margin-top:16px">`;
    out += card('Skor Audit per Audit', 'Tren capaian skor audit', `<div class="chart-box sm"><canvas id="ch-ob-aud"></canvas></div>`);
    out += card('Kunjungan Lapangan per Pemimpin', '', `<div class="chart-box sm"><canvas id="ch-k-kl"></canvas></div>`);
    out += `</div></div>`;

    if (observasiOk && observRows.length) {
      const obPerKategori = D.fCountBy('observasi', 'Kategori_Temuan');
      UI.bar('ch-ob-umum', obPerKategori.map(x => x[0]), obPerKategori.map(x => x[1]), { horizontal: true });
    }
    const oetList = D.fCountBy('observasiEnergiTinggi', 'Energi');
    UI.bar('ch-ob-oet', oetList.map(x => x[0]), oetList.map(x => x[1]), { horizontal: true });
    const audSorted = aud.slice().sort((a, b) => (a.Tanggal || '').localeCompare(b.Tanggal || ''));
    UI.line('ch-ob-aud', audSorted.map(r => r.Tanggal), [{ label: 'Skor Audit', data: audSorted.map(r => D.num(r.Skor)) }]);
    const klList = D.fCountBy('kunjunganLapangan', 'Pemimpin');
    UI.bar('ch-k-kl', klList.map(x => x[0]), klList.map(x => x[1]));

    out += `<div class="section">${sectionTitle('Program &amp; Pelatihan')}<div class="grid span3" style="margin-top:0">`;
    out += card('Safety Talk per Tema', '', `<div class="chart-box"><canvas id="ch-ob-st"></canvas></div>`);
    out += card('Peserta Pelatihan per Jenis', 'Proporsi jenis pelatihan', `<div class="chart-box sm"><canvas id="ch-ob-pel"></canvas></div>`);
    out += card('Program K3', '', `<ul class="prog">${pro.map(p => `<li>${esc(p['Nama_Program'])} <span class="muted">(${esc(p.ID_Program)})</span></li>`).join('') || '<li class="muted">Tidak ada program.</li>'}</ul>`);
    out += `</div></div>`;

    const stTema = D.fCountBy('safetyTalk', 'Tema');
    UI.bar('ch-ob-st', stTema.map(x => x[0]), stTema.map(x => x[1]), { horizontal: true });
    const pelJenis = D.fCountBy('pelatihan', 'Jenis');
    UI.doughnut('ch-ob-pel', pelJenis.map(x => x[0]), pelJenis.map(x => x[1]));

    const klCols = [
      { head: 'ID', cell: r => `<b>${esc(r.ID_Kunjungan)}</b>` },
      { head: 'Site', cell: r => esc(r.ID_Site) },
      { head: 'Tanggal', cell: r => esc(r.Tanggal) },
      { head: 'Pemimpin', cell: r => esc(r.Pemimpin) },
      { head: 'Jabatan', cell: r => esc(r.Jabatan) },
      { head: 'Jumlah Temuan', cell: r => `<span class="num">${D.num(r.Jml_Temuan)}</span>` },
      { head: 'Tindak Lanjut', cell: r => esc(r['Ada_Tindak_Lanjut']) }
    ];
    out += `<div class="section">${card('Kunjungan Lapangan', 'Data terbaru', table(klCols, kl.slice(0, 15), 'Belum ada data kunjungan.'))}</div>`;
    return out;
  }

  // ============================ PAGE 5 · SDM & KEPATUHAN ============================
  function sdm() {
    let out = '';
    const kar = D.table('karyawan');
    const surv = D.fTable('surveiIklimK3');
    const tind = D.fTable('tindakan');
    const tTerlambat = tind.filter(r => String(r.Status).toLowerCase().includes('terlambat')).length;
    const tSelesai = tind.filter(r => String(r.Status).toLowerCase().includes('selesai')).length;
    const sif = tind.filter(r => String(r.Terkait_SIF).toLowerCase().includes('terkait')).length;

    out += `<div class="grid kpis">
      ${kpi('Total Karyawan', D.fmt(kar.length), 'terdaftar di master data')}
      ${kpi('Survei Iklim K3', D.fmt(surv.length), 'periode terisi', 'success')}
      ${kpi('Tindak Lanjut', D.fmt(tind.length), `${D.fmt(tSelesai)} selesai`)}
      ${kpi('Tindakan Terlambat', D.fmt(tTerlambat), `${D.fmt(sif)} terkait SIF`, 'danger')}
    </div>`;

    out += `<div class="section">${sectionTitle('Karyawan')}<div class="grid span2">`;
    out += card('Karyawan per Perusahaan', '', `<div class="chart-box sm"><canvas id="ch-sd-pt"></canvas></div>`);
    out += card('Karyawan per Jabatan', '', `<div class="chart-box sm"><canvas id="ch-sd-jab"></canvas></div>`);
    out += `</div></div>`;

    const byPt = D.countBy('karyawan', 'Perusahaan');
    const byJab = D.countBy('karyawan', 'Jabatan');
    UI.doughnut('ch-sd-pt', byPt.map(x => x[0]), byPt.map(x => x[1]));
    UI.bar('ch-sd-jab', byJab.map(x => x[0]), byJab.map(x => x[1]), { horizontal: true });

    out += `<div class="section">${sectionTitle('Survei Iklim K3')}<div>`;
    if (surv.length) {
      out += card('Skor Iklim K3 per Periode', '', `<div class="chart-box"><canvas id="ch-sd-surv"></canvas></div>`);
      const labels = surv.map(r => `${r.Kuartal} · ${r.ID_Site}`);
      UI.line('ch-sd-surv', labels, [
        { label: 'Budaya K3', data: surv.map(r => D.num(r['Skor_Budaya_K3'])), color: '#0e5fd8' },
        { label: 'Kepemimpinan', data: surv.map(r => D.num(r['Skor_Kepemimpinan'])), color: '#18a05e' },
        { label: 'Partisipasi', data: surv.map(r => D.num(r['Skor_Partisipasi'])), color: '#f59e0b' }
      ]);
    } else {
      out += card('Skor Iklim K3', '', placeholder('Belum ada data survei iklim K3.'));
    }
    out += `</div></div>`;

    out += `<div class="section">${sectionTitle('Tindak Lanjut')}<div class="grid span2">`;
    out += card('per Status', '', `<div class="chart-box sm"><canvas id="ch-sd-status"></canvas></div>`);
    out += card('per Prioritas', '', `<div class="chart-box sm"><canvas id="ch-sd-prio"></canvas></div>`);
    out += `</div></div>`;

    const st = D.fCountBy('tindakan', 'Status');
    const pr = D.fCountBy('tindakan', 'Prioritas');
    UI.doughnut('ch-sd-status', st.map(x => x[0]), st.map(x => x[1]));
    UI.doughnut('ch-sd-prio', pr.map(x => x[0]), pr.map(x => x[1]));

    const tCols = [
      { head: 'ID', cell: r => `<b>${esc(r.ID_Tindakan)}</b>` },
      { head: 'Site', cell: r => esc(r.ID_Site) },
      { head: 'Deskripsi', cell: r => esc(r.Deskripsi) },
      { head: 'Penanggung', cell: r => esc(r.Penanggung_Jawab) },
      { head: 'Jatuh Tempo', cell: r => esc(r.Jatuh_Tempo) },
      { head: 'Status', cell: r => `<span class="${badgeState(r.Status)}">${esc(r.Status)}</span>` },
      { head: 'SIF', cell: r => r.Terkait_SIF.includes('Terkait') ? '<span class="badge red">SIF</span>' : '<span class="badge gray">-</span>' },
      { head: 'Prioritas', cell: r => esc(r.Prioritas) }
    ];
    out += `<div class="section">${card('Daftar Tindak Lanjut', 'Data terbaru', table(tCols, tind.slice(0, 8), 'Belum ada tindakan.'))}</div>`;
    return out;
  }

  const api = { ringkasan, kecelakaan, kerja, observasi, sdm };
  return api;
})();
