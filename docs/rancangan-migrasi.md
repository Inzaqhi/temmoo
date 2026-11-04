# Rancangan Migrasi Temmoo: dari Prototipe ke Aplikasi Sungguhan

**Tim:** 1 developer full-stack + bantuan AI, ditambah pendiri sebagai product owner, kurator, dan penguji.
**Target:** Next.js + Supabase, aplikasi web (PWA) dulu, diluncurkan di Surabaya.
**Status dokumen:** rancangan awal, November 2026. Angka biaya dan waktu adalah perkiraan dan perlu dicek ulang sebelum dipakai untuk anggaran.

---

## 1. Ringkasan

| | |
|---|---|
| **Lama pengerjaan** | Sekitar **8 bulan** sampai fitur setara prototipe (28 minggu + cadangan 20%) |
| **Rilis publik pertama** | **Bulan ke-2**: kalender event Surabaya (katalog, detail, simpan event, status kehadiran) |
| **Urutan** | Fondasi → Kalender event → Promotor → Sosial (Circle, chat, grup) → Monetisasi (Verified, album foto) |
| **Ditunda** | Panggilan suara/video, aplikasi Android/iOS native, integrasi tiket, kota lain |
| **Biaya layanan** | Sekitar Rp1–2 juta/bulan selama pembangunan; Rp3–6 juta/bulan setelah rilis, belum termasuk biaya transaksi pembayaran |
| **Acuan** | Prototipe di repo ini (76 layar) beserta 31 skenario tesnya menjadi spesifikasi perilaku |

**Kenapa 1 developer bisa:** prototipe sudah menjawab hampir semua pertanyaan desain dan alur, jadi pekerjaan developer adalah *memindahkan* sambil menyambungkan ke database, bukan merancang dari nol. AI mempercepat bagian yang berulang (UI, migrasi, tes); developer fokus pada data, keamanan, dan pembayaran.

**Risiko terbesar:** semuanya bergantung pada satu orang (lihat bagian 9). Rancangan ini menulis semuanya ke repo supaya developer pengganti bisa melanjutkan.

---

## 2. Prinsip kerja

1. **Prototipe adalah spesifikasi.** Setiap layar baru dibandingkan dengan layar prototipe yang sama. Kalau ada perubahan perilaku, tulis alasannya.
2. **Skenario tes dipindahkan, bukan dibuang.** 31 skenario di `tests/scenarios/` ditulis ulang sebagai tes Playwright untuk aplikasi baru, per fase.
3. **Keamanan di database, bukan di tampilan.** Setiap tabel wajib punya Row Level Security (RLS) dan tes RLS-nya sebelum layar dibuat. Prototipe menyembunyikan tombol; aplikasi sungguhan harus *menolak* di server.
4. **Pakai layanan jadi.** Tidak ada server sendiri: Supabase (database, login, file, realtime), Vercel (hosting), payment gateway. Satu developer tidak boleh mengurus infrastruktur.
5. **Rilis kecil dan sering.** Setiap fase berakhir dengan sesuatu yang bisa dipakai orang sungguhan.
6. **Pendiri memegang semua akun** (domain, Supabase, Vercel, payment gateway, GitHub). Developer diberi akses, bukan kepemilikan.

---

## 3. Arsitektur

```
Pengguna (browser / PWA di HP)
        │
   Next.js di Vercel ── halaman, Server Actions, webhook pembayaran
        │
   Supabase
    ├─ Postgres + RLS ── semua data
    ├─ Auth ─────────── email + Google (OTP HP menyusul)
    ├─ Storage ──────── foto profil, album resmi, Foto Saya, KTP (bucket privat)
    ├─ Realtime ─────── chat, grup event, notifikasi
    └─ Edge Functions ─ tugas terjadwal (pengingat event, arsip grup)
        │
   Layanan luar: payment gateway (QRIS/VA/e-wallet), email (Resend), Sentry (error)
```

| Bagian | Pilihan | Catatan |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Satu kode untuk web dan PWA |
| Tampilan | Tailwind CSS + komponen sendiri dari desain prototipe | Warna, jarak, dan komponen diambil dari `src/styles/` |
| Bahasa | `next-intl`, kamus dari `32-i18n-en.js` | Teks hukum tetap dua bahasa (`legalText`) |
| Waktu | Kolom `timestamptz` + zona event (`WIB/WITA/WIT`) | Ditampilkan di zona perangkat, seperti prototipe |
| Foto | Supabase Storage + transformasi gambar | Menggantikan IndexedDB di prototipe |
| Tes | Playwright (alur) + tes RLS (SQL) | Jalan otomatis di GitHub Actions |
| Pemantauan | Sentry (error), log Supabase | Tingkat gratis cukup di awal |

