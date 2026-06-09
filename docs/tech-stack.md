# Tech Stack — Byond Kids Backend
**Versi:** 4.0 | **Tanggal:** 2026-06-08

---

## Ringkasan

| Lapisan | Teknologi | Versi |
|---|---|---|
| Runtime | Node.js | 22 LTS |
| Bahasa | TypeScript | 5.x |
| Framework | Express.js | 4.x |
| ORM | Prisma | 5.x |
| Database | PostgreSQL | 15+ |
| Auth | jsonwebtoken | 9.x |
| Validasi | Zod | 3.x |
| Hashing | bcryptjs | 2.x |
| Container | Docker | 26.x |
| Orkestrasi | Kubernetes | 1.29+ |
| Testing | Jest | 30.x |

---

## 1. Runtime & Bahasa

### Node.js 22 LTS
- Runtime JavaScript sisi server
- Mendukung native `crypto.randomBytes()` dan `crypto.randomInt()` (CSPRNG tanpa library tambahan)
- LTS (Long Term Support) — stabil untuk production

### TypeScript 5.x
- Superset JavaScript dengan type safety
- Konfigurasi `strict: true` aktif
- Mencegah runtime error tipe pada compile time
- Dicompile ke JavaScript sebelum dijalankan (`dist/`)

---

## 2. Framework & Middleware

### Express.js 4.x
- Framework minimalis untuk HTTP routing dan middleware
- Struktur modular per domain (`src/modules/`)

### Middleware Utama

| Middleware | Package | Fungsi |
|---|---|---|
| Security Headers | `helmet` | CSP, HSTS, X-Frame-Options, dll. |
| CORS | `cors` | Izinkan hanya origin yang dikonfigurasi |
| Rate Limiting | `express-rate-limit` | Cegah brute force & DDoS |
| Body Parser | Built-in Express | Parse JSON & URL-encoded body (limit 10mb) |
| Auth Guard | Custom `verifyToken` | Verifikasi JWT, inject user ke request |
| Role Guard | Custom `checkRole` | RBAC — tolak akses role yang tidak sesuai |
| Activity Tracker | Custom `trackActivity` | Update `lastActiveAt` pada setiap request terautentikasi |
| Error Handler | Custom `errorHandler` | Format error response konsisten |

---

## 3. Database & ORM

### PostgreSQL 15+
- Relational database utama
- BigInt native untuk nilai uang (sen)
- UUID sebagai primary key
- JSON/JSONB untuk data fleksibel (quiz options)
- Unique constraints kompleks (NULL-aware untuk spending limits)

**Deployment:**
| Instance | Host | Peran |
|---|---|---|
| VM1 (Primary) | `192.168.23.67:5432` | Read/Write |
| VM2 (Replica) | TBD | Streaming replica + backup |

### Prisma 5.x
- ORM type-safe untuk Node.js
- Schema tunggal (`prisma/schema.prisma`) sebagai source of truth
- `prisma migrate deploy` untuk production deployment
- `prisma generate` untuk regenerate client dari schema
- `$transaction()` untuk operasi atomis multi-tabel

