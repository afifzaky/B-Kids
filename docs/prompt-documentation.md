# Prompt Engineering Documentation — Byond Kids Backend v4
**Proyek:** Byond Kids Backend REST API
**Metode Pengerjaan:** Vibe Coding dengan AI Assistance (Claude)
**Periode:** Februari – Juni 2026
**Disusun oleh:** IT Dev Team — Backend
**Versi Dokumen:** 1.0

---

## 1. Pendahuluan

### 1.1 Tujuan Dokumen

Dokumen ini merupakan catatan resmi sesi *AI-assisted development* yang dilakukan selama pengerjaan backend Byond Kids v1 hingga v4. Dokumen ini disusun sebagai:

- **Evidens IT Risk & Audit** — transparansi terhadap proses pengerjaan sistem perbankan digital berbasis AI
- **Knowledge Transfer** — referensi pola prompt yang efektif untuk pengembangan berikutnya
- **Traceability** — memetakan setiap keputusan teknis ke sesi prompt yang menghasilkannya

### 1.2 Metodologi: Vibe Coding dalam Konteks Banking IT

**Vibe Coding** adalah pendekatan pengembangan software yang memanfaatkan Large Language Model (LLM) sebagai *pair programmer* dalam siklus iteratif: spesifikasi → generasi kode → review → validasi. Dalam konteks banking IT, pendekatan ini diterapkan dengan batasan berikut:

| Aspek | Standar yang Diterapkan |
|---|---|
| **Review Wajib** | Setiap output AI direview oleh developer sebelum di-commit |
| **Security Gate** | Output yang menyentuh auth, kriptografi, dan transaksi wajib divalidasi terhadap OWASP Top 10 dan SonarQube |
| **Test Coverage** | Unit test ditulis untuk semua service layer; mock mengikuti isolasi layer |
| **Audit Trail** | Semua keputusan arsitektur didokumentasikan dalam dokumen ini dan BRD |
| **No Plain Text Secret** | AI tidak pernah diminta generate secret key, password produksi, atau credential nyata |

### 1.3 Tools

| Tool | Versi | Fungsi |
|---|---|---|
| Claude (Anthropic) | claude-sonnet-4-6 | AI pair programmer |
| Claude Code CLI | Latest | Interface terminal untuk AI assistance |
| SonarQube | — | Static analysis & security gate |
| Jest | 30.x | Validasi unit test pasca generasi |
| TypeScript Compiler | 5.x | Type safety gate (`npx tsc --noEmit`) |

---

## 2. Log Sesi Pengerjaan

---

### [SESI 01] Inisialisasi Arsitektur Backend

**Tanggal:** Februari 2026
**Kategori:** Architecture Design & Scaffolding
**Fase Produk:** v1.0

#### Context
Proyek baru. Stack sudah ditentukan (Node.js + TypeScript + Express + Prisma + PostgreSQL via Supabase). Perlu scaffold arsitektur modular sesuai domain banking (auth, keluarga, rekening, transaksi).

#### Prompt

```
Design and implement a modular REST API backend for a children's digital banking
application ("Byond Kids") using Node.js 22, TypeScript strict mode, Express.js,
and Prisma ORM with PostgreSQL.

Requirements:
- Role-based access control: SUPER_ADMIN, PARENT, CHILD
- JWT authentication: short-lived access token (8min) + refresh token rotation (7d)
- All monetary values stored as BigInt in sen (IDR × 100) to avoid floating-point
  precision errors — standard practice for core banking systems
- Module structure follows domain-driven layout:
  src/modules/{auth,family,parent,chores,pockets,limits,infaq,vouchers,admin,child}
- Each module: service (business logic) / controller (HTTP layer) / routes / validator (Zod)
- Global middleware: Helmet security headers, CORS whitelist, express-rate-limit,
  activity tracker
- Prisma schema covering: User, ParentProfile, ChildProfile, FamilyLink,
  ChildAccount, AccountLedger (append-only), Pocket, PocketLedger (append-only),
  Chore + ChoreSubmission, SpendingLimit, InfaqLog, VoucherCatalog,
  VoucherRedemption, ParentLedger (append-only), RefreshToken, AuditLog

Enforce invariants:
- Ledger tables are INSERT-ONLY (no UPDATE/DELETE on financial records)
- All balance mutations wrapped in Prisma $transaction for atomicity
- bcrypt cost factor 12 for all password and PIN hashing
- Login lockout after 5 failed attempts (15-min lockout window)
```