**Yang sengaja tidak dipakai di awal:** aplikasi native, server sendiri, microservice, WhatsApp Business API. Penyerahan halaman tetap memakai tautan `wa.me` dan verifikasi manual oleh Tim Temmoo, sama seperti prototipe.

---

## 4. Struktur database

Dari 31 kunci penyimpanan di prototipe (`temmoo_*_v1`) menjadi tabel berikut. Kolom yang ditulis hanya yang penting.

### Akun & profil
| Tabel | Isi | Dari prototipe |
|---|---|---|
| `profiles` | id (= auth user), handle, nama, bio, kota, foto, bahasa, akun_privat, verified_until | `temmoo_account_v1`, `temmoo_identity_v1` |
| `interests`, `profile_interests` | minat pengguna | layar minat (6) |
| `follows` | follower → following, status (untuk akun privat) | `temmoo_follow_v1` |
| `blocks` | pemblokiran | menu keamanan grup |
| `subscriptions` | Verified: paket, status, periode, id pembayaran | layar 54–55 |

### Event
| Tabel | Isi | Dari prototipe |
|---|---|---|
| `events` | judul, kategori, `starts_at` (timestamptz), `tz`, venue, kota, deskripsi, harga (gratis/berbayar, teks kisaran), `ticket_url`, kapasitas, `source` (curated/promoter), `organization_id`, status (draft/submitted/review/changes/published/ended) | `eventMeta`, `temmoo_curated_v1`, `temmoo_promoter_v1` |
| `event_sources` | sumber info event kurasi | form kurasi |
| `attendance` | user, event, status (interested/considering/going/attended), alasan | `temmoo_attendance_v1` |
| `saved_events` | event yang disimpan | tombol ♡ |
| `announcements` | pengumuman promotor ke peserta | dashboard event |
| `event_claims` | permintaan halaman: status requested/assigned/declined/revoked, nomor WA resmi (disamarkan), sumber nomor, catatan, admin yang memproses | `temmoo_claims_v1` |

### Promotor
| Tabel | Isi | Dari prototipe |
|---|---|---|
| `organizations` | nama, jenis, kontak, tier (basic/full), status | `temmoo_promoter_app_v1` |
| `organization_members` | user, organisasi, peran (owner/admin/editor/viewer), cakupan event | `27-promoter-team.js` |
| `organization_invites` | undangan anggota tim lewat email | layar Tim (72) |
| `kyc_submissions` | foto KTP & selfie (**bucket privat**), status, peninjau, alasan | layar 73 |
| `org_activity_log` | aktivitas tim | log tim |

### Sosial
| Tabel | Isi | Dari prototipe |
|---|---|---|
| `posts`, `post_media`, `polls`, `poll_votes` | postingan, foto, polling | composer |
| `comments`, `likes`, `reposts` | interaksi | `temmoo_likes_v1`, `temmoo_replies_v1` |
| `conversations`, `conversation_members`, `messages` | DM | `temmoo_chat_v1` |
| `event_groups`, `group_members`, `group_requests` | grup event resmi/komunitas, siklus aktif → arsip | `temmoo_group_*` |
| `meet_requests` | ajakan "Temui" dari Circle | `temmoo_meet_v1` |
| `notifications` | aktivitas (in-app) | `temmoo_notif_*` |
| `reports` | laporan konten/pengguna/grup + tindakan | `temmoo_group_safety_v1`, moderasi admin |

### Foto & pembayaran
| Tabel | Isi | Dari prototipe |
|---|---|---|
| `event_albums`, `album_photos` | album resmi, harga per foto, status terbit | `temmoo_album_v1` |
| `orders`, `order_items` | pesanan foto & langganan, metode, status, id gateway | `temmoo_purchases_v1` |
| `user_photos`, `user_albums` | Foto Saya, tanda favorit/arsip/sampah | `temmoo_my_photos_v1` |
| `payouts` | pembagian hasil ke promotor per bulan | (baru) |

