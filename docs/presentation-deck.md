# Byond Kids — Product & Backend Presentation
### Edukasi Keuangan Syariah untuk Generasi Digital

**Untuk:** Head Level & Non-IT Stakeholders
**Disusun oleh:** IT Dev Team — Backend
**Versi Backend:** 4.0 (Production Ready)
**Tanggal:** Juni 2026

---

&nbsp;

---

# BAB 1
## Masalah yang Kami Selesaikan

---

## Kenapa Ini Penting?

> **"Anak Indonesia tidak diajarkan keuangan sejak dini — dan itu masalah besar."**

Riset menunjukkan bahwa kebiasaan keuangan terbentuk sebelum usia 12 tahun. Namun mayoritas anak Indonesia tidak memiliki akses ke:

- Rekening tabungan yang bisa mereka kelola sendiri
- Sistem reward yang mengajarkan hubungan antara **kerja keras ↔ imbalan**
- Edukasi keuangan syariah yang relevan dengan nilai-nilai keluarga

Sementara itu, **orang tua tidak punya tools digital** yang mudah untuk:
- Mentransfer uang jajan secara digital dengan kontrol
- Membatasi pengeluaran anak (gaming, belanja online)
- Memantau kebiasaan keuangan anak secara real-time

---

## Peluang Pasar

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   85 juta anak usia 5–17 tahun di Indonesia         │
│                                                      │
│   Penetrasi BSI Digital Banking terus naik          │
│   → Keluarga nasabah BSI butuh solusi kid-friendly  │
│                                                      │
│   Regulasi OJK mendorong inklusi keuangan anak      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Byond Kids** hadir sebagai jembatan antara ekosistem BSI Digital Banking dengan kebutuhan edukasi keuangan keluarga Muslim Indonesia.

---

&nbsp;

---

# BAB 2
## Apa Itu Byond Kids?

---

## Gambaran Produk

**Byond Kids** adalah platform edukasi keuangan syariah berbasis rekening BSI yang dirancang untuk anak-anak usia 6–17 tahun dan orang tua mereka.

Bayangkan seperti ini:

```
Tanpa Byond Kids:                 Dengan Byond Kids:
─────────────────                 ──────────────────
Orang tua kasih uang jajan    →   Transfer digital ke rekening anak
  (cash, tidak tercatat)           (tercatat, terpantau)

Anak belanja sesuka hati      →   Ada batas pengeluaran per hari/minggu
  (tidak ada kontrol)              (orang tua yang set)

"Rapikan kamar" tanpa bukti   →   Tugas + foto bukti + reward otomatis
  (tidak ada reward sistematis)    (reward langsung masuk rekening)

Anak tidak tahu menabung      →   Pocket tabungan bertujuan
  (tidak ada goals)                (Haji, Qurban, Sepeda impian)

Sedekah hanya di kotak masjid →   Infaq digital ke BAZNAS, Rumah Zakat
  (tidak tercatat, tidak terbiasa) (terbentuk kebiasaan digital)

Belajar keuangan = membosankan →  E-Learning + Kuis + Reward koin
  (tidak ada gamifikasi)           (XP, level, hadiah nyata)
```

---

## Tiga Pengguna Utama

```
        ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
        │             │      │             │      │             │
        │  SUPER      │      │   ORANG     │      │    ANAK     │
        │  ADMIN      │      │    TUA      │      │             │
        │             │      │             │      │             │
        │  Tim BSI    │      │  Nasabah    │      │  Usia 6–17  │
        │  Platform   │      │  BSI        │      │  tahun      │
        │             │      │             │      │             │
        └──────┬──────┘      └──────┬──────┘      └──────┬──────┘
               │                   │                     │
               ▼                   ▼                     ▼
        Kelola platform      Kontrol keuangan      Belajar keuangan
        konten & data        & pantau anak         & kumpulkan reward
```

---

&nbsp;

---

# BAB 3
## Apa yang Bisa Dilakukan?

### Fitur per Pengguna

---

## Fitur untuk Orang Tua

### 1. Banking Digital untuk Anak
Orang tua bisa transfer saldo ke rekening digital anak langsung dari aplikasi — seperti mobile banking BSI, tapi khusus untuk anak.

```
Saldo Ayah/Ibu  ──[Transfer]──►  Rekening Digital Anak
  Rp 10.000.000                      Rp 150.000
                    ↓
              Semua tercatat di
              riwayat transaksi
```