#### Output AI

| Artefak | Keterangan |
|---|---|
| `prisma/schema.prisma` | Schema lengkap 19 tabel + semua enum |
| `src/app.ts` | Express app factory dengan middleware stack |
| `src/modules/auth/` | Register parent, login (parent/child/admin), refresh, logout |
| `src/modules/family/` | List anak per parent |
| `src/modules/parent/` | Banking: saldo, deposit, transfer, monitoring |
| `src/config/env.ts` | Zod-validated environment config |
| `src/middleware/` | auth, role, activity, errorHandler |
| `.env.example` | Template env variabel |

#### Validasi Pasca-Generasi

- `npx tsc --noEmit` — pass
- Manual review: JWT rotation, lockout logic, BigInt serialization

---

### [SESI 02] Implementasi Fitur Chores, Pockets, Limits, Infaq, Vouchers

**Tanggal:** Maret 2026
**Kategori:** Feature Development
**Fase Produk:** v2.0

#### Context
Domain core banking sudah berjalan. Perlu implementasi fitur gamifikasi (chores + reward), financial goals (pockets), spending control (limits), social finance (infaq), dan marketplace (vouchers).

#### Prompt

```
Implement the following business domains for the Byond Kids banking backend,
following the existing module pattern (service / controller / routes / validator):

1. CHORES — Task & Reward System
   - Parent creates chore with rewardAmount (BigInt sen) and deadline for specific child
   - Child submits completion evidence (mediaUrl + notes); max 2 attempts per chore
   - Submission flow: ACTIVE → PENDING_REVIEW → APPROVED | REJECTED | REVISION_NEEDED
   - On APPROVED: atomic $transaction debit parent dummyBalance + credit child
     ChildAccount + create both ParentLedger(CHORE_REWARD) and
     AccountLedger(CHORE_REWARD) entries
   - ChoreStatus enum: ACTIVE, PENDING_REVIEW, APPROVED, REJECTED, REVISION_NEEDED,
     EXPIRED, CANCELLED

2. POCKETS — Goal-Based Savings
   - Child allocates from ChildAccount to Pocket (POCKET_ALLOCATE debit+credit)
   - Child deallocates back to ChildAccount (POCKET_DEALLOCATE)
   - Pocket categories: JAJAN, HAJI, QURBAN, INFAQ, CUSTOM
   - Deactivation auto-returns balance to ChildAccount via $transaction
   - isGoalCompleted flag when balance >= targetAmount

3. SPENDING LIMITS
   - Parent sets DAILY/WEEKLY/MONTHLY limit per child
   - Optional: per voucherType category limit (GAME_TOPUP, etc.)
   - NULL voucherType = general limit; coexists with category limits
   - PostgreSQL partial unique index: UNIQUE(childProfileId, period, voucherType)
   - Enforcement: checked during voucher purchase and infaq (excludeInfaq flag)

4. INFAQ — Islamic Charitable Giving
   - InfaqInstitutionConfig managed by SUPER_ADMIN (BSI Maslahat, BAZNAS, LAZISNU, etc.)
   - Child initiates infaq: debit ChildAccount + create InfaqLog + AccountLedger(INFAQ)
   - Respects spending limit unless excludeInfaq = true

5. VOUCHER MARKETPLACE
   - VoucherCatalog: stock management, maxPerChild enforcement, validity period
   - Purchase: PIN verification + spending limit check + stock decrement + redemption record
   - VoucherType enum: DISCOUNT, GAME_TOPUP, E_WALLET, EDUCATION
```

#### Output AI

| Artefak | Keterangan |
|---|---|
| `src/modules/chores/` | Lengkap: create, list, submit, approve, reject |
| `src/modules/pockets/` | CRUD + topup + deactivation |
| `src/modules/limits/` | Set general + category limit |
| `src/modules/infaq/` | List institutions, kirim infaq, riwayat |
| `src/modules/vouchers/` | Katalog, beli, riwayat |
| `src/app.ts` | Route registration tambahan |

#### Validasi Pasca-Generasi

- Atomic transaction test: approve chore → verifikasi debit parent + kredit anak konsisten
- Spending limit enforcement: manual test pembelian voucher melebihi limit

