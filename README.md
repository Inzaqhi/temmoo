# Temmoo

Temmoo adalah aplikasi web untuk menemukan event dan teman yang satu frekuensi. Pengguna bisa mencari event, menemukan "Circle" (orang dengan minat dan rencana event yang sama), lalu ngobrol dan datang bareng.

> **Status:** prototipe front-end. Semua data disimpan di `localStorage` browser. Lawan bicara, panggilan, dan keputusan admin masih disimulasikan karena belum ada backend.

## Fitur

- **Feed:** postingan, like, balasan thread, dan posting dengan media, emoji, lokasi, serta polling
- **Events:** katalog dengan filter kategori, harga, kota, dan tanggal; detail event, grup event, status kehadiran, Event Hub, dan album foto resmi
- **Circle:** rekomendasi teman berdasarkan kecocokan, permintaan Temui, dan follow
- **Chat:** pesan langsung dan grup event (dengan siklus aktif, pasca-event, dan arsip), panggilan suara/video, panggilan masuk, dan riwayat panggilan
- **Pencarian global:** orang, event, dan postingan
- **Notifikasi**
- **Profil:** postingan, balasan, galeri foto pribadi, riwayat event, dan Pusat Akun
- **Peran akun:** Pengguna, Promotor (daftar, ditinjau, lalu Promotor Studio), dan Tim Temmoo (Admin Console)

## Struktur proyek

```
index.html        Hasil build (satu file). Buka file ini di browser. Jangan diedit langsung.
build.py          Menggabungkan src/ menjadi index.html
src/
  index.html      Kerangka HTML. Memuat file CSS/JS di bawah sesuai urutan.
  styles/         CSS, diberi nomor sesuai urutan muat (01-…css sampai 21-…css)
  scripts/        JavaScript, diberi nomor sesuai urutan muat (01-…js sampai 25-…js)
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
| `scripts/25-promoter-insights.js` | Ringkasan Promotor Studio: rencana kehadiran, alasan, tren, asal peserta, pengumuman |
| `styles/15-theme.css` | Tema terang indigo–coral (menimpa tema gelap di `02-base.css`) |

## Cara kerja

1. Edit file di `src/`.
2. Untuk mencoba langsung, buka `src/index.html` di browser. File ini memuat CSS dan JS terpisah.
3. Jalankan build:
   ```bash
   python3 build.py
   ```
4. Buka atau bagikan `index.html` (satu file, cocok untuk preview dan hosting statis seperti GitHub Pages).

Tidak ada dependensi; cukup Python 3.

## Langkah berikutnya

- Backend dan autentikasi sungguhan (akun, database, dan pembatasan akses untuk peran promotor dan admin)
- Chat realtime dan panggilan sungguhan (WebRTC, misalnya lewat LiveKit, Agora, atau Daily)
- Penyimpanan file (foto, dokumen promotor)
