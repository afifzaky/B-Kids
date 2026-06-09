# API Documentation — Byond Kids Backend
**Versi:** 4.0 | **Tanggal:** 2026-06-08
**Base URL:** `http://localhost:4000` (development) | `https://api.byondkids.id` (production)

---

## Konvensi Umum

### Format Response

**Sukses:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Pesan sukses"
}
```

**Error:**
```json
{
  "success": false,
  "message": "Pesan error",
  "code": "ERROR_CODE"
}
```

### Autentikasi
Semua endpoint yang memerlukan auth menggunakan `Authorization: Bearer <access_token>` di header.

### Role Akses
- `[PUBLIC]` — Tidak perlu token
- `[PARENT]` — Token dengan role `PARENT`
- `[CHILD]` — Token dengan role `CHILD`
- `[ADMIN]` — Token dengan role `SUPER_ADMIN`
- `[ANY]` — Token valid (role apa saja)

### Nilai Uang
Semua nilai uang dalam response sudah dikonversi ke **Rupiah** (string, misal: `"Rp 150.000"`).
Semua nilai uang dalam request dikirim dalam **Rupiah penuh** (integer, misal: `150000` untuk Rp 150.000).

### Pagination
Endpoint list mendukung query params: `?page=1&limit=10&search=keyword`

---

## 00 · Health Check

### GET /health
Cek status server.

**Auth:** `[PUBLIC]`

**Response 200:**
```json
{
  "status": "ok",
  "uptime": 12345.67,
  "timestamp": "2026-06-08T10:00:00.000Z"
}
```

---

### GET /health/detailed
Cek status server + koneksi database.

**Auth:** `[ADMIN]`

**Response 200:**
```json
{
  "status": "ok",
  "database": "connected",
  "uptime": 12345.67,
  "timestamp": "2026-06-08T10:00:00.000Z"
}
```

---

## 01 · Auth — Public

### POST /api/auth/register/parent
Registrasi akun orang tua baru.

**Auth:** `[PUBLIC]`

**Request Body:**
```json
{
  "email": "budi@example.com",
  "phone": "08123456789",
  "password": "Byond@2026",
  "fullName": "Budi Santoso",
  "nik": "3171234567890001",
  "dateOfBirth": "1985-04-15",
  "bsiAccountNumber": "7123456789",
  "pin": "123456"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Akun orang tua berhasil dibuat",
  "data": {
    "userId": "uuid",
    "email": "budi@example.com",
    "role": "PARENT"
  }
}
```

**Error:**
- `400` — Email/NIK/nomor rekening sudah terdaftar
- `422` — Validasi input gagal

---

### POST /api/auth/login/parent
Login orang tua.

**Auth:** `[PUBLIC]`

**Request Body:**
```json
{
  "email": "budi.santoso@demo.byond.id",
  "password": "Byond@2026"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": {
      "id": "uuid",
      "email": "budi.santoso@demo.byond.id",
      "role": "PARENT",
      "profile": {
        "id": "uuid",
        "fullName": "Budi Santoso",
        "avatarUrl": null
      }
    }
  }
}
```

**Error:**
- `401` — Email atau password salah
- `403` — Akun terkunci (terlalu banyak percobaan)
- `403` — Akun nonaktif

---

### POST /api/auth/login/admin
Login SUPER_ADMIN.

**Auth:** `[PUBLIC]`

**Request Body:**
```json
{
  "email": "admin@byond.id",
  "password": "Admin@Byond2026!"
}
```

**Response 200:** Sama seperti login parent, role = `SUPER_ADMIN`.

---

### POST /api/auth/login/child
Login anak dengan username + password.

**Auth:** `[PUBLIC]`

**Request Body:**
```json
{
  "username": "aisha_byond",
  "password": "123456"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": {
      "id": "uuid",
      "role": "CHILD",
      "profile": {
        "id": "uuid",
        "fullName": "Aisha Ramadhani",
        "avatar": null
      }
    }
  }
}
```

---

### POST /api/auth/refresh
Refresh access token menggunakan refresh token.

**Auth:** `[PUBLIC]`

**Request Body:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

**Error:**
- `401` — Refresh token tidak valid atau sudah expired

---

### POST /api/auth/logout
Invalidasi sesi (revoke refresh token).

**Auth:** `[PUBLIC]`

**Request Body:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Logout berhasil"
}
```