---

### [SESI 03] Admin Panel, Child Self-Service, Audit Log

**Tanggal:** April – Mei 2026
**Kategori:** Feature Development + Observability
**Fase Produk:** v3.0

#### Context
Backend perlu admin panel untuk operational support dan audit trail untuk kepatuhan. Child self-service untuk dashboard dan monitoring mandiri anak.

#### Prompt

```
Implement Admin Panel and operational modules for the banking backend:

ADMIN MODULE (role: SUPER_ADMIN)
- Platform statistics: user counts, transaction volumes, infaq totals
- Parent account management: list (paginated + search), detail with all children,
  activate/deactivate, manual balance adjustment, ledger history
- Child account management: list, detail with account + pockets, activate/deactivate
- Voucher catalog CRUD: create/update/delete (soft-deactivate if has redemptions)
- Infaq institution CRUD + activate/deactivate
- Audit log viewer: filterable by userId, action, entity, date range
- All admin mutations must create AuditLog entries

CHILD SELF-SERVICE MODULE (role: CHILD)
- Dashboard: aggregated view (balance, pocket count, pending chores, XP stub)
- Profile: child profile details
- Account: ChildAccount with balance
- Transactions: AccountLedger history (paginated)
- Avatar update: emoji or URL

AUDIT LOG
- Model: AuditLog { userId, action, entityType, entityId, oldValues(JSON),
  newValues(JSON), ipAddress, userAgent }
- Log entries for: parent status change, balance adjustment, child status change,
  voucher CRUD, institution CRUD, chore approve/reject

Write unit tests for admin.service.ts covering all service functions.
Use Jest with Prisma mock pattern (src/__mocks__/prisma.ts).
```

#### Output AI

| Artefak | Keterangan |
|---|---|
| `src/modules/admin/admin.service.ts` | 15 service functions |
| `src/modules/admin/admin.controller.ts` | HTTP layer admin |
| `src/modules/admin/admin.routes.ts` | 20+ route definitions |
| `src/modules/admin/admin.validator.ts` | Zod schemas |
| `src/modules/child/` | Dashboard, profile, account, transactions, avatar |
| `src/modules/health/` | Health check endpoint |
| `src/__tests__/admin.service.test.ts` | Unit test suite |

---

### [SESI 04] Bug Fix — Unit Test Failures (Jest 30 Compatibility)

**Tanggal:** Mei 2026
**Kategori:** Test Engineering / Debugging
**Fase Produk:** v3.0 (stabilization)

#### Context
Setelah upgrade ke Jest 30, 5 unit test pada `admin.service.test.ts` failing. Root cause tidak jelas dari error message saja — perlu investigasi behavior Jest 30 terkait mock queue management.

#### Prompt

```
Debug and fix 5 failing unit tests in src/__tests__/admin.service.test.ts.
The test suite uses Jest 30 with ts-jest. Prisma client is mocked via
src/__mocks__/prisma.ts using jest.fn() factory.

Observed failures:
1. listParents — total count returns 0 instead of 2
2. adjustParentBalance — ledger entry.id is undefined (transaction mock broken)
3. deleteVoucher — test expects throw but service soft-deactivates instead
4. getInfaqStats — property path mismatch (result.allTime vs result.summary.allTime)
5. setInstitutionStatus — test expects idempotency guard that doesn't exist in service

Investigate whether failures are caused by:
a) Jest 30 behavior change in mockResolvedValueOnce queue persistence across
   clearAllMocks() boundaries
b) Mock $transaction returning undefined due to prior test contamination
c) Test assertions misaligned with actual service behavior

Fix each test with minimal scope change — do not modify the service under test.
```

#### Output AI — Root Causes Ditemukan

| # | Root Cause | Fix |
|---|---|---|
| 1 | `getPlatformStats` antri 5x `mockResolvedValueOnce` untuk `user.count`, service hanya call 4x. Sisa nilai `0` di Jest 30 **persist** melewati `clearAllMocks()` dan kontaminasi test berikutnya | Kurangi antrian ke 4 entri, sesuai jumlah call aktual |
| 2 | Test sebelumnya set `$transaction.mockResolvedValue(undefined)` — di Jest 30 ini override `mockImplementation` dari factory dan tidak di-reset oleh `clearAllMocks()` | Override inline dengan `mockImplementation(async cb => cb(tx))` |
| 3 | Service soft-deactivate (bukan throw) jika voucher punya redemption | Ubah assertion ke `result.deactivated === true` |
| 4 | Service return `result.summary.allTime`, test cek `result.allTime` | Update path di `toHaveProperty` |
| 5 | Service tidak punya guard idempotency status | Replace test: verifikasi service selalu update |

