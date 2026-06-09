# Use Case Diagram — Byond Kids Backend
**Versi:** 4.0 | **Tanggal:** 2026-06-08

---

## Aktor Sistem

| Aktor | Deskripsi |
|---|---|
| **SUPER_ADMIN** | Administrator platform — akses penuh, kelola konten & pengguna |
| **PARENT** | Orang tua — kelola keuangan anak, buat tugas, monitoring |
| **CHILD** | Anak — kelola pocket, submit tugas, beli voucher, belajar |
| **System** | Proses otomatis (expired chore, ledger entry, XP accumulation) |

---

## Diagram Use Case — Keseluruhan Sistem

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BYOND KIDS BACKEND SYSTEM                            │
│                                                                             │
│  ┌──────────────┐    ┌──────────────────────────────────────────────────┐  │
│  │              │    │              AUTH & AKUN                          │  │
│  │ SUPER_ADMIN  │    │  ○ Register Akun Orang Tua                       │  │
│  │              │    │  ○ Login (Parent / Child / Admin)                 │  │
│  │    ┌─────────┼────┼► ○ Refresh Token                                 │  │
│  │    │         │    │  ○ Logout                                         │  │
│  │    │         │    │  ○ Lihat Info Akun Sendiri (/me)                  │  │
│  └────┼─────────┘    └──────────────────────────────────────────────────┘  │
│       │                                                                     │
│  ┌────┼─────────┐    ┌──────────────────────────────────────────────────┐  │
│  │    │         │    │            MANAJEMEN KELUARGA                     │  │
│  │  PARENT      │    │  ○ Buat Akun Anak Baru                            │  │
│  │    │         ├────┼► ○ Lihat Daftar Anak                              │  │
│  │    │         │    │  ○ Ganti Password / PIN Anak                      │  │
│  │    │         │    └──────────────────────────────────────────────────┘  │
│  │    │         │                                                          │
│  │    │         │    ┌──────────────────────────────────────────────────┐  │
│  │    │         │    │            BANKING ORANG TUA                      │  │
│  │    │         ├────┼► ○ Lihat Saldo & Rekening                         │  │
│  │    │         │    │  ○ Deposit Saldo                                  │  │
│  │    │         │    │  ○ Transfer ke Rekening Anak                      │  │
│  │    │         │    │  ○ Lihat Riwayat Transaksi                        │  │
│  │    │         │    └──────────────────────────────────────────────────┘  │
│  │    │         │                                                          │
│  │    │         │    ┌──────────────────────────────────────────────────┐  │
│  │    │         │    │                CHORES / TUGAS                     │  │
│  │    │         ├────┼► ○ Buat Chore (+ reward amount + deadline)        │  │
│  │    │         │    │  ○ Update / Batalkan Chore                        │  │
│  │    │         │    │  ○ Approve Chore → Reward Otomatis Cair           │  │
│  │    │         │    │  ○ Reject Chore (dengan catatan)                  │  │
│  └────┼─────────┘    └──────────────────────────────────────────────────┘  │
│       │                                                                     │
│  ┌────┼─────────┐    ┌──────────────────────────────────────────────────┐  │
│  │    │         │    │              SPENDING LIMIT                       │  │
│  │    │         ├────┼► ○ Set Limit Umum per Periode (Harian/Mingguan)   │  │
│  │    │         │    │  ○ Set Limit per Kategori Voucher (misal: Game)   │  │
│  │    │         │    │  ○ Lihat Semua Limit Aktif Anak                   │  │
│  │    │         │    └──────────────────────────────────────────────────┘  │
│  │  PARENT      │                                                          │
│  │    │         │    ┌──────────────────────────────────────────────────┐  │
│  │    │         │    │           MONITORING ANAK                         │  │
│  │    │         ├────┼► ○ Lihat Ringkasan Keuangan Anak                  │  │
│  │    │         │    │  ○ Lihat Semua Pocket Anak                        │  │
│  │    │         │    │  ○ Lihat Detail Pocket Anak                       │  │
│  └────┼─────────┘    └──────────────────────────────────────────────────┘  │
│       │                                                                     │
│  ┌────┼─────────┐    ┌──────────────────────────────────────────────────┐  │
│  │    │         │    │             SELF-SERVICE ANAK                     │  │
│  │    │         ├────┼► ○ Lihat Dashboard                                │  │
│  │    │         │    │  ○ Lihat Profil & Rekening                        │  │
│  │    │         │    │  ○ Lihat Riwayat Transaksi                        │  │
│  │  CHILD       │    │  ○ Update Avatar                                  │  │
│  │    │         │    └──────────────────────────────────────────────────┘  │
│  │    │         │                                                          │
│  │    │         │    ┌──────────────────────────────────────────────────┐  │
│  │    │         │    │               POCKET / TABUNGAN TUJUAN            │  │
│  │    │         ├────┼► ○ Buat Pocket (nama, kategori, target, deadline) │  │
│  │    │         │    │  ○ Alokasikan Saldo ke Pocket                     │  │
│  │    │         │    │  ○ Tarik Saldo dari Pocket                        │  │
│  │    │         │    │  ○ Lihat Detail Pocket                            │  │
│  │    │         │    │  ○ Nonaktifkan Pocket                             │  │
│  │    │         │    └──────────────────────────────────────────────────┘  │
│  │    │         │                                                          │
│  │    │         │    ┌──────────────────────────────────────────────────┐  │
│  │    │         │    │                 CHORES (ANAK)                     │  │
│  │    │         ├────┼► ○ Lihat Daftar Tugas yang Ditugaskan             │  │
│  │    │         │    │  ○ Submit Bukti Penyelesaian Tugas                 │  │
│  │    │         │    └──────────────────────────────────────────────────┘  │
│  │    │         │                                                          │
│  │    │         │    ┌──────────────────────────────────────────────────┐  │
│  │    │         │    │              INFAQ / SEDEKAH                      │  │
│  │    │         ├────┼► ○ Lihat Daftar Lembaga Infaq Aktif               │  │
│  │    │         │    │  ○ Kirim Infaq ke Lembaga Pilihan                 │  │
│  │    │         │    │  ○ Lihat Riwayat Infaq Pribadi                    │  │
│  │    │         │    └──────────────────────────────────────────────────┘  │
│  │    │         │                                                          │
│  │    │         │    ┌──────────────────────────────────────────────────┐  │
│  │    │         │    │             VOUCHER MARKETPLACE                   │  │
│  │    │         ├────┼► ○ Lihat Katalog Voucher (filter kategori/tipe)   │  │
│  │    │         │    │  ○ Beli Voucher (cek saldo, limit, stok)          │  │
│  │    │         │    │  ○ Lihat Riwayat Pembelian                        │  │
│  │    │         │    └──────────────────────────────────────────────────┘  │
│  │    │         │                                                          │
│  │    │         │    ┌──────────────────────────────────────────────────┐  │
│  │  CHILD       │    │               E-LEARNING (v4)                    │  │
│  │    │         ├────┼► ○ Lihat Modul Pembelajaran                       │  │
│  │    │         │    │  ○ Baca Artikel & Tandai Selesai (+ XP)           │  │
│  │    │         │    │  ○ Ambil Kuis (1x per artikel)                    │  │
│  │    │         │    │  ○ Submit Jawaban Kuis (+ XP bonus + reward koin) │  │
│  │    │         │    │  ○ Lihat Progress & Level XP                      │  │
│  └────┼─────────┘    └──────────────────────────────────────────────────┘  │
│       │                                                                     │
│  ┌────┼─────────────┐ ┌────────────────────────────────────────────────┐   │
│  │ SUPER_ADMIN      │ │              ADMIN PANEL                        │   │
│  │    │             ├─┼► ○ Lihat Statistik Platform                     │   │
│  │    │             │ │  ○ Kelola Akun Parent (aktif/nonaktif, saldo)    │   │
│  │    │             │ │  ○ Kelola Akun Anak (aktif/nonaktif)            │   │
│  │    │             │ │  ○ Kelola Katalog Voucher (CRUD)                │   │
│  │    │             │ │  ○ Kelola Lembaga Infaq (CRUD)                  │   │
│  │    │             │ │  ○ Lihat Log & Statistik Infaq                  │   │
│  │    │             │ │  ○ Kelola Modul E-Learning (CRUD)               │   │
│  │    │             │ │  ○ Kelola Artikel & Kuis (CRUD)                 │   │
│  │    │             │ │  ○ Lihat Statistik E-Learning                   │   │
│  │    │             │ │  ○ Lihat Audit Log Seluruh Platform             │   │
│  └────┼─────────────┘ └────────────────────────────────────────────────┘   │
└───────┼─────────────────────────────────────────────────────────────────────┘
        │
  ┌─────▼──────┐
  │   System   │  ○ Cek & Update Chore EXPIRED (cron/trigger)
  │ (Otomatis) │  ○ Ledger Entry pada setiap transaksi (append-only)
  │            │  ○ Rotasi Refresh Token
  │            │  ○ Akumulasi XP & Update Level
  └────────────┘
