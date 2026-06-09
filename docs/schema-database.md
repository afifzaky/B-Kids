# Schema Database — Byond Kids
**Versi:** 4.0 | **Tanggal:** 2026-06-08
**Database:** PostgreSQL 15+ | **ORM:** Prisma 5

---

## Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    users {
        uuid id PK
        string email UK
        string phone UK
        string password_hash
        enum role
        boolean is_active
        int login_attempts
        datetime locked_until
        datetime created_at
        datetime updated_at
    }

    parent_profiles {
        uuid id PK
        uuid user_id UK FK
        string full_name
        string nik UK
        date date_of_birth
        string bsi_account_number UK
        string pin_hash
        string avatar_url
        bigint dummy_balance
    }

    child_profiles {
        uuid id PK
        uuid user_id UK FK
        string full_name
        date date_of_birth
        string username UK
        string pin_hash
        string device_id
        string avatar
        uuid created_by_parent_id
        boolean is_active
        string child_account_number
        datetime created_at
        datetime updated_at
    }

    family_links {
        uuid id PK
        uuid parent_profile_id FK
        uuid child_profile_id FK
        datetime linked_at
    }

    child_accounts {
        uuid id PK
        uuid child_profile_id UK FK
        bigint balance
        string currency
        datetime updated_at
    }

    account_ledger {
        uuid id PK
        uuid account_id FK
        enum type
        enum source
        bigint amount
        bigint balance_after
        uuid reference_id
        uuid triggered_by
        string notes
        datetime created_at
    }

    pockets {
        uuid id PK
        uuid account_id FK
        string name
        enum category
        bigint balance
        bigint target_amount
        string intention_text
        string emoji
        datetime deadline
        boolean is_active
        boolean is_goal_completed
        datetime created_at
        datetime updated_at
    }

    pocket_ledger {
        uuid id PK
        uuid pocket_id FK
        enum type
        enum source
        bigint amount
        bigint balance_after
        uuid reference_id
        uuid triggered_by
        string notes
        datetime created_at
    }

    chores {
        uuid id PK
        uuid created_by_id FK
        uuid assigned_to_id FK
        string title
        string description
        string category
        bigint reward_amount
        datetime deadline
        enum status
        string rejection_note
        datetime created_at
        datetime updated_at
    }

    chore_submissions {
        uuid id PK
        uuid chore_id FK
        string media_url
        string notes
        datetime submitted_at
        datetime reviewed_at
        string reviewer_note
        int attempt
    }

    spending_limits {
        uuid id PK
        uuid child_profile_id FK
        uuid set_by_parent_id FK
        enum period
        bigint limit_amount
        boolean exclude_infaq
        string voucher_type
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    infaq_institution_configs {
        uuid id PK
        string code UK
        string name
        string description
        string logo_url
        string bank_info
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    infaq_logs {
        uuid id PK
        uuid child_profile_id FK
        uuid institution_config_id FK
        bigint amount
        string notes
        datetime created_at
    }

    voucher_catalog {
        uuid id PK
        string name
        string provider
        string category
        enum voucher_type
        bigint price
        bigint face_value
        string description
        string image_url
        string mock_code
        int stock
        int max_per_child
        datetime valid_from
        datetime valid_until
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    voucher_redemptions {
        uuid id PK
        uuid child_profile_id FK
        uuid voucher_id FK
        bigint amount
        string mock_code_issued
        datetime redeemed_at
    }

    parent_ledger {
        uuid id PK
        uuid parent_profile_id FK
        enum type
        enum source
        bigint amount
        bigint balance_after
        uuid related_child_id FK
        string notes
        datetime created_at
    }

    refresh_tokens {
        uuid id PK
        uuid user_id FK
        string token_hash UK
        datetime expires_at
        datetime last_active_at
        datetime created_at
    }

    password_reset_tokens {
        uuid id PK
        uuid user_id FK
        string token_hash UK
        datetime expires_at
        datetime used_at
        datetime created_at
    }

    audit_logs {
        uuid id PK
        uuid user_id FK
        string action
        string entity_type
        uuid entity_id
        json old_values
        json new_values
        string ip_address
        string user_agent
        datetime created_at
    }

    learning_modules {
        uuid id PK
        string title
        string description
        enum category
        string thumbnail
        boolean is_published
        int order
        uuid created_by_id FK
        datetime created_at
        datetime updated_at
    }

    learning_articles {
        uuid id PK
        uuid module_id FK
        string title
        text content
        string image_url
        enum category
        enum difficulty
        int reading_time_min
        int xp_reward
        boolean is_published
        int order
        uuid created_by_id FK
        datetime created_at
        datetime updated_at
    }

    quizzes {
        uuid id PK
        uuid article_id UK FK
        int xp_bonus
        bigint coin_reward
        int pass_score
        datetime created_at
        datetime updated_at
    }

    quiz_questions {
        uuid id PK
        uuid quiz_id FK
        string question
        json options
        string explanation
        int order
        datetime created_at
    }

    learning_progresses {
        uuid id PK
        uuid child_profile_id FK
        uuid article_id FK
        datetime read_completed_at
        int quiz_score
        datetime quiz_passed_at
        int xp_earned
        datetime reward_paid_at
        datetime created_at
        datetime updated_at
    }

    child_xp_balances {
        uuid id PK
        uuid child_profile_id UK FK
        int total_xp
        int level
        datetime updated_at
    }

    users ||--o| parent_profiles : "has"
    users ||--o| child_profiles : "has"
    users ||--o{ refresh_tokens : "has"
    users ||--o{ password_reset_tokens : "has"
    users ||--o{ audit_logs : "triggers"
    users ||--o{ learning_modules : "creates"
    users ||--o{ learning_articles : "creates"

    parent_profiles ||--o{ family_links : "has"
    parent_profiles ||--o{ chores : "creates"
    parent_profiles ||--o{ spending_limits : "sets"
    parent_profiles ||--o{ parent_ledger : "has"

    child_profiles ||--o{ family_links : "has"
    child_profiles ||--o| child_accounts : "has"
    child_profiles ||--o{ chores : "assigned"
    child_profiles ||--o{ spending_limits : "subject_to"
    child_profiles ||--o{ infaq_logs : "has"
    child_profiles ||--o{ voucher_redemptions : "has"
    child_profiles ||--o{ parent_ledger : "related"
    child_profiles ||--o{ learning_progresses : "has"
    child_profiles ||--o| child_xp_balances : "has"

    child_accounts ||--o{ account_ledger : "has"
    child_accounts ||--o{ pockets : "has"

    pockets ||--o{ pocket_ledger : "has"

    chores ||--o{ chore_submissions : "has"

    infaq_institution_configs ||--o{ infaq_logs : "receives"

    voucher_catalog ||--o{ voucher_redemptions : "has"

    learning_modules ||--o{ learning_articles : "contains"
    learning_articles ||--o| quizzes : "has"
    quizzes ||--o{ quiz_questions : "has"
    learning_articles ||--o{ learning_progresses : "tracked_by"
```

---

## Dokumentasi Tabel

### users
Akun pengguna untuk semua role.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | Auto-generated UUID v4 |
| `email` | String UNIQUE | Email login (wajib untuk PARENT & ADMIN, dummy untuk CHILD) |
| `phone` | String? UNIQUE | Nomor HP (opsional) |
| `password_hash` | String | Hash bcrypt dari password |
| `role` | Enum | `SUPER_ADMIN`, `PARENT`, `CHILD` |
| `is_active` | Boolean | Default `true`. Nonaktif = tidak bisa login |
| `login_attempts` | Int | Hitungan gagal login (reset saat berhasil) |
| `locked_until` | DateTime? | Waktu akun unlock otomatis (null = tidak terkunci) |

---

### parent_profiles
Profil lengkap orang tua, terhubung 1-to-1 ke `users`.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK UNIQUE | Referensi ke `users.id` |
| `full_name` | String | Nama lengkap |
| `nik` | String UNIQUE | Nomor Induk Kependudukan |
| `date_of_birth` | Date | Tanggal lahir |
| `bsi_account_number` | String UNIQUE | Nomor rekening BSI (dummy) |
| `pin_hash` | String | Hash bcrypt PIN tabungan 6 digit |
| `avatar_url` | String? | URL foto profil |
| `dummy_balance` | BigInt | Saldo dummy dalam sen (default Rp 10.000.000) |

---

### child_profiles
Profil anak, dibuat oleh orang tua.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK UNIQUE | Referensi ke `users.id` |
| `full_name` | String | Nama lengkap anak |
| `date_of_birth` | Date | Tanggal lahir |
| `username` | String? UNIQUE | Username login anak |
| `pin_hash` | String | Hash bcrypt PIN 6 digit |
| `device_id` | String? | ID device (untuk tracking) |
| `avatar` | String? | Emoji atau URL avatar |
| `created_by_parent_id` | UUID | Parent yang membuat akun ini |
| `is_active` | Boolean | Status aktif akun |
| `child_account_number` | String | Nomor sub-rekening BSI (dummy) |

---

### family_links
Relasi many-to-many antara parent dan child (satu parent bisa punya banyak anak, satu anak bisa terhubung ke beberapa parent).

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `parent_profile_id` | UUID FK | |
| `child_profile_id` | UUID FK | |
| `linked_at` | DateTime | Waktu link dibuat |

**Constraint:** `UNIQUE(parent_profile_id, child_profile_id)` — satu pasang parent-child hanya bisa satu link.

---

### child_accounts
Rekening utama anak — sumber saldo sebelum dibagi ke pocket.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `child_profile_id` | UUID FK UNIQUE | Satu rekening per anak |
| `balance` | BigInt | Saldo tabungan utama dalam sen |
| `currency` | String | Default `IDR` |

---

### account_ledger
Riwayat transaksi rekening anak — **append-only** (tidak ada UPDATE/DELETE).

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `account_id` | UUID FK | Referensi ke `child_accounts.id` |
| `type` | Enum | `CREDIT` (masuk) / `DEBIT` (keluar) |
| `source` | Enum | Sumber transaksi (lihat di bawah) |
| `amount` | BigInt | Nilai transaksi dalam sen |
| `balance_after` | BigInt | Saldo setelah transaksi |
| `reference_id` | UUID? | ID entitas terkait (misal: chore_id, voucher_id) |
| `triggered_by` | UUID | user_id yang memicu transaksi |
| `notes` | String? | Catatan tambahan |

**TransactionSource values:**
`TOP_UP_FROM_PARENT`, `CHORE_REWARD`, `POCKET_ALLOCATE`, `POCKET_DEALLOCATE`, `VOUCHER_PURCHASE`, `INFAQ`, `ADJUSTMENT`, `LEARNING_REWARD`

---

### pockets
Kantong tabungan bertujuan milik anak.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `account_id` | UUID FK | Referensi ke `child_accounts.id` |
| `name` | String | Nama pocket |
| `category` | Enum | `JAJAN`, `HAJI`, `QURBAN`, `INFAQ`, `CUSTOM` |
| `balance` | BigInt | Saldo pocket dalam sen |
| `target_amount` | BigInt? | Target tabungan (opsional) |
| `intention_text` | String? | Niat / doa dari anak |
| `emoji` | String? | Ikon pocket (default: 💰) |
| `deadline` | DateTime? | Target waktu pencapaian |
| `is_active` | Boolean | Pocket aktif atau sudah ditutup |
| `is_goal_completed` | Boolean | Goal tercapai jika balance ≥ target |

---

### chores
Tugas yang dibuat orang tua untuk anak.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `created_by_id` | UUID FK | `parent_profiles.id` yang membuat |
| `assigned_to_id` | UUID FK | `child_profiles.id` yang ditugaskan |
| `title` | String | Judul tugas |
| `description` | String? | Deskripsi detail |
| `category` | String | Kategori bebas (Hafalan, Akademik, dll.) |
| `reward_amount` | BigInt | Reward dalam sen (masuk ke Tabungan Utama anak) |
| `deadline` | DateTime | Batas waktu penyelesaian |
| `status` | Enum | `ACTIVE`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `REVISION_NEEDED`, `EXPIRED`, `CANCELLED` |
| `rejection_note` | String? | Catatan penolakan dari orang tua |

---

### spending_limits
Batas pengeluaran anak yang ditetapkan orang tua.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `child_profile_id` | UUID FK | Anak yang dikenakan limit |
| `set_by_parent_id` | UUID FK | Parent yang menetapkan |
| `period` | Enum | `DAILY`, `WEEKLY`, `MONTHLY` |
| `limit_amount` | BigInt | Batas pengeluaran dalam sen |
| `exclude_infaq` | Boolean | Apakah infaq dikecualikan dari limit |
| `voucher_type` | String? | NULL = limit umum; isi = limit per kategori |
| `is_active` | Boolean | Status limit |

**Constraint:** `UNIQUE(child_profile_id, period, voucher_type)` — PostgreSQL mengizinkan NULL+NULL coexist.

---

### infaq_institution_configs
Lembaga zakat/infaq yang dikelola admin.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `code` | String UNIQUE | Kode lembaga (BSI_MASLAHAT, BAZNAS, dll.) |
| `name` | String | Nama resmi lembaga |
| `description` | String? | Deskripsi singkat |
| `logo_url` | String? | URL logo |
| `bank_info` | String? | Info rekening bank tujuan |
| `is_active` | Boolean | Tampil di daftar atau tidak |

---

### voucher_catalog
Katalog voucher yang bisa dibeli anak.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `name` | String | Nama voucher |
| `provider` | String | Penyedia (Shopee, MLBB, GoPay, dll.) |
| `category` | String | Kategori bebas (Gaming, Belanja Online, dll.) |
| `voucher_type` | Enum | `DISCOUNT`, `GAME_TOPUP`, `E_WALLET`, `EDUCATION` |
| `price` | BigInt | Harga beli dalam sen |
| `face_value` | BigInt? | Nilai nominal voucher |
| `mock_code` | String | Kode voucher demo (CSPRNG-generated) |
| `stock` | Int? | Stok tersedia (NULL = unlimited) |
| `max_per_child` | Int? | Maks pembelian per anak (NULL = unlimited) |
| `valid_from` / `valid_until` | DateTime? | Periode validitas |
| `is_active` | Boolean | Tampil di katalog atau tidak |

---

### parent_ledger
Riwayat transaksi saldo orang tua — **append-only**.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `parent_profile_id` | UUID FK | |
| `type` | Enum | `CREDIT` / `DEBIT` |
| `source` | Enum | `INITIAL_BALANCE`, `DEPOSIT`, `TRANSFER_TO_CHILD`, `CHORE_REWARD`, `ADJUSTMENT`, `LEARNING_REWARD` |
| `amount` | BigInt | Nilai transaksi dalam sen |
| `balance_after` | BigInt | Saldo parent setelah transaksi |
| `related_child_id` | UUID? FK | Anak terkait (jika ada) |

---

### learning_modules
Modul/kategori pembelajaran (dibuat oleh SUPER_ADMIN).

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `title` | String | Judul modul |
| `category` | Enum | `MENABUNG`, `BELANJA_BIJAK`, `INFAQ_SEDEKAH`, `KEUANGAN_DASAR`, `INVESTASI`, `LAINNYA` |
| `is_published` | Boolean | Apakah tampil ke anak |
| `order` | Int | Urutan tampil |

---

### learning_articles
Artikel pembelajaran — konten utama yang dibaca anak.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `module_id` | UUID? FK | Modul parent (nullable — artikel bisa standalone) |
| `title` | String | Judul artikel |
| `content` | Text | Isi artikel (plain text + URL gambar) |
| `image_url` | String? | Gambar header artikel |
| `category` | Enum | Kategori pembelajaran |
| `difficulty` | Enum | `MUDAH`, `SEDANG`, `SULIT` |
| `reading_time_min` | Int | Estimasi waktu baca (menit) |
| `xp_reward` | Int | XP didapat saat menyelesaikan baca |
| `is_published` | Boolean | Apakah tampil ke anak |

---

### quizzes
Kuis per artikel — satu artikel maksimal satu kuis.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `article_id` | UUID FK UNIQUE | 1-to-1 dengan artikel |
| `xp_bonus` | Int | XP bonus saat lulus kuis |
| `coin_reward` | BigInt | Reward koin dalam sen (dikirim ke rekening anak) |
| `pass_score` | Int | Persentase minimum lulus (default: 70) |

---

### quiz_questions
Pertanyaan dalam kuis.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `quiz_id` | UUID FK | |
| `question` | String | Teks pertanyaan |
| `options` | JSON | Array `[{text: string, isCorrect: boolean}]` |
| `explanation` | String? | Penjelasan jawaban (ditampilkan setelah submit) |
| `order` | Int | Urutan tampil |

**Catatan keamanan:** `isCorrect` tidak dikirim ke klien sebelum submit kuis (`stripCorrectAnswers()`).

---

### learning_progresses
Tracking progress belajar per anak per artikel.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `child_profile_id` | UUID FK | |
| `article_id` | UUID FK | |
| `read_completed_at` | DateTime? | Waktu selesai baca (null = belum selesai) |
| `quiz_score` | Int? | Skor kuis (null = belum pernah ambil kuis) |
| `quiz_passed_at` | DateTime? | Waktu lulus kuis |
| `xp_earned` | Int | Total XP yang diperoleh dari artikel ini |
| `reward_paid_at` | DateTime? | Waktu reward koin dibayarkan |

**Constraint:** `UNIQUE(child_profile_id, article_id)` — satu record per anak per artikel.

---

### child_xp_balances
Saldo XP kumulatif anak — satu record per anak, di-upsert setiap XP bertambah.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID PK | |
| `child_profile_id` | UUID FK UNIQUE | 1-to-1 dengan child profile |
| `total_xp` | Int | Total XP yang telah dikumpulkan |
| `level` | Int | Level saat ini (1–5) |

**Sistem Level:**
```
Level 1: Pemula   (0 – 99 XP)
Level 2: Pelajar  (100 – 249 XP)
Level 3: Cerdas   (250 – 499 XP)
Level 4: Pintar   (500 – 999 XP)
Level 5: Jenius   (1000+ XP)
```

---

## Ringkasan Tabel

| Tabel | Fungsi | Catatan |
|---|---|---|
| `users` | Akun semua role | |
| `parent_profiles` | Profil orang tua | |
| `child_profiles` | Profil anak | |
| `family_links` | Relasi parent↔child | |
| `child_accounts` | Rekening utama anak | |
| `account_ledger` | Mutasi rekening anak | Append-only |
| `pockets` | Kantong tabungan | |
| `pocket_ledger` | Mutasi pocket | Append-only |
| `chores` | Tugas anak | |
| `chore_submissions` | Bukti pengerjaan tugas | |
| `spending_limits` | Batas pengeluaran | |
| `infaq_institution_configs` | Lembaga zakat | Dikelola admin |
| `infaq_logs` | Log donasi infaq | |
| `voucher_catalog` | Katalog voucher | Dikelola admin |
| `voucher_redemptions` | Riwayat pembelian voucher | |
| `parent_ledger` | Mutasi saldo orang tua | Append-only |
| `refresh_tokens` | Sesi aktif pengguna | |
| `password_reset_tokens` | Token reset password | Single-use |
| `audit_logs` | Jejak audit semua aksi | |
| `learning_modules` | Modul e-learning | Dikelola admin |
| `learning_articles` | Artikel pembelajaran | Dikelola admin |
| `quizzes` | Kuis per artikel | Dikelola admin |
| `quiz_questions` | Soal kuis | |
| `learning_progresses` | Progress belajar anak | |
| `child_xp_balances` | Saldo XP & level anak | |

**Total: 25 tabel**
