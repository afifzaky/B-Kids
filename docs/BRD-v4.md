# Business Requirements Document (BRD)
## Byond Kids — Backend API
**Versi:** 4.0
**Tanggal:** 2026-06-08
**Status:** Final — Production Ready

---

## 1. Informasi Dokumen

| Atribut | Detail |
|---|---|
| Nama Produk | Byond Kids |
| Versi Dokumen | v4.0 |
| Versi Backend | v4 (branch: `backend/b-kids`) |
| Tipe Sistem | REST API Backend |
| Platform | Node.js + Express + PostgreSQL |
| Deployment Target | Kubernetes (VM1: PostgreSQL, VM2: Replica) |

### Riwayat Versi

| Versi | Tanggal | Perubahan Utama |
|---|---|---|
| v1.0 | 2026-02 | Auth, Family, Parent Banking dasar |
| v2.0 | 2026-03 | Chores, Pockets, Spending Limits, Infaq |
| v3.0 | 2026-05 | Voucher Marketplace, Admin Panel, Child Self-Service, Audit Log |
| v4.0 | 2026-06 | E-Learning + XP/Level System, Security hardening, DB migration ke VM PostgreSQL |

---

## 2. Ringkasan Eksekutif

**Byond Kids** adalah platform edukasi keuangan syariah berbasis BSI Digital Banking yang dirancang untuk anak-anak dan orang tua. Backend ini menyediakan REST API untuk:

- Manajemen akun keluarga (orang tua + anak)
- Tabungan digital anak berbasis rekening BSI (simulasi)
- Sistem reward berbasis tugas harian (Chores)
- Kantong tabungan bertujuan (Pockets/Goals)
- Marketplace voucher edukasi, gaming, dan e-wallet
- Infaq/sedekah ke lembaga zakat nasional
- E-Learning dengan sistem XP, level, dan reward kuis
- Panel administrasi platform untuk SUPER_ADMIN

---

## 3. Tujuan Bisnis

| ID | Tujuan | Indikator Keberhasilan |
|---|---|---|
| B-01 | Memperkenalkan konsep menabung pada anak sejak dini | Anak memiliki minimal 1 pocket aktif |
| B-02 | Mendorong anak belajar tanggung jawab melalui tugas rumah | Chore completion rate ≥ 70% |
| B-03 | Meningkatkan literasi keuangan syariah anak | Modul e-learning dikonsumsi, kuis diselesaikan |
| B-04 | Memfasilitasi infaq digital untuk anak | Transaksi infaq ke lembaga zakat terdaftar |
| B-05 | Memberi orang tua kontrol penuh atas keuangan anak | Spending limits aktif, monitoring real-time |
| B-06 | Mendukung ekosistem BSI Digital Banking | Integrasi nomor rekening BSI, simulasi transfer |

---

## 4. Ruang Lingkup

### Dalam Ruang Lingkup (In-Scope)

- Manajemen akun pengguna (PARENT, CHILD, SUPER_ADMIN)
- Autentikasi dan otorisasi berbasis JWT + RBAC
- Manajemen saldo dummy (simulasi BSI Open API)
- Sistem tabungan pocket dengan tujuan dan deadline
- Sistem chores + reward otomatis
- Spending limit harian/mingguan/bulanan
- Infaq ke lembaga zakat terdaftar
- Marketplace voucher
- E-Learning: artikel + kuis + XP + reward koin
- Admin panel: user management, voucher, infaq, statistik
- Audit trail semua transaksi sensitif
- Security: JWT rotation, rate limiting, bcrypt, CSPRNG, helmet

### Di Luar Ruang Lingkup (Out-of-Scope)

- Integrasi BSI Open API real (saat ini simulasi)
- Push notification (mobile)
- Upload media (foto profil/chore submission menggunakan URL eksternal)
- Fitur recover password via email (nonaktif sementara, menunggu SMTP production)
- Frontend/mobile application

---

## 5. Aktor dan Peran

### 5.1 SUPER_ADMIN
Administrator platform dengan akses penuh ke semua data.