#### Key Learning
> Jest 30 mengubah perilaku `specificReturnValues` (queue dari `mockResolvedValueOnce`) — nilai tersisa di queue **tidak dibersihkan** oleh `clearAllMocks()` dan mengambil prioritas lebih tinggi dari `mockImplementation`. Gunakan `mockImplementation` untuk mock yang perlu state bersih antar test.

---

### [SESI 05] Implementasi Modul E-Learning dengan Sistem Gamifikasi

**Tanggal:** Mei 2026
**Kategori:** Feature Development — New Domain
**Fase Produk:** v4.0

#### Context
Roadmap v4 mengharuskan penambahan fitur edukasi keuangan interaktif untuk anak. Fitur ini harus terintegrasi dengan sistem reward (koin dari saldo orang tua) menggunakan pola yang sama dengan chore approval, serta memiliki sistem gamifikasi (XP + level) untuk meningkatkan engagement.

#### Prompt

```
Implement a full E-Learning module for the Byond Kids banking backend (v4).

BUSINESS REQUIREMENTS:
- Content managed exclusively by SUPER_ADMIN
- Child consumes published content (read articles, take quizzes)
- Reward mechanism: on quiz pass, auto-credit coin reward from parent's dummyBalance
  to child's ChildAccount — same atomic $transaction pattern as approveChore
- One-time quiz enforcement: child cannot retake a quiz once submitted
- Security: correct answers (isCorrect field) must NEVER be sent to client before
  quiz submission — strip via helper function before serializing response

SCHEMA ADDITIONS (Prisma):
- LearningModule { id, title, category(LearningCategory enum), thumbnail,
  isPublished, order, createdById }
- LearningArticle { id, moduleId?, title, content, imageUrl, category,
  difficulty(LearningDifficulty), readingTimeMin, xpReward, isPublished, order }
- Quiz { id, articleId(1-to-1), xpBonus, coinReward(BigInt sen), passScore(int%) }
- QuizQuestion { id, quizId, question, options(JSON: [{text, isCorrect}]),
  explanation?, order }
- LearningProgress { id, childProfileId, articleId, readCompletedAt?,
  quizScore?, quizPassedAt?, xpEarned, rewardPaidAt? }
  UNIQUE(childProfileId, articleId)
- ChildXpBalance { id, childProfileId(1-to-1), totalXp, level }
- Add LEARNING_REWARD to TransactionSource and ParentTransactionSource enums

GAMIFICATION RULES:
- XP levels: 1(0-99), 2(100-249), 3(250-499), 4(500-999), 5(1000+)
- completeArticle: idempotent, grants xpReward, upsert ChildXpBalance
- submitQuiz: check quizScore IS NULL guard → calculate score → if passed:
  creditLearningReward() via $transaction
- creditLearningReward: find parent via FamilyLink → debit dummyBalance →
  ParentLedger(LEARNING_REWARD) → credit ChildAccount → AccountLedger(LEARNING_REWARD)

MODULES TO CREATE:
1. src/modules/learning/ — child-facing (verifyToken + checkRole CHILD)
   Routes: GET /modules, GET /articles, GET /articles/:id, POST /articles/:id/complete,
   GET /articles/:id/quiz, POST /articles/:id/quiz/submit, GET /my-progress

2. src/modules/admin/admin.learning.* — admin CRUD (SUPER_ADMIN only)
   Routes under /api/admin/learning/:
   GET /stats, CRUD /modules, CRUD /articles, PUT/DELETE /articles/:id/quiz

VALIDATION (Zod):
- upsertQuizSchema: each question must have exactly 1 isCorrect:true option
- submitQuizSchema: array of {questionId: UUID, optionIndex: number}

Register new routes in app.ts and admin.routes.ts.
```

#### Output AI

