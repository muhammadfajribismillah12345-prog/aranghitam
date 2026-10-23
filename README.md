# Arang Batok Kelapa Lampung — Website Ekspor Premium

Website resmi (statis, tanpa server) untuk eksportir arang batok kelapa dari Lampung, dirancang untuk
**buyer internasional**: importir, distributor, dan lounge shisha di Timur Tengah, Eropa, Rusia, Asia, dan Amerika.

Semua fitur berjalan di browser — cukup upload folder ini ke hosting mana pun.

---

## Fitur utama

| Fitur | Fungsi untuk buyer internasional |
|---|---|
| **5 bahasa** — English, العربية (RTL), 中文, Русский, Bahasa Indonesia | Deteksi otomatis dari bahasa browser; tautan `?lang=ar` dll. untuk dibagikan |
| **Katalog 3 lini produk** + dialog spesifikasi lengkap | Shisha (kubus/pipih), BBQ (heksagonal/bantal), arang mentah (bongkahan/granul/bubuk) |
| **Spec sheet PDF** (`spec-sheet.html`) | Lembar data teknis A4 per produk/ukuran/bahasa + QR WhatsApp, siap dicetak / disimpan PDF |
| **Meter kualitas + tabel perbandingan** | Kadar abu, kadar air, karbon terikat, nilai kalor, lama bakar |
| **Globe pengiriman interaktif** | Rute jalur laut dari Lampung ke 22 pelabuhan, estimasi transit & total waktu sampai |
| **Kalkulator kontainer** | Berat bersih, jumlah karton/inner box, perkiraan jumlah butir, isi 20ft/40ft HC |
| **Desainer private label 3D** | Buyer mengetik merek sendiri, pilih warna box → langsung masuk ke permintaan penawaran |
| **Keranjang penawaran + form RFQ** | Kirim via WhatsApp / email (pesan rapi berbahasa Inggris) atau langsung ke email lewat Formspree/Web3Forms |
| **Jam kantor & penjadwal video call** | Status "Online/Tutup", jam Lampung vs jam buyer, pilih slot di zona waktu buyer |
| **SEO internasional** | Meta per bahasa, hreflang, JSON-LD (Organization + FAQ), sitemap, robots, gambar Open Graph untuk WhatsApp/LinkedIn |
| **Ramah privasi & ringan** | Tanpa cookie, tanpa framework, peta Google dimuat hanya saat diklik |

---

## Struktur folder

```
index.html              Halaman utama (teks bahasa Inggris = sumber terjemahan)
spec-sheet.html         Lembar data teknis (print / PDF)
404.html                Halaman "tidak ditemukan"
site.webmanifest        Ikon & warna aplikasi
robots.txt, sitemap.xml SEO (ganti domain!)
_headers                Header keamanan & cache (Netlify / Cloudflare Pages)
assets/
  css/style.css         Desain utama          css/sheet.css   Desain spec sheet
  js/config.js          ★ DATA BISNIS — cukup edit file ini
  js/i18n/*.js          Kamus bahasa (en, ar, zh, ru, id)
  js/core.js            Mesin bahasa, format angka, ilustrasi produk
  js/app.js             Navigasi, produk, FAQ, form RFQ, jadwal video call
  js/hero.js            Animasi kubus arang 3D + bara api
  js/globe.js           Globe pengiriman
  js/tools.js           Kalkulator kontainer + desainer private label
  js/sheet.js           Logika spec sheet
  js/landmask.js        Data daratan dunia (Natural Earth, domain publik)
  img/                  Logo, favicon, ikon aplikasi, og-image.jpg
  img/products/         Taruh foto produk asli di sini
```

---

## 1. Mengganti data bisnis — `assets/js/config.js`

Buka dengan editor teks (Notepad++, VS Code). Yang **wajib** diganti sebelum live:

| Kolom | Contoh | Keterangan |
|---|---|---|
| `demoMode` | `false` | Matikan pita "DEMO" |
| `company.email` | `"export@namadomain.com"` | Email bisnis (sebaiknya domain sendiri) |
| `company.whatsapp` | `"6281234567890"` | Angka saja, kode negara tanpa `+`. Kosong = tombol WA membuka pilihan kontak (mode demo) |
| `company.phone` | `"+62 812-3456-7890"` | Tampilan nomor |
| `company.address`, `mapsQuery` | alamat pabrik/gudang | Dipakai di kontak & Google Maps |
| `company.website` | `"https://www.namadomain.com"` | Untuk canonical, hreflang, QR spec sheet |
| `company.legalName`, `nib`, `established` | `"CV …"`, NIB | Menambah kepercayaan buyer (tampil di footer & spec sheet) |
| `stats.*` | `"150"` | Kapasitas, negara tujuan, pengalaman — **kosong = disembunyikan** (jangan isi angka yang belum benar) |
| `office.*` | hari & jam kerja | Status online, jam, dan slot video call |
| `trade.*` | MOQ, lead time, DP, sampel, pelabuhan muat, HS code | Muncul di FAQ, syarat dagang, spec sheet |
| `products[].specs` | `"≤ 2.0%"` | **Nilai tipikal industri — sesuaikan dengan hasil uji lab produksi Anda** |
| `products[].loadKg` | `{ "20ft": 18000 }` | Kapasitas muat per kontainer |
| `ports[].days` | `[14, 20]` | Estimasi transit (hari) — cocokkan dengan forwarder Anda |

Alamat situs saat ini `https://muhammadfajribismillah12345-prog.github.io/aranghitam/` (terpasang di `config.js`, `index.html` — tag `canonical`, `og:url`, `og:image` — dan `sitemap.xml`). Saat pindah ke `https://aranghitam.github.io` atau domain sendiri, ganti alamat itu di ketiga file tersebut.

### Foto produk asli
Simpan foto (rasio 4:3, ±1200×900 px, JPG/WebP) di `assets/img/products/`, lalu isi `image` pada produk:
```js
image: "assets/img/products/shisha.jpg",
```
Ilustrasi otomatis akan diganti foto. Foto asli (produk, uji bakar, proses produksi, muat kontainer) **sangat meningkatkan kepercayaan buyer**.

---

## 2. Mengubah teks & terjemahan

- Teks bahasa Inggris statis ada langsung di `index.html` / `spec-sheet.html` (atribut `data-i18n="…"`).
- Teks dinamis (produk, FAQ, label) ada di `assets/js/i18n/en.js`.
- Terjemahan: `ar.js`, `zh.js`, `ru.js`, `id.js` — kunci (`"faq.1.q"`, dst.) harus sama dengan bahasa Inggris.
- Tanda `{moq}`, `{lead}`, `{deposit}` … diisi otomatis dari `config.js` — jangan dihapus.
- Bila sebuah kunci belum diterjemahkan, otomatis memakai bahasa Inggris.
- Pesan yang dikirim ke WhatsApp/email penjual selalu **berbahasa Inggris** agar tim ekspor mudah membacanya.

---

## 3. Formulir penawaran (RFQ)

Tanpa pengaturan apa pun, buyer mengirim penawaran lewat **WhatsApp** atau **email** (pesan terisi otomatis berisi produk, ukuran,
kemasan, jumlah kontainer, Incoterm, pelabuhan tujuan, data pembeli).

Agar juga masuk otomatis ke email tanpa membuka aplikasi:
- **Formspree** (gratis 50/bulan): buat form di formspree.io → `formEndpoint: "https://formspree.io/f/xxxx"`.
- **Web3Forms** (gratis): ambil access key di web3forms.com → `formEndpoint: "https://api.web3forms.com/submit"`, `formAccessKey: "…"`.

Tombol **Send inquiry** akan muncul otomatis bila `formEndpoint` diisi. Form sudah dilengkapi honeypot anti-spam.

---

## 4. Spec sheet PDF

`spec-sheet.html?p=shisha&v=c26&lang=ar` → produk shisha, kubus 26 mm, bahasa Arab.
Klik **Print / Save as PDF** → pilih *Save as PDF*, kertas A4, margin *None*, centang *Background graphics*.
Kirim PDF ini ke buyer via WhatsApp/email — QR code di dalamnya langsung membuka chat WhatsApp Anda.

---

## 5. Online-kan (hosting)