---

## 02 · Auth — Profil & Manajemen Akun

### GET /api/auth/me
Ambil info akun yang sedang login.

**Auth:** `[ANY]`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "budi@example.com",
    "role": "PARENT",
    "profile": { ... }
  }
}
```

---

### PATCH /api/auth/me/profile
Update nama dan avatar orang tua.

**Auth:** `[PARENT]`

**Request Body:**
```json
{
  "fullName": "Budi Santoso Updated",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

---

### PATCH /api/auth/me/email
Ganti email orang tua (butuh PIN konfirmasi).

**Auth:** `[PARENT]`

**Request Body:**
```json
{
  "newEmail": "budi.baru@example.com",
  "pin": "123456"
}
```

---

### PATCH /api/auth/me/password
Ganti password orang tua (butuh password lama).

**Auth:** `[PARENT]`

**Request Body:**
```json
{
  "oldPassword": "Byond@2026",
  "newPassword": "NewByond@2026"
}
```

---

### PATCH /api/auth/me/pin
Ganti PIN tabungan orang tua (butuh PIN lama).

**Auth:** `[PARENT]`

**Request Body:**
```json
{
  "oldPin": "123456",
  "newPin": "654321"
}
```

---

### POST /api/auth/children
Buat akun anak baru (oleh orang tua).

**Auth:** `[PARENT]`

**Request Body:**
```json
{
  "fullName": "Aisha Ramadhani",
  "dateOfBirth": "2012-07-20",
  "username": "aisha_byond",
  "pin": "123456"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "childProfileId": "uuid",
    "username": "aisha_byond",
    "accountNumber": "7987654321"
  }
}
```

---

### PATCH /api/auth/children/:childId/password
Ganti password anak (butuh PIN orang tua).

**Auth:** `[PARENT]`

**Request Body:**
```json
{
  "newPassword": "NewPin123",
  "parentPin": "123456"
}
```

---

### PATCH /api/auth/children/:childId/pin
Ganti PIN anak (butuh PIN orang tua).

**Auth:** `[PARENT]`

**Request Body:**
```json
{
  "newPin": "111222",
  "parentPin": "123456"
}
```

---

## 03 · Family

### GET /api/family/children
Daftar semua anak yang terhubung ke orang tua yang login.

**Auth:** `[PARENT]`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "fullName": "Aisha Ramadhani",
      "username": "aisha_byond",
      "dateOfBirth": "2012-07-20",
      "avatar": null,
      "isActive": true,
      "account": {
        "balance": "Rp 150.000",
        "accountNumber": "7987654321"
      }
    }
  ]
}
```

---

## 04 · Parent Banking

### GET /api/parent/banking/account
Info rekening dan saldo orang tua.

**Auth:** `[PARENT]`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "fullName": "Budi Santoso",
    "bsiAccountNumber": "7123456789",
    "balance": "Rp 10.000.000",
    "balanceRaw": 1000000000
  }
}
```

---

### GET /api/parent/banking/transactions
Riwayat transaksi orang tua (paginated).

**Auth:** `[PARENT]`

**Query:** `?page=1&limit=20`

---

### POST /api/parent/banking/deposit
Deposit saldo dummy ke akun orang tua.

**Auth:** `[PARENT]`

**Request Body:**
```json
{
  "amount": 500000,
  "pin": "123456"
}
```

---

### POST /api/parent/banking/transfer
Transfer saldo ke rekening anak (butuh PIN konfirmasi).

**Auth:** `[PARENT]`

**Request Body:**
```json
{
  "childProfileId": "uuid",
  "amount": 100000,
  "pin": "123456",
  "notes": "Uang jajan minggu ini"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Transfer berhasil",
  "data": {
    "parentBalanceAfter": "Rp 9.900.000",
    "childBalanceAfter": "Rp 250.000"
  }
}
```

---

## 05 · Parent Monitoring