### 2. Sistem Tugas & Reward (Chores)
Orang tua buat tugas untuk anak — lengkap dengan nominal reward dan batas waktu. Ketika anak selesai dan mengirim bukti foto, orang tua tinggal approve dan **reward langsung masuk rekening anak secara otomatis**.

```
Orang Tua              Anak
    │                   │
    ├── Buat tugas ──►  │
    │   "Hafal Surah    │
    │    Al-Mulk"       │
    │   Reward: Rp 50rb │
    │                   ├── Submit foto bukti
    │                   │
    │◄── Notifikasi ────┤
    │
    ├── Approve ──────► Rp 50.000 otomatis masuk rekening anak
```

**Alur revisi juga ada:** jika bukti kurang jelas, orang tua bisa minta perbaikan sebelum reject final.

### 3. Batas Pengeluaran (Spending Limits)
Orang tua bisa set batas belanja anak:
- Maksimal Rp 30.000/hari untuk semua pengeluaran
- Khusus gaming: maksimal Rp 10.000/hari
- Infaq dikecualikan dari batas (agar anak tetap bebas bersedekah)

### 4. Pantau Keuangan Anak
Real-time: lihat saldo, pocket, dan semua transaksi anak tanpa harus tanya langsung.

---

## Fitur untuk Anak

### 1. Rekening Digital Sendiri
Anak punya rekening sub-BSI yang bisa dilihat saldonya, riwayat transaksi, dan dikelola sendiri.

### 2. Pocket Tabungan Bertujuan
Seperti amplop tabungan, tapi digital. Anak bisa buat kantong-kantong tabungan dengan tujuan spesifik:

```
Tabungan Utama: Rp 150.000
        │
        ├──► Uang Jajan     : Rp 50.000   (untuk harian)
        ├──► Tabungan Haji  : Rp 75.000   (target Rp 500.000 📅 2030)
        └──► Qurban Idul Adha: Rp 25.000  (target Rp 300.000 📅 2027)
```

Anak bisa tulis niat untuk setiap pocket — membangun kebiasaan perencanaan keuangan.

### 3. Marketplace Voucher
Anak bisa beli voucher dari saldo tabungan:
- Shopee (Rp 10.000 – Rp 25.000)
- Mobile Legends Diamond
- Free Fire Diamond
- GoPay top-up
- Ruangguru (edukasi)

Tapi tetap dibatasi oleh spending limit yang sudah di-set orang tua.

### 4. Infaq Digital
Anak bisa sedekah ke lembaga zakat pilihan langsung dari aplikasi — BSI Maslahat, BAZNAS, LAZISNU, LAZISMU, atau Rumah Zakat.

### 5. E-Learning + Gamifikasi (Fitur Terbaru v4)
Anak belajar keuangan syariah melalui artikel interaktif dan kuis:

```
Baca Artikel  ──►  Selesaikan Kuis  ──►  Reward Koin (masuk rekening)
    +10 XP              +20 XP             + Rp 5.000

                    Level System:
                    ⭐ Level 1: Pemula    (0 – 99 XP)
                    ⭐ Level 2: Pelajar   (100 – 249 XP)
                    ⭐ Level 3: Cerdas    (250 – 499 XP)
                    ⭐ Level 4: Pintar    (500 – 999 XP)
                    ⭐ Level 5: Jenius    (1000+ XP)
```

---

## Fitur untuk Admin (Tim BSI)

| Fungsi | Apa yang Bisa Dilakukan |
|---|---|
| Manajemen Pengguna | Aktif/nonaktifkan akun parent dan anak, koreksi saldo manual |
| Konten Voucher | Tambah/edit/hapus voucher di marketplace |
| Lembaga Infaq | Tambah dan kelola lembaga zakat yang tersedia |
| Konten E-Learning | Buat modul, artikel, dan kuis dari dasbor admin |
| Statistik Platform | Total pengguna, volume transaksi, total infaq, engagement learning |
| Audit Log | Seluruh riwayat aktivitas platform tercatat otomatis |

---

&nbsp;

---

# BAB 4
## Cerita Pengguna (User Journey)

---

## Kisah: Keluarga Budi Santoso

> *Budi adalah ayah 2 anak — Aisha (13 tahun) dan Rizky (9 tahun). Ini adalah hari pertama keluarga Budi menggunakan Byond Kids.*