### Admin
| Tabel | Isi |
|---|---|
| `staff` | akun Tim Temmoo + peran (super_admin, curator, moderator, support) |
| `admin_audit_log` | setiap tindakan admin, **hanya bisa ditambah**, tidak bisa diubah atau dihapus |

**Rekomendasi Circle** dihitung dengan query SQL (minat yang sama, kota, event yang sama) yang disimpan sebagai *view*, bukan tabel. Belum perlu machine learning.

---

## 5. Peran dan izin (RLS)

| Peran | Bisa | Tidak bisa |
|---|---|---|
| Pengunjung (belum login) | Lihat katalog & detail event yang terbit | Semua yang lain |
| Pengguna | Kelola profil, status kehadiran, posting, chat, grup, beli foto | Melihat data peserta event, data orang lain yang privat |
| Promotor: viewer | Lihat dashboard & data agregat peserta event organisasinya | Mengubah apa pun |
| Promotor: editor | + buat/ubah event, kirim pengumuman, unggah foto album | Mengajukan ke Temmoo, terbitkan album, kelola tim |
| Promotor: owner/admin | + ajukan event, minta halaman, terbitkan album, kelola tim | Menerbitkan event tanpa tinjauan Temmoo |
| Staf: curator | Kalender kurasi, serahkan/tolak/cabut halaman, tinjau event | Moderasi akun, data KTP |
| Staf: moderator | Laporan, blokir/nonaktifkan konten dan akun | Data KTP, pembayaran |
| Staf: super_admin | Semua, termasuk tinjauan KTP dan pembayaran | Mengubah audit log |

Aturan penting:
- **Data peserta ke promotor hanya berupa angka agregat** (jumlah tertarik, mau datang, dll.), tidak ada daftar nama, kecuali pengguna setuju.
- **Foto KTP** hanya bisa dibaca super_admin, dihapus otomatis 30 hari setelah keputusan, dan setiap akses tercatat.
- **Status transisi event dan klaim** (misalnya draft → submitted → published) dijalankan lewat fungsi database, bukan update langsung, supaya urutannya tidak bisa dilompati.

---

## 6. Tahapan pembangunan

Perkiraan untuk 1 developer penuh waktu dengan bantuan AI. Setiap fase punya hasil yang bisa dipakai.

### Fase 0 — Fondasi (2 minggu)
- Repo baru `temmoo-app`, Next.js + Supabase, CI (lint, tes, preview deploy per pull request)
- Desain dasar (warna, huruf, tombol, kartu) dipindah dari `src/styles/`
- Login email + Google, halaman profil kosong, pilih bahasa
- `CLAUDE.md` berisi aturan proyek untuk AI (lihat bagian 7)
- **Selesai bila:** developer bisa login di preview, tes jalan di CI

### Fase 1 — Kalender event Surabaya (6 minggu) → **rilis publik pertama**
- Katalog (kategori, harga, kota, tanggal, urutan, pencarian dua bahasa), detail event, label Selesai, mode kenangan
- Kalender kurasi untuk staf: tambah event, sumber, deskripsi, tautan tiket, zona waktu
- Status kehadiran, simpan event, Riwayat
- Onboarding & minat, profil, Pusat Akun (bahasa, privasi)
- Zona waktu dan format jam seperti prototipe, PWA (bisa dipasang di layar HP)
- **Tes yang dipindah:** `events`, `tickets`, `timezone`, `search-notifications` (bagian pencarian), `i18n`, `a11y`, `mobile`
- **Selesai bila:** 30+ event Surabaya terisi oleh pendiri, dibuka orang sungguhan

### Fase 2 — Promotor (6 minggu)
- Pendaftaran promotor (Dasar), organisasi, tim 4 peran + undangan email
- Buat/ubah/ajukan event, tinjauan admin (setujui, minta revisi, tolak), pengumuman
- Permintaan halaman lewat WhatsApp → admin serahkan/tolak/cabut, audit log
- Dashboard event (angka agregat), Promotor Studio di HP
- **Tes yang dipindah:** `promoter`, `multi`, `team`, `claim`, `journey2`, `mobile-nav`, `crawl-promoter`
- **Selesai bila:** 3–5 promotor nyata mengelola event-nya sendiri

