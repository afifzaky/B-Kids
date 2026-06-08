# Byond Kids — Backend

REST API backend untuk aplikasi **Byond Kids**, platform edukasi keuangan syariah berbasis BSI Digital Banking yang dirancang untuk anak-anak dan orang tua.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Runtime | Node.js 22 + TypeScript |
| Framework | Express.js |
| ORM | Prisma 5 |
| Database | PostgreSQL via Supabase |
| Auth | JWT (Access + Refresh Token) |
| Storage | Supabase Storage |
| Validation | Zod |
| Container | Docker + Docker Compose |

---

## Fitur Utama

- **Auth** — Register & login parent/child, refresh token, logout
- **Family** — Manajemen hubungan orang tua dan anak
- **Parent Banking** — Saldo dummy, deposit, transfer ke rekening anak
- **Chores** — Buat & assign tugas anak, submit bukti, review & approve reward
- **Pockets** — Alokasi saldo anak ke kantong (Jajan, Haji, Qurban, Infaq, Custom)
- **Spending Limits** — Batas pengeluaran harian/mingguan/bulanan per anak
- **Infaq** — Sedekah ke lembaga zakat (BSI Maslahat, BAZNAS, dll.)
- **Vouchers** — Marketplace voucher yang bisa dibeli anak dari saldo pocket

---

## Prasyarat

Pastikan sudah terinstall:

- [Node.js](https://nodejs.org/) v22+
- [npm](https://www.npmjs.com/) v10+
- [Docker](https://www.docker.com/) (opsional, untuk mode container)
- Akun [Supabase](https://supabase.com/) (gratis)

---

## Cara Clone & Menjalankan

### 1. Clone Repository

```bash
git clone https://github.com/afifzaky/B-Kids.git
cd B-Kids
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi Environment

Salin file contoh environment dan isi nilainya:

```bash
cp .env.example .env
```

Buka `.env` dan isi setiap variabel (lihat bagian [Environment Variables](#environment-variables) di bawah).

> **Penting:** Jangan gunakan tanda kutip (`"`) pada nilai di `.env` jika menjalankan dengan Docker — Docker `--env-file` membaca nilai secara literal termasuk tanda kutipnya.

### 4. Setup Database

Jalankan migrasi dan generate Prisma client:

```bash
# Generate Prisma client
npm run db:generate

# Jalankan migrasi ke database Supabase
npm run db:migrate

# (Opsional) Isi data awal / seed
npm run db:seed
```

### 5. Jalankan Server

#### Mode Development (hot-reload)

```bash
npm run dev
```

#### Mode Production (build terlebih dahulu)

```bash
npm run build
npm start
```

Server akan berjalan di `http://localhost:4000`.

---

## Menjalankan dengan Docker

### Opsi A — Docker Compose (Direkomendasikan)

```bash
# Build image dan jalankan container
docker-compose up --build -d

# Lihat logs
docker-compose logs -f

# Stop container
docker-compose down
```

### Opsi B — Docker Manual

```bash
# Build image
docker build -t bkids-backend .

# Jalankan container
docker run --env-file .env -p 4000:4000 bkids-backend
```

---

## Environment Variables

Buat file `.env` berdasarkan `.env.example`. Berikut penjelasan setiap variabel:

### Server

```env
PORT=4000
NODE_ENV=development
```

### Database — Supabase

Ambil dari **Supabase Dashboard → Project → Settings → Database → Connection string**.

```env
# Transaction Pooler — untuk query normal (port 6543)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require

# Session Pooler — untuk migrasi / Prisma Studio (port 5432)
DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require
```

### JWT

Generate nilai random minimal 64 karakter:

```bash
openssl rand -hex 64
```

```env
JWT_SECRET=isi_dengan_random_string_min_64_karakter
JWT_EXPIRES_IN=8m
JWT_REFRESH_SECRET=isi_dengan_random_string_lain_min_64_karakter
JWT_REFRESH_EXPIRES_IN=7d
```

### Supabase API

Ambil dari **Supabase Dashboard → Project → Settings → API**.

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_STORAGE_BUCKET=chore-submissions
```

### CORS & Rate Limiting

```env
ALLOWED_ORIGINS=http://localhost:3000

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOGIN_RATE_LIMIT_MAX=5
BCRYPT_SALT_ROUNDS=12
```

---

## Cara Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com/)
2. Catat **Project URL** dan **API Keys** dari Settings → API
3. Catat **connection strings** dari Settings → Database
4. Buat storage bucket bernama `chore-submissions` dari menu **Storage**
5. Isi semua nilai tersebut ke file `.env`

---

## Scripts

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Jalankan server development dengan hot-reload |
| `npm run build` | Compile TypeScript ke JavaScript (`dist/`) |
| `npm start` | Jalankan server production dari `dist/` |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Jalankan migrasi database |
| `npm run db:push` | Push schema ke database tanpa migrasi |
| `npm run db:seed` | Isi data awal ke database |
| `npm run db:reset` | Reset database + jalankan seed ulang |
| `npm run db:studio` | Buka Prisma Studio (GUI database) |
| `npm run typecheck` | Periksa tipe TypeScript tanpa compile |

---

## Struktur Project

```
B-Kids/
├── prisma/
│   └── schema.prisma        # Definisi schema database
├── scripts/
│   └── seed.ts              # Script seeding data awal
├── src/
│   ├── config/              # Konfigurasi env, database, supabase
│   ├── middleware/          # Auth, error handler, rate limiter
│   ├── modules/             # Fitur per domain
│   │   ├── auth/            # Login, register, refresh token
│   │   ├── chores/          # Tugas & reward anak
│   │   ├── family/          # Hubungan parent-child
│   │   ├── infaq/           # Sedekah / zakat
│   │   ├── limits/          # Spending limit anak
│   │   ├── parent/          # Banking & profil orang tua
│   │   ├── pockets/         # Kantong tabungan anak
│   │   └── vouchers/        # Marketplace voucher
│   ├── types/               # Type definitions
│   ├── utils/               # Helper functions
│   ├── app.ts               # Inisialisasi Express
│   └── server.ts            # Entry point
├── .env.example             # Template environment variables
├── docker-compose.yml
├── Dockerfile
└── package.json
```

---

## API Testing

Tersedia file Postman collection di root project:

```
postman.json
```

Import file tersebut ke [Postman](https://www.postman.com/) untuk langsung mencoba semua endpoint yang tersedia.

---

## Troubleshooting

### Error: `SUPABASE_URL harus berupa URL valid` saat Docker

Pastikan nilai di `.env` **tidak** menggunakan tanda kutip:

```env
# Salah (Docker tidak membuang tanda kutip)
SUPABASE_URL="https://xxx.supabase.co"

# Benar
SUPABASE_URL=https://xxx.supabase.co
```

### Error: `Can't reach database server`

- Pastikan `DATABASE_URL` menggunakan **Transaction Pooler** (port 6543) untuk query normal
- Pastikan `DIRECT_URL` menggunakan **Session Pooler** (port 5432) untuk migrasi
- Cek apakah IP Anda diizinkan di Supabase (Settings → Database → Connection Pooling)

### Prisma client tidak ditemukan

```bash
npm run db:generate
```

---

## Lisensi

ISC