```

---

## Detail Use Case per Fitur

### UC-01: Transfer Saldo ke Anak

```
Aktor Utama  : PARENT
Pre-condition : Parent login, saldo cukup, anak terhubung via FamilyLink
Post-condition: Saldo parent berkurang, saldo anak bertambah, kedua ledger ter-update

Alur Normal:
1. Parent masukkan childId, amount, dan PIN konfirmasi
2. Sistem verifikasi PIN parent
3. Sistem cek saldo parent ≥ amount
4. Sistem jalankan $transaction:
   a. Debit saldo parent (ParentLedger: TRANSFER_TO_CHILD)
   b. Kredit saldo anak (AccountLedger: TOP_UP_FROM_PARENT)
5. Sistem kembalikan saldo terbaru kedua pihak

Alur Alternatif:
- PIN salah → Error 401
- Saldo tidak cukup → Error 400
- Anak tidak terhubung ke parent → Error 403
```

### UC-02: Approve Chore → Reward Otomatis

```
Aktor Utama  : PARENT
Pre-condition : Chore berstatus PENDING_REVIEW, parent adalah pembuat chore
Post-condition: Reward masuk rekening anak, chore APPROVED, kedua ledger ter-update

Alur Normal:
1. Parent kirim approve untuk choreId
2. Sistem verifikasi parent adalah pemilik chore
3. Sistem cek status chore = PENDING_REVIEW
4. Sistem ambil rewardAmount dari chore
5. Sistem cek saldo parent ≥ rewardAmount
6. Sistem jalankan $transaction:
   a. Debit saldo parent (ParentLedger: CHORE_REWARD)
   b. Kredit saldo anak (AccountLedger: CHORE_REWARD)
   c. Update status chore → APPROVED
