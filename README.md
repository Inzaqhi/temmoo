# Temmoo

Temmoo adalah aplikasi web untuk menemukan event dan teman yang satu frekuensi. Pengguna bisa mencari event, menemukan "Circle" (orang dengan minat dan rencana event yang sama), lalu ngobrol dan datang bareng.

> **Status:** prototipe front-end. Semua data disimpan di `localStorage` browser. Lawan bicara, panggilan, dan keputusan admin masih disimulasikan karena belum ada backend.

## Fitur

- **Feed:** postingan, like, balasan thread, dan posting dengan media, emoji, lokasi, serta polling
- **Events:** katalog dengan filter kategori, harga, kota, dan tanggal; detail event, grup event, status kehadiran, Event Hub, dan album foto resmi
- **Circle:** rekomendasi teman berdasarkan kecocokan, permintaan Temui, dan follow
- **Chat:** pesan langsung dan grup event (dengan siklus aktif, pasca-event, dan arsip), panggilan suara/video, panggilan masuk, dan riwayat panggilan
- **Pencarian global:** orang, event, dan postingan
- **Aktivitas** (notifikasi)
- **Profil:** postingan, balasan, galeri foto pribadi, riwayat event, dan Pusat Akun
- **Peran akun:** Pengguna, Promotor (daftar, ditinjau, lalu Promotor Studio untuk banyak event dan anggota tim), dan Tim Temmoo (Admin Console)
- **Kalender kurasi & penyerahan halaman:** Tim Temmoo mengisi kalender event dari sumber publik. Promotor terverifikasi (Pemilik/Admin tim) menghubungi Tim Temmoo lewat WhatsApp; Tim Temmoo memverifikasi ke nomor resmi penyelenggara lalu menyerahkan (atau mencabut) halaman dari Admin Console. Event masuk Promotor Studio tanpa kehilangan peminat. Nomor WhatsApp Tim Temmoo diatur di `TEMMOO_WA` (`28-event-claim.js`)
- **Verifikasi bertingkat:** pengguna biasa dan Promotor Dasar (event gratis) tanpa KTP; Promotor Penuh (event berbayar & album) dan pemilik organisasi berbayar wajib verifikasi identitas sekali per orang (layar 73)

## Struktur proyek

```
index.html        Hasil build (satu file). Buka file ini di browser. Jangan diedit langsung.
build.py          Menggabungkan src/ menjadi index.html
src/
  index.html      Kerangka HTML. Memuat file CSS/JS di bawah sesuai urutan.
  styles/         CSS, diberi nomor sesuai urutan muat (01-…css sampai 27-…css)
  scripts/        JavaScript, diberi nomor sesuai urutan muat (01-…js sampai 33-…js)
tests/
  run.js          Menjalankan semua skenario dan membandingkan hasilnya dengan snapshot
  helpers.js      Membuka index.html dengan tanggal & angka acak yang dikunci
  scenarios/      Skenario tes (Playwright), satu file per fitur
  snapshots/      Keluaran yang sudah diperiksa benar, satu file per skenario
  fixtures/       Contoh foto KTP/selfie untuk tes verifikasi identitas
```

Urutan file penting. Banyak skrip membungkus atau menimpa fungsi dari skrip sebelumnya (misalnya `show`, `openFlow`, dan `template`), dan CSS yang dimuat belakangan menimpa yang sebelumnya. Jangan mengubah urutan nomor tanpa alasan yang jelas.

| File | Isi |
|---|---|
| `scripts/01-app-core.js` | Data contoh (posts, events, circles, chats), `render()`, `show()` |
| `scripts/02-flows.js` | Semua layar detail (`template(n)` dan `openFlow(n)`) |
| `scripts/17-audit.js` | Akun, verifikasi, grup event, admin, dan promotor (kode lama terbesar) |
| `scripts/18-router.js` | URL hash (`#/home`, `#/event/...`) dan tombol back |
| `scripts/22-search-notifications.js` | Pencarian, notifikasi, serta penyimpanan Temui/follow/chat |
| `scripts/23-call.js` | Panggilan suara dan video |
| `scripts/24-promoter-flow.js` | Pendaftaran dan akses promotor |
| `scripts/25-promoter-insights.js` | Dashboard per event (layar 71): rencana kehadiran, alasan, tren, asal peserta, pengumuman |
| `scripts/26-promoter-events.js` | Banyak event per akun promotor: daftar event (layar 64), pemilih event, antrean admin |
| `scripts/27-promoter-team.js` | Anggota tim promotor (layar 72): undangan, peran, akses per event, "Lihat sebagai", pemindahan kepemilikan, log aktivitas |
| `scripts/28-event-claim.js` | Kalender kurasi & penyerahan halaman: tanda di halaman event, permintaan lewat WhatsApp (layar 74), penyerahan/penolakan/pencabutan di Admin Console (layar 75) |
| `scripts/29-promoter-album.js` | Album resmi promotor (layar 76): unggah foto, harga per foto, terbitkan ke tab Album event. Foto disimpan di `temmoo_album_v1` |
| `scripts/30-dialogs.js` | Dialog di dalam halaman (`askConfirm`, `openAppDialog`). Jangan pakai `confirm()`/`alert()`: diblokir di pratinjau Claude |
| `scripts/31-photo-purchases.js` | Checkout foto album, pembelian tersimpan di `temmoo_purchases_v1`, tanda Dimiliki, Foto Saya → Dibeli |
| `scripts/32-i18n-en.js` | Kamus Bahasa Indonesia → English (teks persis, pola angka `#`, aturan untuk teks bernama) |
| `scripts/33-i18n.js` | Mesin bahasa: menerjemahkan teks antarmuka yang tampil, pengaturan bahasa di Pusat Akun |
| `styles/15-theme.css` | Tema terang indigo–coral (menimpa tema gelap di `02-base.css`) |