### GET /api/parent/summary/:childId
Ringkasan keuangan anak (saldo, pockets, transaksi terbaru).

**Auth:** `[PARENT]`

---

### GET /api/parent/children/:childId/pockets
Semua pocket anak yang dipantau.

**Auth:** `[PARENT]`

---

### GET /api/parent/children/:childId/pockets/:pocketId
Detail pocket spesifik anak.

**Auth:** `[PARENT]`

---

## 06 · Spending Limits

### GET /api/limits/:childId
Semua limit aktif untuk anak.

**Auth:** `[PARENT]`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "general": [
      {
        "id": "uuid",
        "period": "DAILY",
        "limitAmount": "Rp 30.000",
        "voucherType": null
      }
    ],
    "category": [
      {
        "id": "uuid",
        "period": "DAILY",
        "limitAmount": "Rp 10.000",
        "voucherType": "GAME_TOPUP"
      }
    ]
  }
}
```

---

### PUT /api/limits/:childId
Set/update limit umum untuk anak.

**Auth:** `[PARENT]`

**Request Body:**
```json
{
  "period": "DAILY",
  "limitAmount": 30000,
  "excludeInfaq": true
}
```

---

### POST /api/limits/:childId/category
Set limit per kategori voucher.

**Auth:** `[PARENT]`

**Request Body:**
```json
{
  "period": "DAILY",
  "limitAmount": 10000,
  "voucherType": "GAME_TOPUP"
}
```

---

## 07 · Chores / Tugas

### GET /api/chores
Daftar chores (PARENT: yang dibuat; CHILD: yang ditugaskan).

**Auth:** `[PARENT]` atau `[CHILD]`

**Query (PARENT):** `?childId=uuid&status=ACTIVE`
**Query (CHILD):** `?status=PENDING_REVIEW`

---

### POST /api/chores
Buat chore baru untuk anak.

**Auth:** `[PARENT]`

**Request Body:**
```json
{
  "assignedToId": "uuid",
  "title": "Hafal Surah Al-Mulk",
  "description": "Hafalkan 30 ayat dan demonstrasikan ke Ayah",
  "category": "Hafalan Qur'an",
  "rewardAmount": 50000,
  "deadline": "2026-06-15T23:59:59Z"
}
```

---

### PUT /api/chores/:id
Update chore (hanya status `ACTIVE`).

**Auth:** `[PARENT]`

---

### DELETE /api/chores/:id
Batalkan chore (hanya status `ACTIVE` → `CANCELLED`).

**Auth:** `[PARENT]`

---

### POST /api/chores/:id/submit
Submit bukti penyelesaian chore.

**Auth:** `[CHILD]`

**Request Body:**
```json
{
  "mediaUrl": "https://example.com/foto-nilai.jpg",
  "notes": "Dapat nilai 90, Ayah!"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Bukti berhasil dikirim, menunggu review",
  "data": {
    "submissionId": "uuid",
    "attempt": 1,
    "choreStatus": "PENDING_REVIEW"
  }
}
```

---

### PATCH /api/chores/:id/approve
Approve chore → reward otomatis masuk rekening anak.

**Auth:** `[PARENT]`

**Response 200:**
```json
{
  "success": true,
  "message": "Tugas disetujui! Reward Rp 50.000 telah dikirim ke tabungan Aisha",
  "data": {
    "rewardAmount": "Rp 50.000",
    "childBalanceAfter": "Rp 200.000",
    "parentBalanceAfter": "Rp 9.950.000"
  }
}
```

---

### PATCH /api/chores/:id/reject
Reject chore dengan catatan.

**Auth:** `[PARENT]`

**Request Body:**
```json
{
  "note": "Foto tidak jelas, ulangi dengan pencahayaan lebih baik",
  "allowRevision": true
}
```

---

## 08 · Child Self-Service

### GET /api/child/dashboard
Dashboard ringkasan anak.

**Auth:** `[CHILD]`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "profile": { "fullName": "Aisha Ramadhani", "avatar": null },
    "account": { "balance": "Rp 150.000" },
    "activePockets": 3,
    "pendingChores": 1,
    "xpBalance": { "totalXp": 120, "level": 2, "levelName": "Pelajar" }
  }
}
```

