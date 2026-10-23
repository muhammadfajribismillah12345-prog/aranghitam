/* =============================================================================
   KONFIGURASI SITUS — Arang Batok Kelapa Lampung
   -----------------------------------------------------------------------------
   Cukup edit file ini untuk mengganti data bisnis (kontak, spesifikasi, syarat
   dagang, pelabuhan). Teks tampilan 5 bahasa ada di assets/js/i18n/*.js.
   Nilai bertanda "CONTOH" adalah placeholder — WAJIB diganti sebelum live.
   ============================================================================= */
window.SITE = {
  // true = tampilkan pita "Demo" di atas halaman. Ubah ke false saat situs live.
  demoMode: true,

  company: {
    name: "Arang Batok Kelapa Lampung",
    legalName: "",                        // CONTOH: "CV Arang Batok Kelapa Lampung" (tampil di footer & spec sheet)
    established: "",                      // CONTOH: "2018" — kosong = disembunyikan
    nib: "",                              // Nomor Induk Berusaha (opsional, menambah kepercayaan buyer)
    address: "Bandar Lampung, Lampung, Indonesia",   // CONTOH: alamat lengkap pabrik/gudang
    mapsQuery: "Bandar Lampung, Lampung, Indonesia", // teks pencarian Google Maps
    email: "export@example.com",          // CONTOH — ganti email bisnis asli
    whatsapp: "",                         // hanya angka + kode negara, CONTOH: "6281234567890"
    phone: "",                            // tampilan telepon, CONTOH: "+62 812-3456-7890"
    website: "https://muhammadfajribismillah12345-prog.github.io/aranghitam", // alamat situs (SEO, og:url, QR spec sheet) — ganti ke https://aranghitam.github.io saat organisasi sudah jadi
    social: { instagram: "", linkedin: "", youtube: "", facebook: "", tiktok: "" },
    coords: { lat: -5.45, lon: 105.27 }   // titik asal di globe pengiriman (Bandar Lampung)
  },

  // Jam kantor (dipakai untuk status "Online", jam lokal & penjadwal video call)
  office: {
    timeZone: "Asia/Jakarta",
    utcOffset: 7,
    days: [1, 2, 3, 4, 5, 6],             // 0 = Minggu, 1 = Senin, ... 6 = Sabtu
    open: "08:00",
    close: "17:00",
    breakTime: ["12:00", "13:00"],        // istirahat/sholat — tidak ditawarkan untuk video call
    replyHours: 2                         // janji balasan saat jam kantor (jam)
  },

  // Angka perusahaan — kosongkan jika belum pasti, otomatis disembunyikan
  stats: {
    capacityMt: "",                       // kapasitas produksi per bulan (MT), CONTOH: "150"
    countries: "",                        // jumlah negara tujuan ekspor, CONTOH: "12"
    years: "",                            // pengalaman (tahun), CONTOH: "8"
    containers: ""                        // kontainer terkirim per tahun, CONTOH: "60"
  },

  trade: {
    moqContainers: 1,
    moqType: "20ft",
    moqKg: 18000,
    trialMt: 5,                           // order percobaan minimal (MT); 0 = sembunyikan
    leadWeeks: [2, 4],                    // waktu produksi setelah DP
    privateLabelWeeks: [1, 2],            // tambahan waktu untuk cetak kemasan custom
    sampleKg: [1, 3],
    sampleDays: [3, 5],
    depositPct: 30,
    incoterms: ["FOB", "CFR", "CIF", "EXW"],
    loadingPorts: [
      { name: "Panjang Port, Bandar Lampung", code: "IDPNJ" },
      { name: "Tanjung Priok, Jakarta", code: "IDTPP" }
    ],
    hsCode: "4402.20"
  },

  // Opsional: endpoint form agar RFQ juga masuk ke email tanpa server sendiri.
  //   Formspree : formEndpoint "https://formspree.io/f/abcdwxyz", formAccessKey ""
  //   Web3Forms : formEndpoint "https://api.web3forms.com/submit", formAccessKey "<access key Anda>"
  formEndpoint: "",
  formAccessKey: "",

  // Opsional: analitik tanpa cookie (Plausible) atau Google Analytics 4
  analytics: { plausibleDomain: "", gaMeasurementId: "" },

  // Opsional: tautan dokumen PDF (company profile, MSDS, contoh COA)
  links: { companyProfile: "", msds: "", coa: "" },

  // Jenis kemasan. type: inner (box dalam + master), bulk, carton, bag, jumbo
  packaging: {
    box1x10: { type: "inner", innerKg: 1, count: 10 },
    box1x20: { type: "inner", innerKg: 1, count: 20 },
    bulk10:  { type: "bulk", kg: 10 },
    bulk20:  { type: "bulk", kg: 20 },
    carton10:{ type: "carton", kg: 10 },
    bag25:   { type: "bag", kg: 25 },
    bag50:   { type: "bag", kg: 50 },
    jumbo:   { type: "jumbo", kg: 1000 }
  },

  /* Produk. Nilai spesifikasi = nilai TIPIKAL industri — sesuaikan dengan hasil
     uji lab produksi Anda. Nilai yang diawali "@" diambil dari kamus bahasa. */
  products: [
    {
      id: "shisha",
      shape: "cube",
      image: "",                          // opsional: "assets/img/products/shisha.jpg" (menggantikan ilustrasi)
      featured: true,                     // dipakai untuk meter kualitas & hero
      variants: [
        { id: "c25", kind: "cube", size: "25 mm", dims: "25 × 25 × 25 mm", pcsPerKg: 72 },
        { id: "c26", kind: "cube", size: "26 mm", dims: "26 × 26 × 26 mm", pcsPerKg: 64, default: true },
        { id: "c27", kind: "cube", size: "27 mm", dims: "27 × 27 × 27 mm", pcsPerKg: 56 },
        { id: "f25", kind: "flat", size: "25 mm", dims: "25 × 25 × 17 mm", pcsPerKg: 106 }
      ],
      specs: {
        moisture: "≤ 6%",
        ash: "≤ 2.0%",
        ashColor: "@val.ashWhite",
        fixedCarbon: "≥ 75%",
        volatile: "12 – 15%",
        calorific: "≥ 7,000 kcal/kg",
        burnTime: "2.5 – 3 h",
        smell: "@val.none",
        binder: "@val.tapioca"
      },
      packaging: ["box1x10", "box1x20", "bulk10", "bulk20"],
      loadKg: { "20ft": 18000, "40hc": 26000 }
    },
    {
      id: "bbq",
      shape: "hex",
      image: "",
      variants: [
        { id: "hex", kind: "hex", size: "Ø 45 mm", dims: "Ø 40–50 × 50–100 mm" },
        { id: "pillow", kind: "pillow", size: "50 mm", dims: "≈ 50 × 45 × 25 mm" }
      ],
      specs: {
        moisture: "≤ 8%",
        ash: "≤ 4%",
        ashColor: "@val.ashLight",
        fixedCarbon: "≥ 70%",
        volatile: "≤ 18%",
        calorific: "≥ 6,800 kcal/kg",
        burnTime: "4 – 6 h",
        smell: "@val.low",
        binder: "@val.tapioca"
      },
      packaging: ["carton10", "bulk20", "bag25"],
      loadKg: { "20ft": 17000, "40hc": 26000 }
    },
    {
      id: "raw",
      shape: "lump",
      image: "",
      variants: [
        { id: "lump", kind: "lump", size: "10–50 mm", dims: "10 – 50 mm" },
        { id: "granule", kind: "granule", size: "3–10 mm", dims: "3 – 10 mm" },
        { id: "powder", kind: "powder", size: "60–80 mesh", dims: "60 – 80 mesh" }
      ],
      specs: {
        moisture: "≤ 10%",
        ash: "≤ 3%",
        fixedCarbon: "≥ 78%",
        volatile: "≤ 15%",
        calorific: "≥ 7,000 kcal/kg",
        binder: "@val.noBinder"
      },
      packaging: ["bag25", "bag50", "jumbo"],
      loadKg: { "20ft": 12000, "40hc": 25000 }
    }
  ],

  /* Pelabuhan tujuan untuk globe & estimasi waktu kirim (hari, port-to-port,
     termasuk transshipment). Angka indikatif — sesuaikan dengan forwarder Anda. */
  ports: [
    { id: "jebelali",     name: "Jebel Ali (Dubai)",        cc: "AE", lat: 25.01,  lon: 55.06,   days: [14, 20], region: "me" },
    { id: "jeddah",       name: "Jeddah",                   cc: "SA", lat: 21.46,  lon: 39.17,   days: [16, 24], region: "me" },
    { id: "dammam",       name: "Dammam",                   cc: "SA", lat: 26.50,  lon: 50.20,   days: [16, 24], region: "me" },
    { id: "ummqasr",      name: "Umm Qasr",                 cc: "IQ", lat: 30.03,  lon: 47.95,   days: [20, 30], region: "me" },
    { id: "aqaba",        name: "Aqaba",                    cc: "JO", lat: 29.52,  lon: 35.00,   days: [20, 30], region: "me" },
    { id: "beirut",       name: "Beirut",                   cc: "LB", lat: 33.90,  lon: 35.52,   days: [24, 35], region: "me" },
    { id: "alexandria",   name: "Alexandria",               cc: "EG", lat: 31.18,  lon: 29.87,   days: [22, 32], region: "me" },
    { id: "mersin",       name: "Mersin",                   cc: "TR", lat: 36.79,  lon: 34.63,   days: [24, 35], region: "eu" },
    { id: "istanbul",     name: "Istanbul (Ambarlı)",       cc: "TR", lat: 40.97,  lon: 28.69,   days: [26, 38], region: "eu" },
    { id: "rotterdam",    name: "Rotterdam",                cc: "NL", lat: 51.95,  lon: 4.14,    days: [30, 45], region: "eu" },
    { id: "hamburg",      name: "Hamburg",                  cc: "DE", lat: 53.54,  lon: 9.97,    days: [32, 45], region: "eu" },
    { id: "novorossiysk", name: "Novorossiysk",             cc: "RU", lat: 44.72,  lon: 37.78,   days: [32, 45], region: "eu" },
    { id: "stpetersburg", name: "St. Petersburg",           cc: "RU", lat: 59.88,  lon: 30.21,   days: [35, 50], region: "eu" },
    { id: "newyork",      name: "New York / New Jersey",    cc: "US", lat: 40.67,  lon: -74.05,  days: [35, 45], region: "am" },
    { id: "losangeles",   name: "Los Angeles / Long Beach", cc: "US", lat: 33.74,  lon: -118.26, days: [22, 32], region: "am" },
    { id: "santos",       name: "Santos",                   cc: "BR", lat: -23.98, lon: -46.30,  days: [35, 45], region: "am" },
    { id: "sydney",       name: "Sydney",                   cc: "AU", lat: -33.96, lon: 151.21,  days: [14, 22], region: "ap" },
    { id: "busan",        name: "Busan",                    cc: "KR", lat: 35.10,  lon: 129.04,  days: [12, 18], region: "ap" },
    { id: "tokyo",        name: "Tokyo / Yokohama",         cc: "JP", lat: 35.44,  lon: 139.64,  days: [12, 18], region: "ap" },
    { id: "shanghai",     name: "Shanghai",                 cc: "CN", lat: 31.23,  lon: 121.47,  days: [10, 16], region: "ap" },
    { id: "portklang",    name: "Port Klang",               cc: "MY", lat: 3.00,   lon: 101.39,  days: [4, 8],   region: "ap" },
    { id: "nhavasheva",   name: "Nhava Sheva (Mumbai)",     cc: "IN", lat: 18.95,  lon: 72.95,   days: [12, 20], region: "ap" }
  ],

  languages: [
    { code: "en", name: "English", dir: "ltr" },
    { code: "ar", name: "العربية", dir: "rtl" },
    { code: "zh", name: "中文", dir: "ltr" },
    { code: "ru", name: "Русский", dir: "ltr" },
    { code: "id", name: "Bahasa Indonesia", dir: "ltr" }
  ]
};