---

### Langkah 1 — Budi Daftar dan Setup Akun

```
Budi buka aplikasi → Daftar dengan email + NIK + nomor rekening BSI
                   → Buat PIN tabungan 6 digit
                   → Buat akun anak untuk Aisha dan Rizky
                      (masing-masing dapat username + PIN)
```

**Di balik layar (teknis):**
Sistem membuat 3 akun terhubung dalam satu keluarga virtual (`FamilyLink`) dengan saldo awal yang bisa ditransfer dari rekening BSI Budi.

---

### Langkah 2 — Budi Transfer Uang Jajan

```
Budi → Transfer Rp 150.000 ke Aisha
     → Konfirmasi dengan PIN tabungan
     → Rp 150.000 masuk rekening digital Aisha secara instan
     → Saldo Budi berkurang Rp 150.000, saldo Aisha bertambah Rp 150.000
     → Keduanya tercatat di riwayat transaksi
```

---

### Langkah 3 — Aisha Atur Pocket Tabungan

```
Aisha buka aplikasinya:
  → Buat Pocket "Tabungan Haji" 🕌
    Target: Rp 500.000 | Deadline: 2030
    Niat: "Ya Allah, semoga aku bisa berhaji sendiri saat besar nanti. Aamiin."
  → Alokasikan Rp 75.000 dari Tabungan Utama ke pocket ini
```

---

### Langkah 4 — Budi Beri Tugas, Aisha Kerjakan

```
Budi buat tugas untuk Aisha:
  Judul   : "Hafal Surah Al-Mulk"
  Reward  : Rp 50.000
  Deadline: 7 hari lagi

Aisha hafal → kirim video bukti lewat aplikasi
Budi review → Approve!
→ Rp 50.000 otomatis masuk rekening Aisha
→ Saldo Budi berkurang Rp 50.000
```

---

### Langkah 5 — Rizky Belajar dan Dapat Reward

```
Rizky buka E-Learning:
  → Baca artikel "Mengapa Menabung Itu Penting?" (+10 XP)
  → Kerjakan kuis → Skor 85% (lulus!)
  → Dapat +20 XP bonus
  → Dapat Rp 5.000 langsung masuk rekeningnya
     (didebit otomatis dari saldo Budi sebagai reward)

Level Rizky naik: ⭐ Level 1 Pemula → ⭐ Level 2 Pelajar
```

---

### Langkah 6 — Budi Pantau Semuanya

```
Budi buka dasbor monitoring:
  ✓ Aisha: Rp 175.000 total, 3 pocket aktif, hafalan selesai
  ✓ Rizky: Rp 85.000 total, Level 2 di e-learning, 0 tugas belum selesai
  ✓ Budi: saldo Rp 9.895.000 (total terkirim Rp 105.000 hari ini)
```

---

&nbsp;

---

# BAB 5
## Di Balik Layar: Arsitektur Sistem

---

## Gambaran Besar (Non-Teknis)

Bayangkan Byond Kids seperti sebuah **bank mini digital**. Di dalamnya ada beberapa bagian:

```
                    ┌────────────────────────────────────────┐
                    │          APLIKASI BYOND KIDS           │
                    │         (yang pengguna lihat)          │
                    └──────────────────┬─────────────────────┘
                                       │ Internet (HTTPS)
                                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                    SERVER BYOND KIDS                             │
│              (Otak yang memproses semua permintaan)              │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │   Auth   │  │ Banking  │  │  Chores  │  │  E-Learning  │    │
│  │  & Login │  │ Transfer │  │  Reward  │  │  XP System   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │ Voucher  │  │  Infaq   │  │ Pockets  │  │    Admin     │    │
│  │ Market   │  │ Sedekah  │  │  Goals   │  │    Panel     │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    DATABASE (Brankas Data)                        │
│                                                                  │
│   VM1 — PostgreSQL Primary        VM2 — PostgreSQL Replica       │
│   (tulis + baca utama)            (backup + baca cadangan)       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Analoginya seperti ini:**
- **Server** = Kasir bank + sistem antrian + proses approval, semua otomatis
- **Database VM1** = Brankas utama tempat semua data disimpan
- **Database VM2** = Brankas cadangan yang selalu sinkron dengan brankas utama
- **HTTPS** = Segel keamanan di setiap komunikasi (tidak bisa disadap)

---

## Bagaimana Server Diorganisir?

Server tidak ditulis sebagai satu file besar — ia dipecah menjadi **12 modul independen**, seperti departemen dalam sebuah bank:

```
┌─────────────────────────────────────────────────────────────────┐
│                      SERVER (12 DEPARTEMEN)                     │
├─────────────────┬───────────────────────────────────────────────┤
│  Departemen     │  Fungsi                                       │
├─────────────────┼───────────────────────────────────────────────┤
│  auth           │  Penjaga pintu: login, daftar, keamanan sesi  │
│  family         │  Manajemen hubungan orang tua ↔ anak          │
│  parent         │  Banking: saldo, deposit, transfer            │
│  chores         │  Tugas, submit bukti, approve, reward         │
│  pockets        │  Kantong tabungan tujuan                      │
│  limits         │  Batas pengeluaran per anak                   │
│  infaq          │  Donasi ke lembaga zakat                      │
│  vouchers       │  Marketplace voucher                          │
│  learning       │  E-Learning, kuis, XP, reward                 │
│  child          │  Dasbor mandiri anak                          │
│  admin          │  Panel kontrol seluruh platform               │
│  health         │  Monitoring kondisi server                    │
└─────────────────┴───────────────────────────────────────────────┘
```

Keuntungan desain ini: jika ada update di fitur voucher, tidak perlu menyentuh kode fitur chores.

---

## Alur Transaksi Keuangan (Contoh: Transfer ke Anak)

Ini yang terjadi dalam hitungan milidetik saat orang tua transfer ke anak:

```
Langkah 1:  Aplikasi kirim permintaan ke server
            {childId: "...", amount: 100000, pin: "123456"}

Langkah 2:  Server verifikasi PIN orang tua
            (PIN dibandingkan dengan versi terenkripsi di database)

Langkah 3:  Server cek saldo orang tua ≥ amount yang diminta

Langkah 4:  Server jalankan "transaksi atom":
            ┌──────────────────────────────────────────────┐
            │  ATOMIC TRANSACTION (semua berhasil          │
            │  atau semua dibatalkan — tidak ada          │
            │  kondisi setengah jadi)                     │
            │                                              │
            │  a) Kurangi saldo orang tua                 │
            │  b) Catat di riwayat orang tua              │
            │  c) Tambah saldo anak                       │
            │  d) Catat di riwayat anak                   │
            └──────────────────────────────────────────────┘

Langkah 5:  Server kirim respons sukses + saldo terbaru kedua pihak

Total waktu: < 500 milidetik
```

**Mengapa "atom"?** Seperti transfer bank sungguhan — tidak boleh ada uang yang "menghilang di tengah jalan". Jika langkah c gagal karena alasan teknis, langkah a dan b otomatis dibatalkan.

---

&nbsp;

---

# BAB 6
## Keamanan & Kepatuhan

---

## Berlapis-Lapis, Bukan Satu Pintu

```
INTERNET
   │
   ▼
┌─────────────────────────────────────────────────┐
│  LAPISAN 1 — HTTPS                              │
│  Semua data dienkripsi saat dikirim             │
│  Tidak bisa disadap di perjalanan               │
└────────────────────────┬────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│  LAPISAN 2 — RATE LIMITING                      │
│  Maksimal 100 request / 15 menit per IP         │
│  Login: maksimal 5 percobaan / 15 menit         │
│  Mencegah serangan otomatis (brute force)       │
└────────────────────────┬────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│  LAPISAN 3 — VERIFIKASI IDENTITAS (JWT)         │
│  Setiap request harus bawa "tanda pengenal"     │
│  Tanda pengenal berlaku hanya 8 menit           │
│  Setelah expired, harus minta yang baru         │
└────────────────────────┬────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│  LAPISAN 4 — KONTROL PERAN (RBAC)               │
│  Admin tidak bisa akses data transaksi anak     │
│  Anak tidak bisa lihat data anak lain           │
│  Parent hanya bisa operasi ke anaknya sendiri   │
└────────────────────────┬────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│  LAPISAN 5 — KONFIRMASI PIN                     │
│  Transaksi finansial butuh PIN tambahan         │
│  (Transfer, beli voucher, infaq)                │
└─────────────────────────────────────────────────┘
```

---

## Bagaimana Password & PIN Disimpan?

**Jawaban singkat: tidak pernah disimpan dalam bentuk aslinya.**

```
Yang Pengguna Ketik:    "123456"
                           │
                           ▼ (bcrypt hash, cost factor 12)