---

### GET /api/child/account
Detail rekening anak.

**Auth:** `[CHILD]`

---

### GET /api/child/transactions
Riwayat transaksi anak (paginated).

**Auth:** `[CHILD]`

---

### PATCH /api/child/avatar
Update avatar anak.

**Auth:** `[CHILD]`

**Request Body:**
```json
{
  "avatar": "🦁"
}
```

---

## 09 · Pockets

### GET /api/pockets
Semua pocket aktif milik anak.

**Auth:** `[CHILD]`

---

### POST /api/pockets
Buat pocket baru.

**Auth:** `[CHILD]`

**Request Body:**
```json
{
  "name": "Tabungan Haji",
  "category": "HAJI",
  "emoji": "🕌",
  "targetAmount": 500000,
  "intentionText": "Semoga bisa berhaji suatu hari nanti",
  "deadline": "2030-12-31"
}
```

---

### GET /api/pockets/:id
Detail pocket beserta riwayat transaksi.

**Auth:** `[CHILD]`

---

### PUT /api/pockets/:id
Update nama/target/intention pocket.

**Auth:** `[CHILD]`

---

### POST /api/pockets/:id/topup
Alokasikan saldo dari Tabungan Utama ke pocket.

**Auth:** `[CHILD]`

**Request Body:**
```json
{
  "amount": 25000,
  "pin": "123456"
}
```

---

### DELETE /api/pockets/:id
Nonaktifkan pocket (saldo otomatis kembali ke Tabungan Utama).

**Auth:** `[CHILD]`

---

## 10 · Infaq / Sedekah

### GET /api/infaq/institutions
Daftar lembaga infaq yang aktif.

**Auth:** `[PUBLIC]`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "BAZNAS",
      "name": "BAZNAS",
      "description": "Badan Amil Zakat Nasional",
      "bankInfo": "BSI - 7155555002 a.n. BAZNAS",
      "logoUrl": null
    }
  ]
}
```

---

### POST /api/infaq
Kirim infaq ke lembaga pilihan.

**Auth:** `[CHILD]`

**Request Body:**
```json
{
  "institutionId": "uuid",
  "amount": 10000,
  "pin": "123456",
  "notes": "Semoga berkah"
}
```

---

### GET /api/infaq
Riwayat infaq anak.

**Auth:** `[CHILD]`

---

## 11 · Vouchers

### GET /api/vouchers
Katalog voucher aktif (filter opsional).

**Auth:** `[CHILD]`

**Query:** `?category=Gaming&type=GAME_TOPUP&page=1&limit=10`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "vouchers": [
      {
        "id": "uuid",
        "name": "Top-up Diamond Mobile Legends 50",
        "provider": "Mobile Legends",
        "voucherType": "GAME_TOPUP",
        "price": "Rp 15.000",
        "faceValue": "Rp 15.000",
        "stock": 199,
        "description": "50 Diamond MLBB"
      }
    ],
    "total": 7,
    "page": 1
  }
}
```

---

### POST /api/vouchers/buy
Beli voucher.

**Auth:** `[CHILD]`

**Request Body:**
```json
{
  "voucherId": "uuid",
  "pin": "123456"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Voucher berhasil dibeli!",
  "data": {
    "redemptionId": "uuid",
    "voucherName": "Top-up Diamond Mobile Legends 50",
    "code": "MLBB-BYOND-A3F8B21C",
    "balanceAfter": "Rp 135.000"
  }
}
```

**Error:**
- `400` — Saldo tidak cukup
- `400` — Limit spending terlampaui
- `400` — Stok habis
- `400` — Batas pembelian per anak tercapai

---

### GET /api/vouchers/history
Riwayat pembelian voucher anak.

**Auth:** `[CHILD]`

---

## 12 · E-Learning (v4)

### GET /api/learning/modules
Daftar modul e-learning yang dipublikasikan.