## Cara kerja

1. Edit file di `src/`.
2. Untuk mencoba langsung, buka `src/index.html` di browser. File ini memuat CSS dan JS terpisah.
3. Jalankan build:
   ```bash
   python3 build.py
   ```
4. Buka atau bagikan `index.html` (satu file, cocok untuk preview dan hosting statis seperti GitHub Pages).

Build tidak butuh dependensi; cukup Python 3.

## Bahasa (English / Bahasa Indonesia)

- **Default English**; pengguna bisa pindah ke Bahasa Indonesia di **Pusat Akun → Language · Bahasa** (tersimpan di `temmoo_lang_v1`).
- Teks di kode tetap **Bahasa Indonesia** (bahasa sumber). Saat English, `33-i18n.js` menerjemahkan setiap teks antarmuka yang tampil memakai kamus `32-i18n-en.js`. Konten pengguna (postingan, chat, nama event/orang) tidak ada di kamus sehingga dibiarkan.
- **Menambah teks baru:** tulis seperti biasa dalam Bahasa Indonesia, lalu tambahkan terjemahannya di `dict`. Angka ditulis `#` dan bentuk tunggal/jamak `{photo|photos}`, misalnya `'# foto dipilih':'# {photo|photos} selected'`. Teks yang memuat nama memakai `rules` (regex).
- **Jangan** menjalankan logika dari teks di layar (`textContent==='Semua'`): di English teksnya berubah. Pakai atribut `data-*`. Data yang disimpan juga harus dari sumbernya, bukan dari teks yang tampil.
- **Teks hukum** (persetujuan, ketentuan, pembayaran, KTP) memakai `legalText(id, en)` dan selalu tampil dua bahasa; bahasa yang dipakai tampil di atas.
- Tes: skenario lama berjalan dalam Bahasa Indonesia; `tests/scenarios/i18n.js` membuka semua layar dalam English dan mencetak teks antarmuka yang belum ada di kamus (harus hanya konten contoh). `TEMMOO_LANG=en node tests/run.js` menjalankan semua skenario dalam English (banyak yang akan berbeda dari snapshot; berguna untuk mencari teks yang belum diterjemahkan).

## Tes

Tes membuka `index.html` di Chromium (Playwright), menjalankan alur seperti pengguna sungguhan, lalu mencetak hasilnya. Keluaran itu dibandingkan dengan `tests/snapshots/`. Skenario dianggap gagal kalau ada error JavaScript di halaman, kalau skripnya error, atau kalau hasilnya beda dari snapshot.

```bash
npm ci                                  # sekali saja: memasang Playwright
npx playwright install chromium         # sekali saja: memasang browser
python3 build.py && npm test            # build lalu jalankan semua skenario (±4 menit)
node tests/run.js otp kyc               # hanya skenario yang namanya mengandung "otp" atau "kyc"
```

- Tanggal dikunci di **3 November 2026 pukul 10.00 WIB** (browser tes memakai zona Asia/Jakarta dan locale id-ID), dan `Math.random` dibuat tetap. Karena itu label "Selesai", hitung mundur, dan kode OTP selalu sama. Tanggal lain bisa dicoba lewat `TEMMOO_NOW=2026-12-25T10:00:00+07:00`.
- Kalau perubahanmu **memang** mengubah tampilan atau perilaku, jalankan `npm run test:update` (atau `node tests/run.js --update nama`). Baca diff `tests/snapshots/` dengan teliti sebelum commit, karena snapshot adalah definisi "benar".
- Screenshot dan file sementara dari setiap skenario tersimpan di `tests/.output/<nama>/` (tidak ikut di-commit).
- GitHub Actions (`.github/workflows/test.yml`) menjalankan semua tes setiap ada push ke `main` dan setiap pull request. Workflow itu juga gagal kalau `index.html` belum dibuild ulang dari `src/`.

## Langkah berikutnya

- Backend dan autentikasi sungguhan (akun, database, dan pembatasan akses untuk peran promotor dan admin)
- Chat realtime dan panggilan sungguhan (WebRTC, misalnya lewat LiveKit, Agora, atau Daily)
- Penyimpanan file (foto, dokumen promotor)