Yang Tersimpan di DB:   "$2b$12$K3X8p2QZjD7mN9..."
                         (60 karakter acak yang tidak bisa dikembalikan)
```

Bahkan jika database bocor pun, tidak ada yang bisa tahu password asli pengguna.

---

## Sistem Token Sesi (Mudah Dipahami)

Seperti kartu akses hotel:

```
Saat Login:
  Server kasih 2 kartu:
  ├── Kartu Akses Utama  → berlaku 8 menit saja
  └── Kartu Perpanjangan → berlaku 7 hari, dipakai sekali
                           (setelah dipakai, kartu lama hangus,
                            dapat kartu baru)

Saat Logout:
  Kartu Perpanjangan langsung diblokir di database
  → Tidak bisa dipakai lagi meski belum expired
```

Ini berarti: jika HP hilang, sesi bisa di-revoke dari server tanpa perlu ganti password.

---

## Temuan & Perbaikan Keamanan (SonarQube Audit)

Setelah scan oleh tim IT Security:

| Temuan | Kode Kerentanan | Status |
|---|---|---|
| Generator angka acak lemah di seed script | CWE-338 / S2245 | **Diperbaiki** |
| Penggunaan `Math.random()` untuk kode voucher | Weak Cryptography | **Diperbaiki** |

**Perbaikan yang dilakukan:**
Mengganti `Math.random()` dengan `crypto.randomBytes()` — generator angka acak kelas kriptografi milik Node.js, sama standarnya dengan yang digunakan di sistem perbankan. Sekaligus menghilangkan 7 baris duplikat menjadi 1 fungsi helper (meningkatkan maintainability code).

---

## Enkripsi & Keamanan Data

| Data | Perlindungan |
|---|---|
| Password | bcrypt hash (tidak reversible) |
| PIN tabungan | bcrypt hash (tidak reversible) |
| Token sesi | SHA-256 hash (hanya hash yang disimpan di DB) |
| Data transmisi | HTTPS/TLS end-to-end |
| Kode voucher | CSPRNG (`crypto.randomBytes`) |
| Header HTTP | Helmet (CSP, HSTS, X-Frame-Options) |

---

&nbsp;

---

# BAB 7
## Database — Brankas Digital

---

## Apa yang Disimpan?

Database Byond Kids terdiri dari **25 tabel** yang saling terhubung. Berikut kelompok besarnya:

```
┌─────────────────────────────────────────────────────────────────┐
│                    25 TABEL DATABASE                            │
├──────────────────────┬──────────────────────────────────────────┤
│  Kelompok            │  Tabel yang Ada                         │
├──────────────────────┼──────────────────────────────────────────┤
│  Pengguna            │  users, parent_profiles, child_profiles  │
│  & Keluarga          │  family_links                           │
├──────────────────────┼──────────────────────────────────────────┤
│  Rekening            │  child_accounts, account_ledger         │
│  & Transaksi         │  parent_ledger, pocket_ledger           │
├──────────────────────┼──────────────────────────────────────────┤
│  Fitur Keuangan      │  pockets, chores, chore_submissions     │
│                      │  spending_limits, infaq_logs             │
│                      │  infaq_institution_configs              │
├──────────────────────┼──────────────────────────────────────────┤
│  Marketplace         │  voucher_catalog, voucher_redemptions   │
├──────────────────────┼──────────────────────────────────────────┤
│  E-Learning          │  learning_modules, learning_articles    │
│                      │  quizzes, quiz_questions                │
│                      │  learning_progresses, child_xp_balances │
├──────────────────────┼──────────────────────────────────────────┤
│  Keamanan            │  refresh_tokens, password_reset_tokens  │
│  & Audit             │  audit_logs                             │
└──────────────────────┴──────────────────────────────────────────┘
```

---

## Prinsip Keamanan Data Keuangan

### Riwayat Transaksi Tidak Bisa Dihapus

Seperti buku besar bank konvensional, semua transaksi finansial di Byond Kids bersifat **permanen dan tidak bisa diubah**:

```
account_ledger (Riwayat rekening anak)
  ┌─────┬──────┬────────────────────┬────────────┬──────────────┐
  │ No  │ Tipe │ Keterangan         │ Jumlah     │ Saldo Setelah│
  ├─────┼──────┼────────────────────┼────────────┼──────────────┤
  │ 001 │ MASUK│ Top-up dari Ayah   │ +Rp150.000 │ Rp 150.000  │
  │ 002 │ MASUK│ Reward hafalan     │ + Rp50.000 │ Rp 200.000  │
  │ 003 │KELUAR│ Beli voucher Shopee│ - Rp10.000 │ Rp 190.000  │
  │ 004 │KELUAR│ Infaq ke BAZNAS    │ - Rp 5.000 │ Rp 185.000  │
  └─────┴──────┴────────────────────┴────────────┴──────────────┘
  ← Hanya bisa ditambah, tidak bisa diubah atau dihapus →