### Fase 3 — Sosial (8 minggu)
- Ikuti/pengikut, akun privat, postingan, komentar, suka, repost, polling
- Circle: rekomendasi, "Temui", profil publik
- Chat pribadi realtime, grup event (resmi & komunitas, persetujuan anggota, siklus aktif → arsip)
- Notifikasi in-app + email ringkas, laporan & blokir, Pusat moderasi admin
- **Tes yang dipindah:** `groups`, `chat-panel`, `forms`, `persist`, `search-notifications` (notifikasi), `crawl`
- **Selesai bila:** orang yang tidak saling kenal bisa janjian datang bareng ke event, dan laporan ditangani < 24 jam

### Fase 4 — Monetisasi (6 minggu)
- Payment gateway: QRIS, VA, e-wallet, webhook, halaman status pesanan
- Verified (langganan bulanan/tahunan; perpanjangan manual dulu lewat pengingat)
- Promotor Penuh + verifikasi KTP (ditinjau manual oleh super_admin)
- Album resmi (unggah, harga, terbit), checkout foto, foto tanpa watermark, Foto Saya
- Laporan penjualan untuk promotor, pembayaran ke promotor manual tiap bulan
- **Tes yang dipindah:** `album`, `purchases`, `my-photos`, `tier`, `tier2`, `kyc`, `otp`, `transfer-otp-kyc`, `accept-otp-kyc`, `preview-sandbox`
- **Selesai bila:** pembelian foto pertama dibayar sungguhan dan hasilnya sampai ke promotor

### Fase 5 — Nanti (setelah ada pengguna)
- Panggilan suara/video (LiveKit), aplikasi Android/iOS, integrasi penjual tiket, kota kedua, perpanjangan langganan otomatis, verifikasi KTP oleh penyedia pihak ketiga

### Jadwal

| Bulan | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Fase 0 Fondasi | ■ | | | | | | | |
| Fase 1 Kalender | ■ | ■ | | | | | | |
| Fase 2 Promotor | | | ■ | ■ | | | | |
| Fase 3 Sosial | | | | ■ | ■ | ■ | | |
| Fase 4 Monetisasi | | | | | | ■ | ■ | |
| Cadangan & keamanan | | | | | | | | ■ |

---

## 7. Cara kerja 1 developer + AI

**Alur per fitur:**
1. Buka layar prototipe dan skenario tesnya, catat perilaku yang harus sama.
2. Tulis migrasi SQL + RLS + tes RLS (**developer menulis atau memeriksa sendiri baris demi baris**).
3. Minta AI membuat halaman dan komponen berdasarkan layar prototipe.
4. Pindahkan skenario tes Playwright; jalankan sampai lolos.
5. Minta AI meninjau keamanan perubahan (`/security-review`) sebelum merge.
6. Deploy preview; pendiri mencoba di HP, lalu merge.

**Pembagian yang masuk akal:**

| AI mengerjakan | Developer wajib memegang |
|---|---|
| Halaman, komponen, terjemahan | Struktur database dan RLS |
| Tes Playwright dari skenario lama | Alur pembayaran dan webhook |
| Migrasi data contoh, skrip seed | Keputusan saat perilaku prototipe ternyata kurang tepat |
| Dokumentasi dan ringkasan perubahan | Review akhir setiap pull request |

**Aturan di `CLAUDE.md` proyek baru**, antara lain:
- Setiap tabel baru harus disertai RLS dan tesnya
- Jangan pernah menaruh kunci rahasia di kode klien
- Teks antarmuka harus lewat kamus terjemahan
- Logika tidak boleh bergantung pada teks yang tampil (pakai ID/atribut data)
- Tanggal disimpan sebagai `timestamptz`

**Ritme mingguan:** demo 30 menit dengan pendiri, daftar pekerjaan minggu depan, satu catatan risiko.

**Profil developer yang dicari:** TypeScript dan React/Next.js yang kuat, nyaman dengan Postgres (query, index, RLS), pernah integrasi pembayaran, terbiasa memakai AI untuk coding dan **mau membaca ulang hasilnya**. Pengalaman 3+ tahun disarankan, karena tidak ada senior lain yang mereview.

---

## 8. Biaya

### Layanan (perkiraan; harga dalam dolar dan berubah — cek ulang sebelum anggaran)

| Layanan | Selama pembangunan | Setelah rilis |
|---|---|---|
| Supabase | Gratis → Pro sekitar US$25/bulan | US$25 + pemakaian (perkiraan US$25–100) |
| Vercel | Pro sekitar US$20/bulan | US$20 + pemakaian |
| Langganan AI untuk coding | Sekitar US$100–200/bulan | Sama |
| Email (Resend), Sentry | Gratis | US$0–40/bulan |
| Domain | Sekitar Rp200 ribu/tahun | Sama |
| **Total kira-kira** | **Rp1–2 juta/bulan** | **Rp3–6 juta/bulan** |