**Auth:** `[CHILD]`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Belajar Menabung",
      "category": "MENABUNG",
      "thumbnail": "https://...",
      "articleCount": 5
    }
  ]
}
```

---

### GET /api/learning/articles
Daftar artikel (filter opsional per modul/kategori).

**Auth:** `[CHILD]`

**Query:** `?moduleId=uuid&category=MENABUNG&difficulty=MUDAH`

---

### GET /api/learning/articles/:articleId
Detail artikel beserta status progress anak.

**Auth:** `[CHILD]`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Mengapa Menabung Itu Penting?",
    "content": "Menabung adalah...",
    "imageUrl": "https://...",
    "difficulty": "MUDAH",
    "readingTimeMin": 5,
    "xpReward": 10,
    "hasQuiz": true,
    "progress": {
      "readCompleted": false,
      "quizScore": null
    }
  }
}
```

---

### POST /api/learning/articles/:articleId/complete
Tandai artikel sebagai selesai dibaca → dapatkan XP.

**Auth:** `[CHILD]`

**Request Body:** _(kosong)_

**Response 200:**
```json
{
  "success": true,
  "message": "Artikel selesai! Kamu mendapat 10 XP",
  "data": {
    "xpEarned": 10,
    "totalXp": 130,
    "level": 2,
    "levelName": "Pelajar"
  }
}
```

---

### GET /api/learning/articles/:articleId/quiz
Ambil soal kuis (tanpa jawaban benar).

**Auth:** `[CHILD]`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "quizId": "uuid",
    "passScore": 70,
    "xpBonus": 20,
    "coinReward": "Rp 5.000",
    "questions": [
      {
        "id": "uuid",
        "question": "Apa manfaat menabung?",
        "options": [
          { "text": "Boros uang", "index": 0 },
          { "text": "Punya cadangan saat darurat", "index": 1 },
          { "text": "Malas bekerja", "index": 2 }
        ],
        "order": 1
      }
    ]
  }
}
```

*Catatan: `isCorrect` tidak dikirim sebelum submit.*

---

### POST /api/learning/articles/:articleId/quiz/submit
Submit jawaban kuis.

**Auth:** `[CHILD]`

**Request Body:**
```json
{
  "answers": [
    { "questionId": "uuid", "optionIndex": 1 },
    { "questionId": "uuid", "optionIndex": 0 }
  ]
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "score": 85,
    "passed": true,
    "passScore": 70,
    "xpEarned": 20,
    "coinReward": "Rp 5.000",
    "totalXp": 150,
    "level": 2,
    "questions": [
      {
        "question": "Apa manfaat menabung?",
        "yourAnswer": 1,
        "correctAnswer": 1,
        "correct": true,
        "explanation": "Menabung memberikan dana cadangan untuk kebutuhan darurat"
      }
    ]
  }
}
```

**Error:**
- `403` `QUIZ_ALREADY_TAKEN` — Kuis sudah pernah diambil
- `400` — Artikel belum diselesaikan

---

### GET /api/learning/my-progress
Progress keseluruhan anak di semua artikel.

**Auth:** `[CHILD]`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "xpBalance": {
      "totalXp": 150,
      "level": 2,
      "levelName": "Pelajar",
      "nextLevelAt": 250
    },
    "articlesCompleted": 3,
    "quizzesPassed": 2,
    "totalRewardEarned": "Rp 10.000",
    "progresses": [ ... ]
  }
}
```

---

## 13 · Admin — Platform Management

### GET /api/admin/stats
Statistik keseluruhan platform.