```

### Nilai Uang Tanpa Risiko Kesalahan Pembulatan

Semua nilai uang disimpan dalam unit **sen** (bukan Rupiah dengan desimal) — teknik standar core banking untuk menghindari kesalahan pembulatan:

```
Rp 10.000  →  disimpan sebagai  1.000.000 sen
Rp 150.000 →  disimpan sebagai 15.000.000 sen
Rp   0.01  →  disimpan sebagai          1 sen
```

Tidak ada risiko Rp 150.000 menjadi Rp 149.999,99 akibat floating-point error.

---

## Infrastruktur Database (Production)

```
                    ┌──────────────────────┐
                    │   BACKEND SERVER     │
                    │   (Node.js)          │
                    └──────────┬───────────┘
                               │  Read + Write
                               ▼
                    ┌──────────────────────┐
                    │   VM1 — PRIMARY      │
                    │   PostgreSQL 15      │
                    │   192.168.23.67      │
                    │   (Brankas Utama)    │
                    └──────────┬───────────┘
                               │  Streaming Replication
                               │  (sinkron real-time)
                               ▼
                    ┌──────────────────────┐
                    │   VM2 — REPLICA      │
                    │   PostgreSQL 15      │
                    │   (Brankas Cadangan) │
                    │   Backup Otomatis    │
                    └──────────────────────┘
```

**Artinya:** Jika VM1 bermasalah, VM2 bisa langsung mengambil alih dengan data yang hampir sama persis (streaming replication). Tidak ada data yang hilang.

---

&nbsp;

---

# BAB 8
## Bagaimana Sistem Dibangun?

---

## Metodologi: AI-Assisted Development

Pengerjaan backend menggunakan pendekatan **Vibe Coding** — metode pengembangan software modern yang memanfaatkan AI (Claude, model dari Anthropic) sebagai *pair programmer* untuk mempercepat iterasi.

```
Proses Iteratif:

  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
  │  Spesifikasi │ ──► │  AI Generate │ ──►│   Developer  │
  │  Teknis oleh │    │  Kode        │    │   Review &   │
  │  Developer   │    │              │    │   Validasi   │
  └──────────────┘    └──────────────┘    └──────┬───────┘
          ▲                                       │
          └───────────────────────────────────────┘
                   (iterasi sampai sesuai)
```

**Ini bukan berarti AI yang bekerja, developer yang bekerja.** AI berperan sebagai asisten, bukan pengambil keputusan. Semua keputusan arsitektur, business rules, dan security controls tetap ditentukan dan divalidasi oleh developer.

---

## Standar Kualitas yang Diterapkan

Setiap baris kode yang di-generate AI melewati gate berikut sebelum masuk ke repository:

```
Gate 1: TypeScript Compile Check
   npx tsc --noEmit
   → Tidak boleh ada type error

Gate 2: Unit Test
   npm test
   → Semua test harus pass

Gate 3: Security Review
   SonarQube Scan
   → Zero Security Hotspot yang tidak di-resolve

Gate 4: Manual Review Developer
   → Business logic benar
   → Invariant keuangan terpenuhi
   → Tidak ada plain-text credential
```

---

## Timeline Pengembangan

```
FEB 2026          MAR 2026          MEI 2026          JUN 2026
    │                 │                 │                 │
    ▼                 ▼                 ▼                 ▼
┌───────┐         ┌───────┐         ┌───────┐         ┌───────┐
│  v1.0 │         │  v2.0 │         │  v3.0 │         │  v4.0 │
│       │         │       │         │       │         │       │
│ Auth  │         │Chores │         │Voucher│         │E-Learn│
│Family │    +    │Pockets│    +    │Admin  │    +    │XP Sys │
│Banking│         │Limits │         │Child  │         │Secure │
│       │         │Infaq  │         │Audit  │         │DB Mig │
└───────┘         └───────┘         └───────┘         └───────┘

    4 bulan pengembangan → 12 modul → 60+ API endpoint → 25 tabel database
