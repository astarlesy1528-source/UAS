const DATA_SOURCES = {
  audit: {
    label: 'Audit K3',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRqzjWr6Nrm2DHpviXL2Gcy2QWZzu5oLWztdmdMRHxmi-YZGoL4QsIMepRaKc1qdMKc9H9ld3Ecj6lA/pub?gid=183060288&single=true&output=csv'
  },
  energi: {
    label: 'Energi Tinggi',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTHOhts7bosOEHI6juHUS1BFomL67ZCxHza2iX2SYJWOsgC-oN9H0gwEnK7JpGZqG7rbNvnLaZqhU_o/pub?gid=408478852&single=true&output=csv'
  },
  hampirCelaka: {
    label: 'Hampir Celaka',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT3YMDav5npjA5csk_0HdiW2GiD4HRVetzVC07eWZGzJE_hvjqLBnRTRN4hvfTAt0SrgZ_2f0FGIDdp/pub?gid=199718943&single=true&output=csv'
  },
  hentiKerja: {
    label: 'Henti Kerja',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTT8qpGeCnKjietesOeIHl1r6gxtmC76a0hq9gCzUplIhCgpDNuueG7it1xJgOmUvew_51gpf2Gl33K/pub?gid=55743859&single=true&output=csv'
  },
  izinKerja: {
    label: 'Izin Kerja',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRIwOus0xaoV2eblZV2fTtDW2Hh4LEdq2MIb_vcTLZ6tUPLk47NB1f1KRSQZ6Gty7M9Cw4yLFG27BGH/pub?gid=1736113937&single=true&output=csv'
  },
  jamKerja: {
    label: 'Jam Kerja',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT7EXiCimGP6ey1Wzbd2U_pEzToCgBszQkh3pg2Ela-_duH0lU6DQP1F1eNpj67BzG0VNFaf8sPMaM8/pub?gid=1128329291&single=true&output=csv'
  },
  karyawan: {
    label: 'Karyawan',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT_H_kyNLHPz0a50g7iy_zCRD694FHZ6V8h_lSclK1ckZ7T_BcB82uSjkSsKDZBg7TDAWsdAHH367Iv/pub?gid=1803747879&single=true&output=csv'
  },
  kecelakaan: {
    label: 'Kecelakaan',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTjGzS6j0OxHnJANS-glOCbnVL-puOjKbdkBTBF3oWCoAl6jD1L9Tt15Tod0pvb0NAcX1TdEw0IWvll/pub?gid=828144911&single=true&output=csv'
  },
  kunjunganLapangan: {
    label: 'Kunjungan Lapangan',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS10jKL1CzGzalQHFa1vWLt6jZU5Xq-QrM5V6k_Tw4upp-oziKPKj95PYRQsDiNbg77Fr1obB4BsxOZ/pub?gid=813410623&single=true&output=csv'
  },
  observasiEnergiTinggi: {
    label: 'Observasi Energi Tinggi',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTlUgRiVquQrWGRzamzxX37o51qOVkR6G0Q72m_vhwt7eoh03QmIJv_V1JIWvtdZvRcF_sKE5cmQSnc/pub?gid=664280523&single=true&output=csv'
  },
  observasi: {
    label: 'Observasi',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS7kD0PP7bT2Sc8Beq5cdrdIIBLoxOALksVEWr3sQqpINgWgz7Ll2-Cpj8-2LyIeWCWawkBEk9GYc1U/pub?gid=1120599747&single=true&output=csv'
  },
  pelatihan: {
    label: 'Pelatihan',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2_7w-fHSHFpeTz0-U_fZWSaRrRagSzhyoUb4PWtuLlVt7mfSpTGIBwRA2S1TNFTr9qoMAXolxwWpz/pub?gid=1861520997&single=true&output=csv'
  },
  program: {
    label: 'Program',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT9cZpDKTkvrCqlHcuGHL4BKTNBGDJGk5Xik4--JcrgQiPAJ8pXjPX_OjWuP9DCnbvfRt676GBFreNr/pub?gid=1149741201&single=true&output=csv'
  },
  safetyTalk: {
    label: 'Safety Talk',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRyI11bpcUU5YVjkUWqVyr2a7gjfHn1xL-2tK6GZPORn8WYHIB5J2KjhdcICNqJ6C8Cn_RpAC0xU9PX/pub?gid=1505806495&single=true&output=csv'
  },
  site: {
    label: 'Site',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRBGaogOrLpkUYvxcEWmb7WsP27wxgREKJvwMYmUJeo2m-vclhYZKTGl8tQyd8kuDKhk3wma45I_BEV/pub?gid=1374502062&single=true&output=csv'
  },
  surveiIklimK3: {
    label: 'Survei Iklim K3',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTgEXQqAMYqpM1MdPAjV7nLUJnK8lCMVoTnveqEBxIvlMceyp5uSL8QAAr7dSZSiHGwsew7QIUbkVTs/pub?gid=1111239186&single=true&output=csv'
  },
  tindakan: {
    label: 'Tindakan',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTvT0tuP_JvMXeeqpzWD6OLA7ANLexqx9WzD5gNXQJQOT7zofi6TvBwJHg4jKEXsRKynqjmFT9oKMlG/pub?gid=2020128715&single=true&output=csv'
  }
};