### Biaya per transaksi (dipotong dari penjualan, bukan tagihan bulanan)
- QRIS biasanya persentase kecil dari nilai transaksi; VA dan e-wallet punya tarif sendiri per transaksi. Pastikan angka resmi dari penyedia yang dipilih (misalnya Midtrans atau Xendit) dan masukkan ke harga foto/langganan.

### Gaji
- 1 developer full-stack berpengalaman di Surabaya/remote: sangat bervariasi; anggarkan sebagai pos terbesar. Lihat perkiraan sebelumnya (Rp15–25 juta/bulan untuk level menengah-senior, perlu dicek ke pasar).
- Pengacara (sekali di awal) untuk syarat & ketentuan, kebijakan privasi, persetujuan KTP.

---

## 9. Risiko dan penanganannya

| Risiko | Dampak | Penanganan |
|---|---|---|
| Developer berhenti atau sakit | Proyek berhenti | Semua di repo milik pendiri; dokumen per fase; tes lengkap; akun atas nama pendiri; kontrak dengan masa serah terima |
| Celah keamanan data (chat, KTP) | Kebocoran data pribadi, masalah hukum | RLS wajib + tes; KTP di bucket privat dengan masa simpan; tinjauan keamanan pihak ketiga sebelum Fase 4 dirilis |
| Kode dari AI tidak dipahami developer | Bug sulit diperbaiki | Developer wajib review setiap PR; pull request kecil; larangan merge kode yang tidak bisa dijelaskan |
| Fitur terus bertambah | Tidak pernah rilis | Fase dikunci; ide baru masuk daftar "Fase 5" |
| Persetujuan payment gateway lama | Fase 4 mundur | Ajukan akun sejak bulan 1 (lihat bagian 10) |
| Moderasi chat & grup | Pelecehan, pengguna di bawah umur | Laporan + blokir sejak Fase 3; batas usia di pendaftaran; pendiri/moderator cek laporan harian |

---

## 10. Pekerjaan pendiri (bukan kode, sebagian butuh waktu tunggu)

Mulai sejak bulan 1, karena beberapa butuh berminggu-minggu:

- [ ] **Badan usaha** (PT/CV) dan **NIB** lewat OSS, diperlukan untuk payment gateway
- [ ] **Pendaftaran PSE Lingkup Privat** (Komdigi) untuk layanan elektronik
- [ ] **Akun payment gateway** dan proses verifikasi usahanya
- [ ] **Nomor WhatsApp resmi Tim Temmoo** (WhatsApp Business) untuk permintaan halaman
- [ ] **Dokumen hukum** oleh pengacara: syarat & ketentuan, kebijakan privasi (UU PDP), ketentuan promotor, ketentuan pembelian foto, persetujuan KTP — dua bahasa
- [ ] **Domain dan email** resmi
- [ ] **Isi kalender kurasi** Surabaya sebelum rilis Fase 1 (target 30+ event)
- [ ] **Promotor pertama** (3–5) untuk mencoba Fase 2
- [ ] **Uji di HP** setiap preview dan ikut demo mingguan

---

## 11. Cara memakai prototipe ini selama pembangunan

- Prototipe tetap di repo `temmoo` dan dibuka dari `index.html`. Jangan dihapus sampai Fase 4 selesai.
- Layar per nomor ada di `src/scripts/` (`template(n)`); daftar fitur per file ada di `README.md`.
- Skenario tes di `tests/scenarios/` adalah daftar perilaku. Setiap skenario dicentang ketika versi barunya lolos di aplikasi baru:

| Fase | Skenario prototipe |
|---|---|
| 1 | events, tickets, timezone, i18n, a11y, mobile, search-notifications (pencarian) |
| 2 | promoter, multi, team, claim, journey2, mobile-nav, crawl-promoter |
| 3 | groups, chat-panel, forms, persist, search-notifications (notifikasi), crawl |
| 4 | album, purchases, my-photos, tier, tier2, kyc, otp, transfer-otp-kyc, accept-otp-kyc, preview-sandbox |
| 5 | call, incoming-call |

- Perubahan perilaku yang disengaja dicatat di `docs/keputusan.md` di repo baru (tanggal, apa, kenapa).