**Hak Akses:**
- Melihat statistik platform (total user, transaksi, infaq)
- Mengelola akun orang tua (aktif/nonaktif, koreksi saldo)
- Mengelola akun anak (aktif/nonaktif)
- Mengelola katalog voucher (CRUD)
- Mengelola lembaga infaq (CRUD)
- Melihat semua log infaq
- Membuat dan mengelola konten E-Learning (modul, artikel, kuis)
- Melihat audit log semua aktivitas

### 5.2 PARENT (Orang Tua)
Pengguna dewasa yang mengelola akun anak.

**Hak Akses:**
- Registrasi dan login
- Membuat akun anak (maksimal yang ditentukan sistem)
- Deposit ke saldo sendiri, transfer ke rekening anak
- Membuat chores dan menetapkan reward
- Mereview dan approve/reject submission chore anak
- Mengatur spending limit anak (umum + per kategori)
- Memantau saldo, pocket, dan transaksi anak
- Mengelola profil pribadi (nama, email, password, PIN tabungan)
- Mengganti password dan PIN anak

### 5.3 CHILD (Anak)
Pengguna anak dengan akses terbatas sesuai konfigurasi orang tua.

**Hak Akses:**
- Login dengan username + PIN
- Melihat dashboard, saldo, dan riwayat transaksi
- Membuat dan mengelola pocket tabungan
- Mengalokasikan saldo ke pocket
- Melihat dan submit tugas (chores) yang ditetapkan orang tua
- Membeli voucher dari saldo
- Melakukan infaq ke lembaga terdaftar
- Mengakses konten E-Learning (artikel)
- Mengikuti kuis dan mendapatkan XP + reward koin
- Memperbarui avatar

---

## 6. Kebutuhan Fungsional

### 6.1 Modul Autentikasi (AUTH)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-AUTH-01 | Registrasi akun orang tua dengan email, nomor HP, NIK, nomor rekening BSI | HIGH |
| F-AUTH-02 | Login orang tua dengan email + password | HIGH |
| F-AUTH-03 | Login admin dengan email + password | HIGH |
| F-AUTH-04 | Login anak dengan username + password (PIN) | HIGH |
| F-AUTH-05 | Refresh access token menggunakan refresh token | HIGH |
| F-AUTH-06 | Logout (revoke refresh token) | HIGH |
| F-AUTH-07 | Akses informasi akun sendiri (`/me`) | HIGH |
| F-AUTH-08 | Orang tua ganti nama/avatar, email, password, PIN | MEDIUM |
| F-AUTH-09 | Orang tua buat akun anak baru | HIGH |
| F-AUTH-10 | Orang tua ganti password/PIN anak | MEDIUM |
| F-AUTH-11 | *(Nonaktif)* Reset password via email | LOW |

### 6.2 Modul Keluarga (FAMILY)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-FAM-01 | Orang tua melihat daftar semua anak yang terhubung | HIGH |

### 6.3 Modul Banking Orang Tua (PARENT BANKING)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-BNK-01 | Orang tua melihat saldo dan info rekening | HIGH |
| F-BNK-02 | Orang tua melihat riwayat transaksi | HIGH |
| F-BNK-03 | Orang tua melakukan deposit ke saldo dummy | MEDIUM |
| F-BNK-04 | Orang tua transfer saldo ke rekening anak (butuh PIN konfirmasi) | HIGH |

### 6.4 Modul Chores / Tugas (CHORES)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-CHR-01 | Orang tua membuat chore untuk anak tertentu dengan reward amount dan deadline | HIGH |
| F-CHR-02 | Orang tua melihat semua chore yang dibuat | HIGH |
| F-CHR-03 | Orang tua update atau batalkan chore yang masih ACTIVE | MEDIUM |
| F-CHR-04 | Anak melihat chore yang ditugaskan padanya | HIGH |
| F-CHR-05 | Anak submit bukti penyelesaian (URL media + catatan) | HIGH |
| F-CHR-06 | Orang tua approve chore → reward langsung masuk rekening anak | HIGH |
| F-CHR-07 | Orang tua reject chore dengan catatan | HIGH |
| F-CHR-08 | Alur revisi: jika submit pertama di-reject dengan REVISION_NEEDED, anak bisa submit ulang | MEDIUM |