| Artefak | Keterangan |
|---|---|
| `prisma/schema.prisma` | +6 model, +enum values LEARNING_REWARD |
| `src/modules/learning/learning.service.ts` | `listModules`, `listArticles`, `getArticle`, `completeArticle`, `getQuiz`, `submitQuiz`, `getMyProgress`, `calculateLevel`, `stripCorrectAnswers`, `creditLearningReward` |
| `src/modules/learning/learning.controller.ts` | HTTP layer |
| `src/modules/learning/learning.routes.ts` | 7 routes, semua `CHILD` only |
| `src/modules/learning/learning.validator.ts` | `submitQuizSchema` |
| `src/modules/admin/admin.learning.service.ts` | CRUD modul, artikel, kuis + stats |
| `src/modules/admin/admin.learning.controller.ts` | HTTP layer admin |
| `src/modules/admin/admin.learning.validator.ts` | `upsertQuizSchema` dengan validasi 1 jawaban benar |
| `src/app.ts` | Register `/api/learning` |
| `src/modules/admin/admin.routes.ts` | +11 admin learning routes |

#### Security Controls yang Diimplementasikan

```typescript
// Anti-gaming: one-time quiz enforcement
if (progress.quizScore !== null && progress.quizScore !== undefined) {
  throw createError('QUIZ_ALREADY_TAKEN', 'Kuis sudah pernah diambil', 403);
}

// Correct answer masking before client response
function stripCorrectAnswers(questions: QuizQuestion[]) {
  return questions.map(q => ({
    ...q,
    options: (q.options as QuizOption[]).map(({ text }, index) => ({ text, index })),
  }));
}
```

#### Validasi Pasca-Generasi

- `npx tsc --noEmit` — pass (setelah fix unused var `_req` dan `totalAnswered`)
- Review manual: alur reward, quiz guard, answer masking

---

### [SESI 06] Keputusan Arsitektur Database — Migrasi ke PostgreSQL On-Premise

**Tanggal:** Juni 2026
**Kategori:** Architecture Decision / Database Engineering
**Fase Produk:** v4.0 (pre-production)

#### Context
Tim Ops telah menyiapkan infrastruktur PostgreSQL on-premise (VM1 primary, VM2 streaming replica). Database development saat ini menggunakan Supabase dengan workflow `prisma db push` (non-migration). Perlu transisi ke `prisma migrate deploy` untuk reproducibility dan auditability di production.

#### Prompt

```
Provide database architecture recommendation and migration plan for transitioning
Byond Kids backend from Supabase (dev) to on-premise PostgreSQL cluster (production).

Infrastructure available:
- VM1: PostgreSQL 15, host 192.168.23.67:5432, db bkidsdb (PRIMARY — read/write)
- VM2: PostgreSQL 15, streaming replica from VM1 (READ REPLICA + backup)

Current state:
- Development used `prisma db push` — no migration history exists
- Schema is final (v4, 25 tables including E-Learning)
- Branch: backend/b-kids

Requirements:
1. Recommend VM role assignment (primary/replica/backup strategy)
2. Determine migration workflow: db push vs migrate deploy for production
3. Generate complete migration SQL from scratch (from-empty baseline) since
   there is no prior migration history
4. Provide final DATABASE_URL and DIRECT_URL for Kubernetes Secret configuration
5. Provide deployment command sequence for ops team

Security constraints:
- Credentials must be injected via Kubernetes Secrets, not .env files in image
- Connection string must not appear in application logs
```

#### Output AI — Keputusan Arsitektur

| Keputusan | Pilihan | Alasan |
|---|---|---|
| VM1 | PostgreSQL PRIMARY (read/write) | Semua write operations + aplikasi utama |
| VM2 | Streaming replica + backup storage | HA readiness, zero-RPO failover candidate |
| Migration workflow | `prisma migrate deploy` | Reproducible, auditable, idempotent — standar production |
| Baseline migration | `prisma migrate diff --from-empty` | Generate SQL lengkap dari schema final sebagai single initial migration |

#### Migration SQL Generation

```bash
# Generate complete baseline migration (550 lines, 25 tables)
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script \
  > prisma/migrations/20260604102117_bkids/migration.sql

# Production deployment command
DATABASE_URL=postgresql://bkids:***@192.168.23.67:5432/bkidsdb \
npx prisma migrate deploy

# Generate Prisma client for new schema
npx prisma generate
```

#### Output Artefak

| Artefak | Keterangan |
|---|---|
| `prisma/migrations/20260604102117_bkids/migration.sql` | 550 baris SQL, schema lengkap dari empty — siap `migrate deploy` |