**Saat ini:** di-hosting gratis di **GitHub Pages** →
`https://muhammadfajribismillah12345-prog.github.io/aranghitam/`
(repository `muhammadfajribismillah12345-prog/aranghitam`, branch `main`).

**Rencana:** pindah ke subdomain `https://aranghitam.github.io` setelah organisasi GitHub
`aranghitam` dibuat (repository `aranghitam.github.io` di organisasi itu).

Cara memperbarui website setelah mengedit file (dari folder ini, di terminal):
```
git add -A
git commit -m "Perbarui data"
git push
```
Perubahan tampil online ±1 menit kemudian.

Selama masih pratinjau, situs sengaja disembunyikan dari Google (tag `noindex` di `index.html`,
plus `robots.txt` bila nanti di-hosting di root domain).
Saat resmi live: `demoMode: false`, hapus baris `<meta name="robots" …>` di `index.html`,
dan ganti isi `robots.txt` sesuai petunjuk di dalam file itu.

Alternatif lain (juga tanpa server atau database):

1. **Netlify** (paling mudah): app.netlify.com → *Add new site → Deploy manually* → seret folder ini. Lalu hubungkan domain.
2. **Cloudflare Pages / GitHub Pages**: upload isi folder ke repository, aktifkan Pages.
3. **Hosting cPanel** (Niagahoster, Rumahweb, dll.): upload semua isi folder ke `public_html` via File Manager.

Saran domain: `.com` (mis. `lampungcoconutcharcoal.com` / nama perusahaan). Aktifkan HTTPS (gratis di semua opsi di atas).

### Checklist sebelum live
- [ ] `demoMode: false`, email & WhatsApp asli, alamat, legal name/NIB
- [ ] Spesifikasi produk sesuai hasil lab, kapasitas & MOQ benar
- [ ] Hapus baris `<meta name="robots" content="noindex, nofollow">` di `index.html` dan ganti `robots.txt` ke versi "Allow" agar bisa ditemukan Google
- [ ] Saat pindah alamat (aranghitam.github.io / domain sendiri): ganti alamat situs di `index.html`, `sitemap.xml`, `robots.txt`, `config.js`
- [ ] Foto produk asli di `assets/img/products/`
- [ ] Uji kirim RFQ via WhatsApp & email
- [ ] Daftarkan di **Google Search Console** & **Bing Webmaster Tools**, kirim `sitemap.xml`
- [ ] Buat **Google Business Profile** (alamat pabrik) dan tautkan ke website
- [ ] Cek pratinjau tautan di WhatsApp/LinkedIn (gambar `og-image.jpg`)

---

## 6. Menjalankan secara lokal

Klik ganda `index.html` sudah cukup untuk melihat tampilan (font Google butuh internet).
Untuk pengujian yang identik dengan hosting, jalankan server lokal mana pun dari folder ini lalu buka `http://localhost:…`.

---

## Catatan penting

- Angka spesifikasi, kapasitas muat, dan waktu transit adalah **nilai tipikal/indikatif** sebagai contoh — wajib dikonfirmasi
  dengan produsen dan forwarder sebelum dipublikasikan.
- Website ini sengaja **tidak memuat testimoni atau sertifikat palsu**. Tambahkan hanya dokumen yang benar-benar dimiliki
  (hasil uji SGS/Sucofindo, sertifikat, foto kontainer) — itu yang paling meyakinkan buyer internasional.
- Data peta: Natural Earth (domain publik) via world-atlas. Font: Google Fonts (Fraunces, Manrope; Amiri/IBM Plex Sans Arabic,
  Noto Serif SC, Playfair Display dimuat hanya saat bahasa terkait dipilih).

## Tips menarik buyer internasional
1. Balas inquiry < 24 jam (status online di website memberi ekspektasi yang jelas).
2. Siapkan paket sampel siap kirim (1–3 kg) dan video uji bakar.
3. Pasang tautan website di profil Alibaba, LinkedIn perusahaan, dan WhatsApp Business (katalog).
4. Kirim spec sheet PDF dalam bahasa buyer — fitur ini sudah tersedia.
5. Tambahkan laporan uji lab terbaru (COA) dan foto proses muat kontainer secara berkala.