**Business Rules Chores:**
- Maksimal 2x submission per chore
- Submission ke-1 bisa di-revisi (REVISION_NEEDED) atau di-reject final
- Submission ke-2 langsung APPROVED atau REJECTED
- Reward masuk ke Tabungan Utama anak, didebit dari saldo orang tua
- Chore yang melewati deadline otomatis EXPIRED

### 6.5 Modul Pocket / Tabungan Tujuan (POCKETS)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-PKT-01 | Anak membuat pocket dengan kategori dan target | HIGH |
| F-PKT-02 | Anak mengalokasikan saldo dari Tabungan Utama ke pocket | HIGH |
| F-PKT-03 | Anak menarik saldo dari pocket kembali ke Tabungan Utama | MEDIUM |
| F-PKT-04 | Anak melihat semua pocket dan detailnya | HIGH |
| F-PKT-05 | Anak menonaktifkan pocket (saldo ditarik otomatis ke Tabungan Utama) | MEDIUM |

**Kategori Pocket:** JAJAN, HAJI, QURBAN, INFAQ, CUSTOM

### 6.6 Modul Spending Limit (LIMITS)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-LMT-01 | Orang tua mengatur batas pengeluaran umum per periode | HIGH |
| F-LMT-02 | Orang tua mengatur batas per kategori voucher (misal: game) | MEDIUM |
| F-LMT-03 | Sistem cek spending limit saat anak beli voucher/infaq | HIGH |
| F-LMT-04 | Orang tua melihat semua limit aktif untuk anak | MEDIUM |

### 6.7 Modul Infaq / Sedekah (INFAQ)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-INF-01 | Publik melihat daftar lembaga infaq yang aktif | HIGH |
| F-INF-02 | Anak melakukan infaq ke lembaga pilihan | HIGH |
| F-INF-03 | Anak melihat riwayat infaq miliknya | MEDIUM |

### 6.8 Modul Voucher (VOUCHERS)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-VCH-01 | Anak melihat katalog voucher aktif (filter kategori/tipe) | HIGH |
| F-VCH-02 | Anak membeli voucher dari saldo (cek limit, stok, maxPerChild) | HIGH |
| F-VCH-03 | Anak melihat riwayat pembelian voucher | MEDIUM |

**Tipe Voucher:** DISCOUNT, GAME_TOPUP, E_WALLET, EDUCATION

### 6.9 Modul E-Learning (LEARNING) — *Baru v4*

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-LRN-01 | Anak melihat daftar modul e-learning yang dipublikasikan | HIGH |
| F-LRN-02 | Anak melihat daftar artikel dalam modul | HIGH |
| F-LRN-03 | Anak membaca artikel dan menandai selesai | HIGH |
| F-LRN-04 | Menyelesaikan artikel memberikan XP ke saldo XP anak | HIGH |
| F-LRN-05 | Anak mengambil kuis untuk artikel tertentu | HIGH |
| F-LRN-06 | Kuis hanya bisa diambil 1 kali per artikel per anak | HIGH |
| F-LRN-07 | Jika kuis lulus (skor ≥ passScore), reward koin dicreditkan ke rekening anak | HIGH |
| F-LRN-08 | Jawaban benar tidak dikirim ke klien sebelum kuis disubmit | HIGH |
| F-LRN-09 | Anak melihat progress dan XP/level keseluruhan | MEDIUM |

**Sistem XP dan Level:**
| Level | Nama | XP Dibutuhkan |
|---|---|---|
| 1 | Pemula | 0 – 99 XP |
| 2 | Pelajar | 100 – 249 XP |
| 3 | Cerdas | 250 – 499 XP |
| 4 | Pintar | 500 – 999 XP |
| 5 | Jenius | 1000+ XP |