---

### [SESI 07] Service Degradation — Nonaktifkan Fitur Bergantung Email

**Tanggal:** Juni 2026
**Kategori:** Feature Flag / Controlled Service Degradation
**Fase Produk:** v4.0 (pre-production hardening)

#### Context
Fitur recovery (forgot-password, reset-password, forgot-username) memerlukan SMTP service yang belum dikonfigurasi di environment production. Untuk menghindari runtime error pada endpoint yang bergantung pada email service yang belum ready, fitur ini perlu dinonaktifkan secara terkontrol sebelum deployment ke VM1.

Selain itu, reCAPTCHA middleware perlu dilepas dari flow register/login karena CAPTCHA site key belum dikonfigurasi di production environment. Kedua perubahan ini bersifat sementara dan harus mudah diaktifkan kembali.

#### Prompt

```
Implement controlled service degradation for email-dependent authentication features
in auth.routes.ts before production deployment to VM1.

Changes required:
1. Remove requireCaptcha middleware from all register/login routes
   (CAPTCHA site key not yet provisioned in production environment)
   — Remove import, remove from route chain, comment out passwordResetLimiter
     definition since it was only referenced by disabled routes

2. Disable password/username recovery routes with clear re-enablement comment:
   - POST /forgot-password
   - POST /reset-password
   - POST /forgot-username
   - POST /forgot-child-password
   Reason: SMTP service (nodemailer/SendGrid) not yet configured in production.
   Comment must indicate exact condition to re-enable.

Ensure:
- No dead code imports remain (remove captcha import entirely)
- Commented-out routes must be syntactically valid for easy uncomment
- No functional regression on active auth routes (register, login, refresh, logout)
```

#### Output AI

```typescript
// Perubahan pada src/modules/auth/auth.routes.ts

// Dihapus:
// import { requireCaptcha } from '../../middleware/captcha';

// Dikomentari (re-enable setelah SMTP dikonfigurasi):
// const passwordResetLimiter = rateLimit({ ... });
// router.post('/forgot-password', passwordResetLimiter, AuthController.forgotPassword);
// router.post('/reset-password',  passwordResetLimiter, AuthController.resetPassword);
// router.post('/forgot-username', passwordResetLimiter, AuthController.forgotUsername);
// router.post('/forgot-child-password', ..., AuthController.forgotChildPassword);
```

#### Kondisi Re-Enablement (Tercatat dalam kode)

```
Fitur password/username recovery — dinonaktifkan sementara, aktifkan kembali setelah
email service (SMTP) dikonfigurasi di environment production.
```

---

### [SESI 08] Security Remediation — SonarQube Hotspot S2245 (CWE-338)

**Tanggal:** Juni 2026
**Kategori:** Security Engineering — Vulnerability Remediation
**Fase Produk:** v4.0

#### Context
Tim IT Security melakukan scan SonarQube dan menemukan 9 Security Hotspot kategori **Weak Cryptography** (rule S2245, severity CRITICAL). Temuan terkait penggunaan `Math.random()` untuk generate kode voucher di seed script. Selain security fix, perlu refactoring untuk meningkatkan maintainability (mengurangi code duplication yang terdeteksi SonarQube: 27.6% overall duplication).

**Temuan SonarQube:**
- Rule: `S2245` — "Make sure that this pseudorandom number generator (PRNG) is safe here"
- CWE: CWE-338 — Use of Cryptographically Weak Pseudo-Random Number Generator
- File: `scripts/seed.ts`, 7 occurrences (lines 415, 428, 441, 454, 467, 480, 493)
- Pattern: `Math.random().toString(36).slice(2, 10).toUpperCase()`

#### Prompt

```
Remediate SonarQube S2245 (CWE-338) security hotspot in scripts/seed.ts.

Current vulnerable pattern (7 occurrences):
  mockCode: 'SHOPEE-BYOND-' + Math.random().toString(36).slice(2, 10).toUpperCase()

Requirements:
1. Replace Math.random() with CSPRNG:
   Use Node.js built-in crypto.randomBytes() — recognized as cryptographically
   secure by SonarQube, does not trigger S2245
   No additional npm packages required.

2. Refactor for high maintainability (SonarQube Maintainability gate):
   Extract a single helper function to eliminate 7-way duplication:
   function generateMockCode(prefix: string): string
   This directly reduces duplication metric for the file.

3. Output format requirement:
   crypto.randomBytes(4).toString('hex').toUpperCase()
   → 8 uppercase hex characters (equivalent entropy to prior 8-char base36 output)

4. Import placement: Node.js built-in imports first (crypto), then external packages.

Verify: zero Math.random() references remain in the file post-fix.
TypeScript must compile without errors (npx tsc --noEmit).
```