**Auth:** `[ADMIN]`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "users": {
      "totalParents": 50,
      "activeParents": 48,
      "totalChildren": 95,
      "newToday": 3
    },
    "transactions": {
      "totalTransactions": 1240,
      "totalVolume": "Rp 45.000.000"
    },
    "infaq": {
      "totalDonations": 230,
      "totalAmount": "Rp 2.300.000"
    }
  }
}
```

---

### GET /api/admin/parents
Daftar semua parent (paginated + search).

**Auth:** `[ADMIN]`

**Query:** `?page=1&limit=20&search=budi`

---

### GET /api/admin/parents/:parentId
Detail parent beserta semua anaknya.

**Auth:** `[ADMIN]`

---

### PATCH /api/admin/parents/:parentId/status
Aktifkan atau nonaktifkan akun parent.

**Auth:** `[ADMIN]`

**Request Body:**
```json
{
  "isActive": false,
  "reason": "Terindikasi aktivitas mencurigakan"
}
```

---

### POST /api/admin/parents/:parentId/balance/adjust
Koreksi saldo parent secara manual.

**Auth:** `[ADMIN]`

**Request Body:**
```json
{
  "amount": 100000,
  "type": "CREDIT",
  "reason": "Koreksi saldo akibat error sistem"
}
```

---

### GET /api/admin/parents/:parentId/ledger
Riwayat transaksi parent.

**Auth:** `[ADMIN]`

---

### GET /api/admin/children
Daftar semua anak (paginated + search).

**Auth:** `[ADMIN]`

---

### GET /api/admin/children/:childId
Detail anak beserta rekening dan pockets.

**Auth:** `[ADMIN]`

---

### PATCH /api/admin/children/:childId/status
Aktifkan atau nonaktifkan akun anak.

**Auth:** `[ADMIN]`

---

### GET /api/admin/audit-logs
Audit log semua aktivitas (paginated + filter).

**Auth:** `[ADMIN]`

**Query:** `?userId=uuid&action=APPROVE_CHORE&from=2026-06-01&to=2026-06-08`

---

## 14 · Admin — Voucher Management

### GET /api/admin/vouchers
Semua voucher (termasuk nonaktif), paginated.

**Auth:** `[ADMIN]`

---

### POST /api/admin/vouchers
Buat voucher baru.

**Auth:** `[ADMIN]`

**Request Body:**
```json
{
  "name": "Voucher Shopee Rp 50.000",
  "provider": "Shopee",
  "category": "Belanja Online",
  "voucherType": "DISCOUNT",
  "price": 50000,
  "faceValue": 50000,
  "stock": 100,
  "maxPerChild": 2,
  "description": "Voucher potongan harga Shopee",
  "mockCode": "SHOPEE-BYOND-XXXX"
}
```

---

### PUT /api/admin/vouchers/:voucherId
Update voucher.

**Auth:** `[ADMIN]`

---

### DELETE /api/admin/vouchers/:voucherId
Hapus atau soft-deactivate voucher.

**Auth:** `[ADMIN]`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "deleted": false,
    "deactivated": true,
    "reason": "Voucher memiliki 5 redemption, dinonaktifkan (tidak dihapus)"
  }
}
```

---

### GET /api/admin/vouchers/redemptions
Semua riwayat redemption voucher.

**Auth:** `[ADMIN]`

---

## 15 · Admin — Infaq Management

### GET /api/admin/infaq/institutions
Semua lembaga infaq (termasuk nonaktif jika `?includeInactive=true`).

**Auth:** `[ADMIN]`

---

### POST /api/admin/infaq/institutions
Tambah lembaga infaq baru.

**Auth:** `[ADMIN]`

**Request Body:**
```json
{
  "code": "DOMPET_DHUAFA",
  "name": "Dompet Dhuafa",
  "description": "Lembaga amil zakat internasional",
  "bankInfo": "BSI - 7155555010 a.n. Dompet Dhuafa"
}
```

---

### PUT /api/admin/infaq/institutions/:institutionId
Update data lembaga.

**Auth:** `[ADMIN]`

---

### PATCH /api/admin/infaq/institutions/:institutionId/status
Aktifkan atau nonaktifkan lembaga.

**Auth:** `[ADMIN]`

**Request Body:**
```json
{
  "isActive": true
}
```

---

### GET /api/admin/infaq
Semua log infaq (paginated + filter institusi/periode).

**Auth:** `[ADMIN]`

---

### GET /api/admin/infaq/stats
Statistik infaq per lembaga dan periode.

**Auth:** `[ADMIN]`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "allTime": { "totalDonations": 230, "totalAmount": "Rp 2.300.000" },
      "thisMonth": { "totalDonations": 45, "totalAmount": "Rp 450.000" }
    },
    "byInstitution": [
      {
        "institution": "BAZNAS",
        "totalDonations": 80,
        "totalAmount": "Rp 800.000"
      }
    ]
  }
}
```

---

## 16 · Admin — E-Learning Management (v4)

### GET /api/admin/learning/stats
Statistik engagement e-learning.

**Auth:** `[ADMIN]`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "modules": { "total": 5, "published": 4 },
    "articles": { "total": 20, "published": 18 },
    "totalCompletions": 342,
    "totalXpGranted": 8540
  }
}
```