```

---

&nbsp;

---

# BAB 9
## Angka-Angka yang Relevan

---

## Statistik Teknis Backend v4

```
┌─────────────────────────────────────────────────────┐
│                  SKALA SISTEM                       │
├──────────────────────────────────┬──────────────────┤
│  API Endpoint tersedia           │  60+             │
│  Tabel database                  │  25              │
│  Modul backend                   │  12              │
│  Middleware keamanan             │  5 lapisan        │
│  Unit test                       │  Ada (Jest 30)   │
├──────────────────────────────────┼──────────────────┤
│                  KEAMANAN        │                  │
├──────────────────────────────────┼──────────────────┤
│  Security Hotspot (SonarQube)    │  0 (setelah fix) │
│  Algoritma hash password         │  bcrypt cost 12  │
│  Durasi access token             │  8 menit         │
│  Durasi refresh token            │  7 hari          │
│  Max percobaan login             │  5x / 15 menit   │
├──────────────────────────────────┼──────────────────┤
│                  PERFORMA        │                  │
├──────────────────────────────────┼──────────────────┤
│  Target response time            │  < 500ms         │
│  Database primary                │  PostgreSQL VM1  │
│  Database replica                │  PostgreSQL VM2  │
│  Container                       │  Docker/K8s      │
└──────────────────────────────────┴──────────────────┘
```

---

&nbsp;

---

# BAB 10
## Roadmap ke Depan

---

## Yang Sudah Ada vs Yang Akan Datang

```
                        SUDAH ADA (v1–v4)
╔═══════════════════════════════════════════════════════╗
║  ✓ Auth & keamanan sesi                               ║
║  ✓ Manajemen keluarga digital                         ║
║  ✓ Banking digital (simulasi BSI)                     ║
║  ✓ Sistem tugas & reward otomatis                     ║
║  ✓ Kantong tabungan bertujuan                         ║
║  ✓ Batas pengeluaran anak                             ║
║  ✓ Infaq digital ke lembaga zakat                     ║
║  ✓ Marketplace voucher                                ║
║  ✓ E-Learning + XP + gamifikasi                       ║
║  ✓ Admin panel lengkap                                ║
║  ✓ Audit trail semua transaksi                        ║
║  ✓ Deployment ke Kubernetes + PostgreSQL VM           ║
╚═══════════════════════════════════════════════════════╝

                        DIRENCANAKAN (v5–v6)