### 6.10 Modul Admin Panel (ADMIN)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-ADM-01 | Admin melihat statistik platform secara keseluruhan | HIGH |
| F-ADM-02 | Admin melihat dan mencari daftar semua parent | HIGH |
| F-ADM-03 | Admin melihat detail parent beserta semua anaknya | HIGH |
| F-ADM-04 | Admin aktifkan/nonaktifkan akun parent | HIGH |
| F-ADM-05 | Admin koreksi saldo parent secara manual | MEDIUM |
| F-ADM-06 | Admin melihat riwayat transaksi parent | MEDIUM |
| F-ADM-07 | Admin melihat daftar semua anak | HIGH |
| F-ADM-08 | Admin aktifkan/nonaktifkan akun anak | HIGH |
| F-ADM-09 | Admin melihat audit log semua aktivitas | HIGH |
| F-ADM-10 | Admin CRUD katalog voucher | HIGH |
| F-ADM-11 | Admin melihat riwayat semua redemption voucher | MEDIUM |
| F-ADM-12 | Admin CRUD lembaga infaq | HIGH |
| F-ADM-13 | Admin melihat log dan statistik infaq | MEDIUM |
| F-ADM-14 | Admin CRUD modul dan artikel e-learning | HIGH |
| F-ADM-15 | Admin buat/ganti/hapus kuis untuk artikel | HIGH |
| F-ADM-16 | Admin melihat statistik engagement e-learning | MEDIUM |

---

## 7. Kebutuhan Non-Fungsional

| ID | Kategori | Kebutuhan |
|---|---|---|
| NF-01 | Keamanan | Semua password di-hash dengan bcrypt (cost 12) |
| NF-02 | Keamanan | JWT access token expire 8 menit, refresh token 7 hari, dengan rotasi |
| NF-03 | Keamanan | Rate limiting: 100 req/15 menit global, 5 req/15 menit untuk login |
| NF-04 | Keamanan | CORS hanya izinkan origin yang dikonfigurasi |
| NF-05 | Keamanan | Semua header keamanan via Helmet (CSP, HSTS, COEP, CORP) |
| NF-06 | Keamanan | CSPRNG (`crypto.randomBytes`) untuk semua token/kode acak |
| NF-07 | Keamanan | Audit log untuk semua aksi sensitif admin |
| NF-08 | Data | Semua nilai uang disimpan dalam sen (IDR × 100) sebagai BigInt |
| NF-09 | Data | Ledger bersifat append-only (tidak ada UPDATE/DELETE pada transaksi) |
| NF-10 | Data | Semua transaksi menggunakan Prisma `$transaction` untuk atomicity |
| NF-11 | Performa | Semua endpoint list mendukung pagination (`page`, `limit`) |
| NF-12 | Performa | Response time target < 500ms untuk operasi non-transaksi |
| NF-13 | Availability | Health check endpoint untuk monitoring Kubernetes |
| NF-14 | Maintainability | Kode menggunakan TypeScript strict mode |
| NF-15 | Maintainability | Validasi input dengan Zod di setiap endpoint |

---

## 8. Aturan Bisnis

### 8.1 Saldo dan Transaksi
- Saldo disimpan dalam sen (misal: Rp 10.000 = `1000000` BigInt)
- Saldo tidak boleh negatif — semua debit harus cek saldo dulu
- Semua perubahan saldo dicatat di ledger (AccountLedger / ParentLedger)
- Transaksi menggunakan database transaction untuk konsistensi

### 8.2 Autentikasi
- Akun terkunci setelah 5 kali gagal login (lockout 15 menit)
- Refresh token dirotasi setiap penggunaan (refresh token lama invalid)
- Satu refresh token per sesi — logout menghapus token dari DB

### 8.3 Chores
- Reward chore didebit dari saldo orang tua, dikreditkan ke Tabungan Utama anak
- Orang tua hanya bisa approve chore anak yang terhubung dengannya (FamilyLink)
- Chore hanya bisa dibatalkan selama masih ACTIVE

### 8.4 Spending Limit
- Pembelian voucher mengecek semua limit aktif (umum + kategori spesifik)
- Infaq dikecualikan dari spending limit secara default (`excludeInfaq: true`)
- NULL `voucherType` = limit umum untuk semua transaksi

### 8.5 E-Learning
- Kuis hanya bisa diambil satu kali per artikel per anak
- Jawaban benar tidak dikirim ke klien sebelum kuis disubmit
- Reward koin didebit dari saldo orang tua (FamilyLink) ke rekening anak
- XP bersifat akumulatif dan tidak bisa berkurang
- Artikel bisa publish/unpublish tanpa menghapus progress anak