---

### GET /api/admin/learning/modules
Semua modul (paginated).

**Auth:** `[ADMIN]`

---

### POST /api/admin/learning/modules
Buat modul baru.

**Auth:** `[ADMIN]`

**Request Body:**
```json
{
  "title": "Belajar Menabung",
  "description": "Modul dasar tentang menabung",
  "category": "MENABUNG",
  "thumbnail": "https://...",
  "isPublished": false,
  "order": 1
}
```

---

### PUT /api/admin/learning/modules/:moduleId
Update modul.

**Auth:** `[ADMIN]`

---

### DELETE /api/admin/learning/modules/:moduleId
Hapus modul (hanya jika tidak ada artikel di dalamnya).

**Auth:** `[ADMIN]`

---

### GET /api/admin/learning/articles
Semua artikel (paginated + filter modul).

**Auth:** `[ADMIN]`

---

### POST /api/admin/learning/articles
Buat artikel baru.

**Auth:** `[ADMIN]`

**Request Body:**
```json
{
  "moduleId": "uuid",
  "title": "Mengapa Menabung Itu Penting?",
  "content": "Isi artikel dalam plain text...",
  "imageUrl": "https://...",
  "category": "MENABUNG",
  "difficulty": "MUDAH",
  "readingTimeMin": 5,
  "xpReward": 10,
  "isPublished": true,
  "order": 1
}
```

---

### GET /api/admin/learning/articles/:articleId
Detail artikel + kuis (jika ada).

**Auth:** `[ADMIN]`

---

### PUT /api/admin/learning/articles/:articleId
Update artikel.

**Auth:** `[ADMIN]`

---

### DELETE /api/admin/learning/articles/:articleId
Hapus artikel beserta kuisnya.

**Auth:** `[ADMIN]`

---

### PUT /api/admin/learning/articles/:articleId/quiz
Buat atau ganti kuis untuk artikel.

**Auth:** `[ADMIN]`

**Request Body:**
```json
{
  "xpBonus": 20,
  "coinReward": 5000,
  "passScore": 70,
  "questions": [
    {
      "question": "Apa manfaat utama menabung?",
      "options": [
        { "text": "Boros uang", "isCorrect": false },
        { "text": "Punya cadangan darurat", "isCorrect": true },
        { "text": "Malas bekerja", "isCorrect": false }
      ],
      "explanation": "Menabung memberikan dana cadangan saat kebutuhan mendesak",
      "order": 1
    }
  ]
}
```

*Validasi: tepat satu `isCorrect: true` per soal, minimal 2 opsi.*

---

### DELETE /api/admin/learning/articles/:articleId/quiz
Hapus kuis dari artikel.

**Auth:** `[ADMIN]`

---

## Error Codes Umum

| HTTP Status | Code | Keterangan |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Validasi request body gagal |
| 400 | `INSUFFICIENT_BALANCE` | Saldo tidak cukup |
| 400 | `SPENDING_LIMIT_EXCEEDED` | Batas pengeluaran tercapai |
| 400 | `QUIZ_ALREADY_TAKEN` | Kuis sudah pernah diambil |
| 401 | `UNAUTHORIZED` | Token tidak ada / tidak valid |
| 401 | `INVALID_CREDENTIALS` | Email/password/PIN salah |
| 403 | `FORBIDDEN` | Role tidak diizinkan |
| 403 | `ACCOUNT_LOCKED` | Akun terkunci |
| 403 | `ACCOUNT_INACTIVE` | Akun nonaktif |
| 404 | `NOT_FOUND` | Resource tidak ditemukan |
| 409 | `CONFLICT` | Data sudah ada (misal: email duplikat) |
| 429 | `RATE_LIMIT_EXCEEDED` | Terlalu banyak request |
| 500 | `INTERNAL_ERROR` | Error server internal |