**Workflow Migrasi:**
```bash
# Development: generate SQL dari schema
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script

# Production: apply migration
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

---

## 4. Autentikasi & Keamanan

### JWT (jsonwebtoken)
- **Access Token:** expire 8 menit (short-lived, stateless)
- **Refresh Token:** expire 7 hari (disimpan hash SHA-256 di DB)
- Rotasi refresh token setiap penggunaan (token lama langsung invalid)
- Logout menghapus refresh token dari database

### bcryptjs
- Hashing password dan PIN dengan salt rounds = 12
- Tidak menyimpan nilai plain text

### crypto (Node.js Built-in)
- `crypto.randomBytes()` — generate token/kode acak (CSPRNG, resolves SonarQube S2245)
- `crypto.randomInt()` — generate nomor rekening
- Tidak menggunakan `Math.random()` di mana pun dalam kode produksi

### Zod
- Validasi semua request body dan parameter
- Schema-first validation dengan error message yang jelas
- Type inference otomatis ke TypeScript types

---

## 5. Testing

### Jest 30.x + ts-jest
- Unit test dan integration test
- Coverage report tersedia (`npm test -- --coverage`)
- Mock Prisma client untuk isolasi DB

**Konvensi:**
- Test file: `src/__tests__/*.test.ts`
- Mock prisma: `src/__mocks__/prisma.ts`
- Target coverage: fungsi dan branch utama

---

## 6. Containerization & Deployment

### Docker
- Multi-stage build untuk image production yang minimal
- Non-root user (`node:22-alpine`) untuk keamanan
- `.dockerignore` mengecualikan file development

```dockerfile
# Base image: Node.js 22 Alpine (minimal size)
FROM node:22-alpine

# Non-root user
USER node

# Health check built-in
HEALTHCHECK --interval=30s CMD curl -f http://localhost:4000/health || exit 1
```

### Docker Compose
- Orchestrasi lokal untuk development
- Variabel environment via `.env` file

### Kubernetes (Target Production)
- Deployment dengan resource limits
- Secrets untuk DATABASE_URL dan JWT keys (bukan .env file)
- Liveness & readiness probe ke `/health`

---

## 7. Code Quality & Developer Tools

### ts-node / tsx
- Jalankan TypeScript langsung di development
- Hot-reload via `nodemon`

### ESLint + Prettier (Opsional)
- Linting dan formatting konsisten
- Terintegrasi dengan IDE

### SonarQube
- Static analysis untuk security hotspot, maintainability, duplication
- Target: 0 Security Hotspot, duplication < 10%

---

## 8. Struktur Direktori

```
B-Kids/
├── prisma/
│   ├── schema.prisma          # Schema database (source of truth)
│   └── migrations/            # SQL migration files
│       └── 20260604102117_bkids/migration.sql
├── scripts/
│   └── seed.ts                # Data demo untuk development
├── src/
│   ├── config/
│   │   ├── env.ts             # Validasi & parsing environment variables
│   │   ├── database.ts        # Prisma client singleton
│   │   └── supabase.ts        # Supabase client (storage)
│   ├── middleware/
│   │   ├── auth.ts            # JWT verification middleware
│   │   ├── role.ts            # RBAC role check middleware
│   │   ├── activity.ts        # lastActiveAt tracker
│   │   ├── errorHandler.ts    # Global error handler
│   │   └── captcha.ts         # reCAPTCHA (nonaktif sementara)
│   ├── modules/
│   │   ├── auth/              # Register, login, profil, manajemen anak
│   │   ├── family/            # Daftar anak per parent
│   │   ├── parent/            # Banking, transfer, monitoring
│   │   ├── chores/            # Tugas & reward
│   │   ├── pockets/           # Pocket tabungan tujuan
│   │   ├── limits/            # Spending limit
│   │   ├── infaq/             # Sedekah ke lembaga
│   │   ├── vouchers/          # Marketplace voucher
│   │   ├── learning/          # E-Learning anak
│   │   ├── child/             # Dashboard & self-service anak
│   │   ├── admin/             # Admin panel seluruh platform
│   │   └── health/            # Health check endpoint
│   ├── types/
│   │   └── index.ts           # AuthenticatedRequest, tipe global
│   ├── utils/
│   │   ├── as-auth.ts         # Helper cast req → AuthenticatedRequest
│   │   └── toRupiah.ts        # Konversi BigInt sen → string Rupiah
│   ├── app.ts                 # Inisialisasi Express + middleware
│   └── server.ts              # Entry point, bind port
├── docs/
│   ├── BRD-v4.md              # Business Requirements Document
│   ├── use-case-diagram.md    # Use case diagram semua aktor
│   ├── api-documentation.md   # Dokumentasi semua endpoint API
│   ├── schema-database.md     # ERD + dokumentasi tabel
│   ├── tech-stack.md          # Dokumen ini
│   └── byond-kids-postman-collection.json
├── .env.example               # Template environment variables
├── Dockerfile
├── docker-compose.yml
├── jest.config.js
├── package.json
├── tsconfig.json
└── README.md
```

---

## 9. Environment Variables

| Variabel | Wajib | Deskripsi |
|---|---|---|
| `PORT` | Ya | Port server (default: 4000) |
| `NODE_ENV` | Ya | `development` / `production` |
| `DATABASE_URL` | Ya | PostgreSQL connection string (pooler) |
| `DIRECT_URL` | Ya | PostgreSQL direct connection (untuk migrate) |
| `JWT_SECRET` | Ya | Secret untuk access token (min 64 char) |
| `JWT_EXPIRES_IN` | Ya | Durasi access token (contoh: `8m`) |
| `JWT_REFRESH_SECRET` | Ya | Secret untuk refresh token (min 64 char) |
| `JWT_REFRESH_EXPIRES_IN` | Ya | Durasi refresh token (contoh: `7d`) |
| `ALLOWED_ORIGINS` | Ya | CORS origin whitelist (comma-separated) |
| `RATE_LIMIT_WINDOW_MS` | Ya | Window rate limit dalam ms (contoh: `900000`) |
| `RATE_LIMIT_MAX_REQUESTS` | Ya | Max request per window global |
| `LOGIN_RATE_LIMIT_MAX` | Ya | Max request per window untuk login |
| `BCRYPT_SALT_ROUNDS` | Ya | Salt rounds bcrypt (production: 12) |
| `SUPABASE_URL` | Opsional | URL Supabase (untuk file upload) |
| `SUPABASE_ANON_KEY` | Opsional | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Opsional | Supabase service role key |
| `SUPABASE_STORAGE_BUCKET` | Opsional | Nama bucket storage |

---

## 10. Dependensi NPM Utama

### Production

| Package | Versi | Fungsi |
|---|---|---|
| `@prisma/client` | 5.x | ORM client (auto-generated) |
| `bcryptjs` | 2.x | Hash password & PIN |
| `cors` | 2.x | CORS middleware |
| `express` | 4.x | HTTP framework |
| `express-rate-limit` | 7.x | Rate limiting |
| `helmet` | 7.x | Security headers |
| `jsonwebtoken` | 9.x | JWT sign & verify |
| `uuid` | 9.x | UUID v4 generation |
| `zod` | 3.x | Schema validation |

### Development

| Package | Versi | Fungsi |
|---|---|---|
| `typescript` | 5.x | TypeScript compiler |
| `ts-node` | 10.x | Jalankan TS langsung |
| `nodemon` | 3.x | Hot-reload development |
| `jest` | 30.x | Testing framework |
| `ts-jest` | 29.x | TypeScript transformer untuk Jest |
| `prisma` | 5.x | CLI Prisma (migrate, generate, studio) |
| `@types/*` | latest | Type definitions |