#### Output AI

```typescript
// Import ditambahkan di baris pertama (Node built-in first)
import crypto from 'crypto';

// Helper function diekstrak sebelum main()
function generateMockCode(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

// 7 call sites diganti (contoh):
// SEBELUM:
mockCode: 'SHOPEE-BYOND-' + Math.random().toString(36).slice(2, 10).toUpperCase()

// SESUDAH:
mockCode: generateMockCode('SHOPEE-BYOND')
```

#### Hasil Verifikasi

```bash
# Zero occurrence Math.random
grep "Math.random" scripts/seed.ts
# (no output — bersih)

# TypeScript compile check
npx tsc --noEmit
# (no output — pass)
```

#### Dampak ke SonarQube

| Metrik | Sebelum | Setelah |
|---|---|---|
| Security Hotspot S2245 | 7 instance | 0 instance |
| Code duplication (seed.ts) | 7 baris identik | 1 helper function |
| CSPRNG compliance | Tidak | Ya (`crypto.randomBytes`) |

---

### [SESI 09] Penyusunan Dokumentasi Teknis Lengkap

**Tanggal:** Juni 2026
**Kategori:** Technical Documentation
**Fase Produk:** v4.0 (IT Dev Evidens)

#### Context
Persiapan evidens untuk tim IT Dev sesuai kriteria penilaian. Dokumentasi harus mencakup seluruh aspek sistem dari sudut pandang perbankan digital: BRD, use case, API specification, database schema, dan tech stack.

#### Prompt

```
Generate comprehensive technical documentation suite for the Byond Kids banking
backend v4, placed in the docs/ directory.

Documents required:

1. BRD-v4.md — Business Requirements Document
   - Document versioning (v1 through v4 change history)
   - Executive summary, business objectives with KPI indicators
   - Complete actor definitions (SUPER_ADMIN, PARENT, CHILD) with full access matrix
   - Functional requirements per module (F-AUTH, F-BNK, F-CHR, F-PKT, F-LMT,
     F-INF, F-VCH, F-LRN, F-ADM) with priority levels
   - Non-functional requirements: security, data integrity, performance, maintainability
   - Business rules: ledger immutability, atomicity requirements, XP system spec
   - System architecture diagram (ASCII)
   - Development roadmap Phase 1–6

2. use-case-diagram.md
   - ASCII use case diagram for all three actors
   - Detailed use case specification for 4 critical flows:
     Transfer to Child, Approve Chore, Submit Quiz, Buy Voucher
     (include pre/post conditions, normal flow, alternative flow)
   - RBAC access matrix table

3. api-documentation.md
   - All 60+ endpoints documented with: method, path, auth role, request body,
     response body (with field descriptions), error codes
   - Organized by module/domain
   - Standard response envelope format documented

4. schema-database.md
   - Mermaid ERD covering all 25 tables with relationships
   - Per-table documentation: column, type, constraints, business rules
   - Table summary with purpose and notes (append-only, admin-managed, etc.)

5. tech-stack.md
   - Full dependency inventory with versions and rationale
   - Security stack explanation (helmet, bcrypt, JWT rotation, CSPRNG)
   - Database workflow (Prisma migrate lifecycle)
   - Directory structure
   - Environment variable reference
```

#### Output AI

| Dokumen | Ukuran | Cakupan |
|---|---|---|
| `docs/BRD-v4.md` | 18 KB / 414 baris | 10 modul, 60+ functional requirements |
| `docs/use-case-diagram.md` | 18 KB / 258 baris | 3 aktor, 4 use case detail, RBAC matrix |
| `docs/api-documentation.md` | 24 KB / 1.569 baris | 60+ endpoint, request/response lengkap |
| `docs/schema-database.md` | 19 KB / 688 baris | ERD Mermaid, 25 tabel terdokumentasi |
| `docs/tech-stack.md` | 9.5 KB / 288 baris | Stack, security, env vars, struktur direktori |