╔═══════════════════════════════════════════════════════╗
║  ○ Integrasi BSI Open API real                        ║
║    (saldo sekarang simulasi; v5 pakai data rekening   ║
║    BSI sungguhan via API resmi)                       ║
║                                                       ║
║  ○ Push Notification                                  ║
║    (notifikasi real-time ke HP: reward cair,          ║
║     tugas baru, kuis tersedia)                        ║
║                                                       ║
║  ○ Recovery Password via Email                        ║
║    (sudah siap di kode, menunggu SMTP production)     ║
║                                                       ║
║  ○ Rekomendasi Konten Berbasis ML                     ║
║    (artikel e-learning yang dipersonalisasi per anak) ║
║                                                       ║
║  ○ Analytics Dashboard untuk Admin                   ║
║    (insight engagement, cohort analysis)              ║
╚═══════════════════════════════════════════════════════╝
```

---

&nbsp;

---

# BAB 11
## Ringkasan Teknis (Untuk IT Audience)

---

## Technology Stack

| Lapisan | Teknologi | Versi | Alasan Dipilih |
|---|---|---|---|
| Runtime | Node.js | 22 LTS | Performa I/O tinggi, native crypto built-in |
| Bahasa | TypeScript | 5.x | Type safety — mencegah bug di compile time |
| Framework | Express.js | 4.x | Minimalis, mature, ekosistem luas |
| ORM | Prisma | 5.x | Type-safe DB queries, migration support |
| Database | PostgreSQL | 15+ | ACID compliant, JSON support, UUID, BigInt |
| Auth | JWT + bcrypt | 9.x / 2.x | Stateless auth + hashing standar industri |
| Validasi | Zod | 3.x | Schema-first, TypeScript inference |
| Security | Helmet | 7.x | 15+ HTTP security headers otomatis |
| Container | Docker | 26.x | Reproducible build, non-root image |
| Orkestrasi | Kubernetes | 1.29+ | Auto-scaling, secret management, HA |
| Test | Jest | 30.x | Unit + integration test, coverage report |

---

## Struktur Endpoint API

```
/api/auth/         → Autentikasi & manajemen akun
/api/family/       → Relasi keluarga
/api/parent/       → Banking & monitoring orang tua
/api/chores/       → Tugas & reward
/api/pockets/      → Kantong tabungan
/api/limits/       → Spending limit
/api/infaq/        → Donasi zakat
/api/vouchers/     → Marketplace
/api/learning/     → E-Learning (child-facing)
/api/child/        → Dasbor anak
/api/admin/        → Admin panel (SUPER_ADMIN only)
/health            → Health check Kubernetes
```

**Total: 60+ endpoint** terdokumentasi di `docs/api-documentation.md`

---

## Keamanan — Compliance Check

| Standar | Control | Status |
|---|---|---|
| OWASP A01 (Broken Access Control) | RBAC per role, FamilyLink gate | Mitigated |
| OWASP A02 (Cryptographic Failures) | bcrypt, CSPRNG, HTTPS | Mitigated |
| OWASP A03 (Injection) | Prisma ORM (parameterized query) + Zod | Mitigated |
| OWASP A04 (Insecure Design) | Ledger immutable, atomic transaction | Mitigated |
| OWASP A07 (Auth Failures) | JWT rotation, lockout, rate limit | Mitigated |
| SonarQube S2245 (CWE-338) | Replaced Math.random → crypto.randomBytes | Resolved |

---

&nbsp;

---

# PENUTUP
## Byond Kids Backend v4 — Siap Production

---

## Apa yang Telah Dicapai

```
  SEBELUM                         SESUDAH
  (Konsep)                        (v4 Production Ready)
  ──────────────────────────────────────────────────────

  Ide platform edukasi       →    REST API backend lengkap
  keuangan anak                   12 modul, 60+ endpoint

  Belum ada sistem reward    →    Chores + E-Learning reward
                                  otomatis ke rekening anak

  Database development       →    PostgreSQL on-premise VM1
  (Supabase)                      + replica VM2 + K8s deploy

  Security baseline          →    0 SonarQube hotspot
                                  OWASP Top 10 mitigated

  Tidak ada dokumentasi      →    BRD v4, API docs, schema,
                                  tech stack, use case,
                                  prompt documentation
```

---

## Nilai Bisnis yang Didelivery

| Nilai | Implementasi |
|---|---|
| **Inklusi Keuangan Anak** | Rekening digital + pocket savings goals |
| **Parental Control** | Spending limits + real-time monitoring |
| **Gamifikasi Islami** | Chores + E-Learning + XP + reward koin |
| **Ekosistem BSI** | Integrasi nomor rekening BSI (simulasi, siap upgrade ke API real) |
| **Trust & Keamanan** | 5 lapisan keamanan, audit trail, enkripsi end-to-end |
| **Operasional** | Admin panel lengkap untuk tim BSI |

---

## Dokumentasi Lengkap

| Dokumen | Isi | Lokasi |
|---|---|---|
| BRD v4 | Bisnis, fitur, business rules, roadmap | `docs/BRD-v4.md` |
| Use Case | Diagram aktor + alur detail 4 use case kritis | `docs/use-case-diagram.md` |
| API Documentation | 60+ endpoint lengkap dengan request/response | `docs/api-documentation.md` |
| Schema Database | ERD + dokumentasi 25 tabel | `docs/schema-database.md` |
| Tech Stack | Stack, keamanan, env vars, struktur direktori | `docs/tech-stack.md` |
| Prompt Documentation | Log 9 sesi AI-assisted development + keputusan teknis | `docs/prompt-documentation.md` |
| Presentasi Ini | Overview produk untuk head level & non-IT | `docs/presentation-deck.md` |

---

&nbsp;

> **"Byond Kids bukan sekadar aplikasi tabungan anak.**
> **Ini adalah platform pembentuk kebiasaan keuangan syariah generasi digital Indonesia."**

---

*Dokumen ini disusun oleh IT Dev Team — Backend Byond Kids v4*
*Juni 2026*