7. Sistem kembalikan data chore + saldo terbaru
```

### UC-03: Submit Kuis E-Learning

```
Aktor Utama  : CHILD
Pre-condition : Anak login, sudah menyelesaikan artikel (readCompletedAt terisi),
                kuis belum pernah diambil (quizScore = null)
Post-condition: Skor tersimpan, XP bonus diberikan, reward koin dicreditkan jika lulus

Alur Normal:
1. Anak kirim array jawaban (questionId + optionIndex)
2. Sistem cek progress — pastikan belum ada quizScore
3. Sistem hitung skor dari jawaban
4. Sistem update LearningProgress (quizScore, quizPassedAt)
5. Jika lulus (skor ≥ passScore):
   a. Sistem cari parent via FamilyLink
   b. Sistem debit saldo parent (coinReward)
   c. Sistem kredit saldo anak
   d. Sistem grant XP bonus → update ChildXpBalance + level
6. Sistem kembalikan skor, XP diperoleh, dan jawaban lengkap (dengan isCorrect)

Alur Alternatif:
- Kuis sudah pernah diambil → Error QUIZ_ALREADY_TAKEN (403)
- Artikel belum diselesaikan → Error 400
- Parent tidak punya saldo cukup → Error 400
```

### UC-04: Beli Voucher

```
Aktor Utama  : CHILD
Pre-condition : Anak login, saldo cukup, voucher aktif dan ada stok
Post-condition: Saldo anak berkurang, stok berkurang, VoucherRedemption dibuat

Alur Normal:
1. Anak kirim voucherId dan PIN konfirmasi
2. Sistem verifikasi PIN anak
3. Sistem ambil data voucher (aktif, stok > 0)
4. Sistem cek limit harian/mingguan anak untuk kategori voucher ini
5. Sistem cek maxPerChild (berapa kali anak ini sudah beli voucher ini)
6. Sistem cek saldo anak ≥ harga voucher
7. Sistem jalankan $transaction:
   a. Debit saldo anak (AccountLedger: VOUCHER_PURCHASE)
   b. Kurangi stok voucher
   c. Buat VoucherRedemption
8. Sistem kembalikan kode voucher

Alur Alternatif:
- Saldo tidak cukup → Error 400
- Limit spending terlampaui → Error 400 + detail limit
- Stok habis → Error 400
- MaxPerChild terlampaui → Error 400
```

---

## Matriks Hak Akses

| Fitur | SUPER_ADMIN | PARENT | CHILD | PUBLIC |
|---|:---:|:---:|:---:|:---:|
| Register / Login | | ✓ | ✓ | ✓ |
| Kelola Profil Sendiri | ✓ | ✓ | sebagian | |
| Lihat Anak Sendiri | | ✓ | | |
| Banking & Transfer | | ✓ | | |
| Buat & Review Chores | | ✓ | | |
| Submit Chore | | | ✓ | |
| Kelola Pocket | | | ✓ | |
| Spending Limit | | ✓ set | ✓ terkena | |
| Infaq | | | ✓ | ✓ lihat |
| Beli Voucher | | | ✓ | |
| E-Learning | | | ✓ | |
| Admin Panel | ✓ | | | |
| Audit Log | ✓ | | | |
| Kelola Konten Learning | ✓ | | | |
| Kelola Lembaga Infaq | ✓ | | | |
| Kelola Voucher Catalog | ✓ | | | |