---

## 3. Ringkasan Keputusan Teknis Signifikan

| # | Keputusan | Sesi | Alasan |
|---|---|---|---|
| D-01 | Semua nilai uang sebagai BigInt (sen) | 01 | Hindari floating-point error — standar core banking |
| D-02 | Ledger tabel bersifat append-only | 01 | Immutability financial record — audit requirement |
| D-03 | JWT access token 8 menit + refresh rotation | 01 | Balance security/UX; token pendek = minimal exposure window |
| D-04 | Prisma `$transaction` untuk semua mutasi saldo | 01–05 | Atomicity — tidak boleh ada partial update pada transaksi keuangan |
| D-05 | `crypto.randomBytes()` untuk semua token/kode | 08 | CSPRNG — compliance SonarQube S2245, CWE-338 |
| D-06 | `prisma migrate deploy` untuk production | 06 | Reproducible, idempotent, auditable — vs `db push` yang tidak traceable |
| D-07 | isCorrect distrip sebelum dikirim ke client | 05 | Anti-cheat: jawaban benar tidak boleh ada di response sebelum submit |
| D-08 | Quiz one-time enforcement via null-check guard | 05 | Integritas assessment — anak tidak bisa retry untuk dapat reward berulang |
| D-09 | FamilyLink sebagai authorization gate | 02–05 | Parent hanya bisa operasi pada anak yang benar-benar terhubung |
| D-10 | Commented-out routes (bukan deleted) untuk fitur pending SMTP | 07 | Maintainability: mudah re-enable tanpa git blame archaeology |

---

## 4. Pola Prompt yang Efektif untuk Banking IT

Berdasarkan pengalaman 9 sesi di atas, berikut pola prompt yang konsisten menghasilkan output berkualitas tinggi untuk banking backend:

### 4.1 Spesifikasi Constraint Eksplisit

Selalu nyatakan invariant bisnis secara eksplisit dalam prompt, bukan hanya deskripsi fitur:

```
✓ "All balance mutations MUST be wrapped in Prisma $transaction for atomicity.
   Ledger tables are INSERT-ONLY — no UPDATE or DELETE on financial records."

✗ "Buat fitur transfer yang aman"
```

### 4.2 Referensi Pola yang Sudah Ada

AI menghasilkan output lebih konsisten jika diberi referensi pola eksisting:

```
✓ "Follow the same atomic $transaction pattern as approveChore:
   debit parent dummyBalance → ParentLedger → credit ChildAccount → AccountLedger"

✗ "Buat reward seperti approve chore tapi untuk quiz"
```

### 4.3 Security Requirement sebagai Hard Constraint

Requirement keamanan harus dinyatakan sebagai constraint, bukan suggestion:

```
✓ "correct answers (isCorrect field) must NEVER be sent to client before quiz
   submission — enforce via stripCorrectAnswers() helper"

✗ "jangan kirim jawaban benar ke user"
```

### 4.4 Scope Pembatasan pada Bug Fix

Untuk bug fix, batasi scope secara eksplisit untuk mencegah AI memodifikasi file di luar target:

```
✓ "Fix each test with minimal scope change — do not modify the service under test."

✗ "Fix semua yang error"
```

### 4.5 Verifikasi Command sebagai Bagian Prompt

Sertakan langkah verifikasi di akhir prompt:

```
✓ "Verify: zero Math.random() references remain. TypeScript must compile
   without errors (npx tsc --noEmit)."
```

---

## 5. Catatan untuk Pengembangan Selanjutnya (v5)

| Fitur | Dependency Teknis yang Harus Diselesaikan Dulu |
|---|---|
| Aktifkan forgot-password / reset-password | SMTP provider dikonfigurasi di environment production |
| Aktifkan reCAPTCHA | CAPTCHA site key + secret key di-provision |
| Integrasi BSI Open API (replace dummy balance) | API contract dari BSI, credentials sandbox |
| Push notification | Firebase FCM / APNs credential |
| ML Recommendation Engine | Model serving endpoint, integrasi inference API |

---

*Dokumen ini dibuat sebagai bagian dari evidence IT Dev — Byond Kids Backend v4.*
*Semua kode yang di-generate telah melalui review manual, type checking (`tsc --noEmit`), dan unit testing sebelum di-commit.*