---

## 9. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT APPS                       │
│         Mobile App (iOS/Android) · Web App         │
└─────────────────────┬───────────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────┐
│              Kubernetes Cluster                     │
│  ┌──────────────────────────────────────────────┐   │
│  │          Byond Kids Backend (Node.js)        │   │
│  │     Express · TypeScript · Prisma ORM        │   │
│  │     JWT Auth · Zod Validation · Helmet       │   │
│  └─────────────────────┬────────────────────────┘   │
│                        │                            │
│  ┌─────────────────────▼────────────────────────┐   │
│  │           PostgreSQL VM1 (Primary)           │   │
│  │        192.168.23.67:5432/bkidsdb            │   │
│  └─────────────────────┬────────────────────────┘   │
│                        │ Streaming Replication       │
│  ┌─────────────────────▼────────────────────────┐   │
│  │           PostgreSQL VM2 (Replica)           │   │
│  │              Backup Storage                  │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Komponen Utama

| Komponen | Teknologi | Fungsi |
|---|---|---|
| API Server | Express.js + TypeScript | Request routing, middleware, controller |
| ORM | Prisma 5 | Database query, migrations, type safety |
| Auth | JWT (jsonwebtoken) | Access + refresh token management |
| Validation | Zod | Request body / param validation |
| Security | Helmet, bcrypt, crypto | Headers, password hash, CSPRNG |
| Database Primary | PostgreSQL (VM1) | Main read/write database |
| Database Replica | PostgreSQL (VM2) | Read replica + backup |
| Container | Docker + Kubernetes | Deployment orchestration |

---

## 10. Modul Backend (Struktur)

```
src/modules/
├── auth/          → Autentikasi, profil, manajemen akun anak
├── family/        → Daftar anak per orang tua
├── parent/        → Banking, deposit, transfer, monitoring anak
├── chores/        → Tugas, submission, approval, reward
├── pockets/       → Pocket tabungan, alokasi, penarikan
├── limits/        → Spending limit per periode/kategori
├── infaq/         → Sedekah ke lembaga zakat
├── vouchers/      → Marketplace voucher, pembelian
├── learning/      → E-Learning: artikel, kuis, XP, progress
├── child/         → Dashboard dan self-service anak
├── admin/         → Admin panel seluruh platform
└── health/        → Health check endpoint
```

---

## 11. Roadmap

| Fase | Versi | Target | Status |
|---|---|---|---|
| Phase 1 | v1.0 | Auth + Family + Parent Banking | Selesai |
| Phase 2 | v2.0 | Chores + Pockets + Limits + Infaq | Selesai |
| Phase 3 | v3.0 | Voucher + Admin + Child Self-Service + Audit | Selesai |
| Phase 4 | v4.0 | E-Learning + XP System + Security Hardening | Selesai |
| Phase 5 | v5.0 | Integrasi BSI Open API real, Push Notification | Direncanakan |
| Phase 6 | v6.0 | Analytics Dashboard, ML Recommendation | Direncanakan |

---

## 12. Glosarium

| Istilah | Definisi |
|---|---|
| Tabungan Utama | Rekening utama anak (`ChildAccount`) — sumber saldo sebelum dibagi ke pocket |
| Pocket | Kantong tabungan tujuan milik anak (Jajan, Haji, Qurban, dll.) |
| Chore | Tugas yang diberikan orang tua ke anak, dengan reward jika selesai |
| Infaq | Donasi/sedekah ke lembaga zakat terdaftar |
| Dummy Balance | Saldo simulasi orang tua (akan diganti BSI Open API di fase selanjutnya) |
| Sen | Satuan terkecil IDR = 1/100 Rupiah. Saldo 10000000 = Rp 100.000 |
| XP | Experience Points — poin dari aktivitas e-learning, menentukan level |
| FamilyLink | Relasi orang tua ↔ anak yang mengotorisasi berbagai transaksi |
| CSPRNG | Cryptographically Secure Pseudo-Random Number Generator |
| RBAC | Role-Based Access Control (SUPER_ADMIN, PARENT, CHILD) |
