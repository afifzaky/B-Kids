/**
 * BYOND KIDS — Seed Script
 * Jalankan: npm run db:seed
 * Reset + seed: npm run db:reset
 *
 * Membuat data demo siap pakai untuk presentasi:
 * - 1 akun orang tua (Budi Santoso)
 * - 2 anak (Aisha, Rizky)
 * - Pocket default + beberapa pocket tambahan
 * - Beberapa chores aktif
 * - Voucher catalog
 */

import crypto from 'crypto';

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

function generateMockCode(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

async function main() {
  console.log('🌱 Memulai seed data demo...\n');

  // Cleanup urutan penting karena ada foreign key
  await prisma.auditLog.deleteMany();
  await prisma.choreSubmission.deleteMany();
  await prisma.chore.deleteMany();
  await prisma.pocketLedger.deleteMany();
  await prisma.pocket.deleteMany();
  await prisma.accountLedger.deleteMany();
  await prisma.childAccount.deleteMany();
  await prisma.spendingLimit.deleteMany();
  await prisma.infaqLog.deleteMany();
  await prisma.voucherRedemption.deleteMany();
  await prisma.familyLink.deleteMany();
  await prisma.childProfile.deleteMany();
  await prisma.parentProfile.deleteMany();
  await prisma.voucherCatalog.deleteMany();
  await prisma.infaqInstitutionConfig.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Data lama dihapus');

  // =============================================
  // 0. LEMBAGA INFAQ — Dikelola Admin
  // =============================================
  await prisma.infaqInstitutionConfig.createMany({
    data: [
      {
        code: 'BSI_MASLAHAT',
        name: 'BSI Maslahat',
        description: 'Lembaga amil zakat dan wakaf afiliasi Bank Syariah Indonesia',
        bankInfo: 'BSI - 7155555001 a.n. BSI Maslahat',
        isActive: true,
      },
      {
        code: 'BAZNAS',
        name: 'BAZNAS',
        description: 'Badan Amil Zakat Nasional — badan pemerintah untuk pengelolaan zakat',
        bankInfo: 'BSI - 7155555002 a.n. BAZNAS',
        isActive: true,
      },
      {
        code: 'LAZISNU',
        name: 'LAZISNU',
        description: 'Lembaga Amil Zakat Infaq Sedekah Nahdlatul Ulama',
        bankInfo: 'BSI - 7155555003 a.n. LAZISNU',
        isActive: true,
      },
      {
        code: 'LAZISMU',
        name: 'LAZISMU',
        description: 'Lembaga Amil Zakat Infaq dan Sedekah Muhammadiyah',
        bankInfo: 'BSI - 7155555004 a.n. LAZISMU',
        isActive: true,
      },
      {
        code: 'RUMAH_ZAKAT',
        name: 'Rumah Zakat',
        description: 'Lembaga amil zakat nasional yang fokus pada program pemberdayaan masyarakat',
        bankInfo: 'BSI - 7155555005 a.n. Rumah Zakat',
        isActive: true,
      },
    ],
  });

  console.log('✅ Lembaga infaq: 5 lembaga ditambahkan (BSI Maslahat, BAZNAS, LAZISNU, LAZISMU, Rumah Zakat)');

  // =============================================
  // 0. SUPER ADMIN
  // =============================================
  const adminPasswordHash = await bcrypt.hash('Admin@Byond2026!', SALT_ROUNDS);

  await prisma.user.create({
    data: {
      email: 'admin@byond.id',
      passwordHash: adminPasswordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Super Admin: admin@byond.id (Password: Admin@Byond2026!)');

  // =============================================
  // 1. ORANG TUA — Budi Santoso
  // =============================================
  const parentPasswordHash = await bcrypt.hash('Byond@2026', SALT_ROUNDS);
  const parentPinHash = await bcrypt.hash('123456', SALT_ROUNDS);

  const parentUser = await prisma.user.create({
    data: {
      email: 'budi.santoso@demo.byond.id',
      phone: '08123456789',
      passwordHash: parentPasswordHash,
      role: 'PARENT',
    },
  });

  const parentProfile = await prisma.parentProfile.create({
    data: {
      userId: parentUser.id,
      fullName: 'Budi Santoso',
      nik: '3171234567890001',
      dateOfBirth: new Date('1985-04-15'),
      bsiAccountNumber: '7123456789',
      pinHash: parentPinHash,
      dummyBalance: BigInt(10_000_000_00), // Rp 10.000.000
    },
  });

  console.log(`✅ Orang tua: ${parentProfile.fullName} (${parentUser.email})`);

  // =============================================
  // 2. ANAK 1 — Aisha Ramadhani (13 tahun)
  // =============================================
  const pin1Hash = await bcrypt.hash('123456', SALT_ROUNDS);

  const aishaUser = await prisma.user.create({
    data: {
      email: `child-${uuidv4()}@byond.internal`,
      passwordHash: pin1Hash,
      role: 'CHILD',
    },
  });

  const aishaProfile = await prisma.childProfile.create({
    data: {
      userId: aishaUser.id,
      fullName: 'Aisha Ramadhani',
      dateOfBirth: new Date('2012-07-20'),
      username: 'aisha_byond',
      pinHash: pin1Hash,
      deviceId: 'demo-device-aisha-001',
      createdByParentId: parentProfile.id,
      childAccountNumber: '7987654321',
    },
  });

  // Rekening Aisha — saldo Rp 150.000
  const aishaAccount = await prisma.childAccount.create({
    data: {
      childProfileId: aishaProfile.id,
      balance: BigInt(150_000_00), // Rp 150.000 dalam sen
      currency: 'IDR',
    },
  });

  // Catat top-up awal di ledger
  await prisma.accountLedger.create({
    data: {
      accountId: aishaAccount.id,
      type: 'CREDIT',
      source: 'TOP_UP_FROM_PARENT',
      amount: BigInt(150_000_00),
      balanceAfter: BigInt(150_000_00),
      triggeredBy: parentUser.id,
      notes: 'Top-up awal dari Ayah',
    },
  });

  // Pocket Aisha
  await prisma.pocket.create({
    data: {
      accountId: aishaAccount.id,
      name: 'Uang Jajan',
      category: 'JAJAN',
      emoji: '🍜',
      balance: BigInt(50_000_00), // Rp 50.000
    },
  });

  await prisma.pocket.create({
    data: {
      accountId: aishaAccount.id,
      name: 'Tabungan Haji',
      category: 'HAJI',
      emoji: '🕌',
      balance: BigInt(75_000_00),
      targetAmount: BigInt(500_000_00),
      intentionText: 'Ya Allah, semoga aku bisa berhaji sendiri saat besar nanti. Aamiin.',
      deadline: new Date('2030-12-31'),
    },
  });

  await prisma.pocket.create({
    data: {
      accountId: aishaAccount.id,
      name: 'Qurban Idul Adha',
      category: 'QURBAN',
      emoji: '🐑',
      balance: BigInt(25_000_00),
      targetAmount: BigInt(300_000_00),
      intentionText: 'Ingin berqurban sendiri atas nama keluarga.',
      deadline: new Date('2027-06-01'),
    },
  });

  // Spending limit Aisha
  await prisma.spendingLimit.create({
    data: {
      childProfileId: aishaProfile.id,
      setByParentId: parentProfile.id,
      period: 'DAILY',
      limitAmount: BigInt(30_000_00), // Rp 30.000/hari
      excludeInfaq: true,
    },
  });

  await prisma.spendingLimit.create({
    data: {
      childProfileId: aishaProfile.id,
      setByParentId: parentProfile.id,
      period: 'WEEKLY',
      limitAmount: BigInt(150_000_00), // Rp 150.000/minggu
      excludeInfaq: true,
    },
  });

  // Family link Aisha
  await prisma.familyLink.create({
    data: { parentProfileId: parentProfile.id, childProfileId: aishaProfile.id },
  });

  console.log(`✅ Anak 1: ${aishaProfile.fullName} (PIN: 123456)`);

  // =============================================
  // 3. ANAK 2 — Rizky Maulana (9 tahun)
  // =============================================
  const pin2Hash = await bcrypt.hash('654321', SALT_ROUNDS);

  const rizkyUser = await prisma.user.create({
    data: {
      email: `child-${uuidv4()}@byond.internal`,
      passwordHash: pin2Hash,
      role: 'CHILD',
    },
  });

  const rizkyProfile = await prisma.childProfile.create({
    data: {
      userId: rizkyUser.id,
      fullName: 'Rizky Maulana',
      dateOfBirth: new Date('2016-03-10'),
      username: 'rizky_byond',
      pinHash: pin2Hash,
      deviceId: 'demo-device-rizky-001',
      createdByParentId: parentProfile.id,
      childAccountNumber: '7111222333',
    },
  });

  const rizkyAccount = await prisma.childAccount.create({
    data: {
      childProfileId: rizkyProfile.id,
      balance: BigInt(80_000_00), // Rp 80.000
      currency: 'IDR',
    },
  });

  await prisma.accountLedger.create({
    data: {
      accountId: rizkyAccount.id,
      type: 'CREDIT',
      source: 'TOP_UP_FROM_PARENT',
      amount: BigInt(80_000_00),
      balanceAfter: BigInt(80_000_00),
      triggeredBy: parentUser.id,
      notes: 'Top-up awal dari Ayah',
    },
  });

  await prisma.pocket.create({
    data: {
      accountId: rizkyAccount.id,
      name: 'Uang Jajan',
      category: 'JAJAN',
      emoji: '🍔',
      balance: BigInt(30_000_00),
    },
  });

  await prisma.pocket.create({
    data: {
      accountId: rizkyAccount.id,
      name: 'Sepeda Impian',
      category: 'CUSTOM',
      emoji: '🚲',
      balance: BigInt(50_000_00),
      targetAmount: BigInt(500_000_00),
      intentionText: 'Mau beli sepeda buat berangkat ngaji sama teman-teman.',
      deadline: new Date('2027-01-01'),
    },
  });

  await prisma.spendingLimit.create({
    data: {
      childProfileId: rizkyProfile.id,
      setByParentId: parentProfile.id,
      period: 'DAILY',
      limitAmount: BigInt(20_000_00),
      excludeInfaq: true,
    },
  });

  // Limit khusus gaming Rizky: max Rp 10.000/hari untuk top-up game
  await prisma.spendingLimit.create({
    data: {
      childProfileId: rizkyProfile.id,
      setByParentId: parentProfile.id,
      period: 'DAILY',
      limitAmount: BigInt(10_000_00),
      voucherType: 'GAME_TOPUP',
      excludeInfaq: true,
    },
  });

  await prisma.familyLink.create({
    data: { parentProfileId: parentProfile.id, childProfileId: rizkyProfile.id },
  });

  console.log(`✅ Anak 2: ${rizkyProfile.fullName} (PIN: 654321)`);

  // =============================================
  // 4. CHORES — Demo-ready
  // =============================================

  await prisma.chore.create({
    data: {
      createdById: parentProfile.id,
      assignedToId: aishaProfile.id,
      title: 'Hafal Surah Al-Mulk',
      description: 'Hafalkan Surah Al-Mulk (30 ayat) dan demonstrasikan kepada Ayah.',
      category: 'Hafalan Qur\'an',
      rewardAmount: BigInt(50_000_00), // Rp 50.000
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 hari lagi
      status: 'ACTIVE',
    },
  });

  await prisma.chore.create({
    data: {
      createdById: parentProfile.id,
      assignedToId: aishaProfile.id,
      title: 'Rapikan kamar selama seminggu',
      description: 'Rapikan tempat tidur dan meja belajar setiap hari selama 7 hari.',
      category: 'Pekerjaan Rumah',
      rewardAmount: BigInt(20_000_00),
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
    },
  });

  // Chore yang sudah PENDING_REVIEW — untuk demo alur approval
  const pendingChore = await prisma.chore.create({
    data: {
      createdById: parentProfile.id,
      assignedToId: aishaProfile.id,
      title: 'Nilai Matematika ≥ 85',
      description: 'Capai nilai ulangan Matematika minimal 85.',
      category: 'Akademik',
      rewardAmount: BigInt(30_000_00),
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'PENDING_REVIEW',
    },
  });

  await prisma.choreSubmission.create({
    data: {
      choreId: pendingChore.id,
      mediaUrl: 'https://picsum.photos/400/300', // placeholder image
      notes: 'Ini foto nilai ulangan saya Ayah! Dapat 90 🎉',
      attempt: 1,
    },
  });

  console.log(`✅ Chores: 3 chore dibuat (1 siap di-review)`);

  // =============================================
  // 5. VOUCHER CATALOG
  // =============================================

  await prisma.voucherCatalog.createMany({
    data: [
      {
        name: 'Voucher Shopee Rp 10.000',
        provider: 'Shopee',
        category: 'Belanja Online',
        voucherType: 'DISCOUNT',
        price: BigInt(10_000_00),
        faceValue: BigInt(10_000_00),
        stock: 100,
        maxPerChild: 3,
        description: 'Voucher potongan harga Shopee senilai Rp 10.000',
        mockCode: generateMockCode('SHOPEE-BYOND'),
        isActive: true,
      },
      {
        name: 'Voucher Shopee Rp 25.000',
        provider: 'Shopee',
        category: 'Belanja Online',
        voucherType: 'DISCOUNT',
        price: BigInt(25_000_00),
        faceValue: BigInt(25_000_00),
        stock: 50,
        maxPerChild: 2,
        description: 'Voucher potongan harga Shopee senilai Rp 25.000',
        mockCode: generateMockCode('SHOPEE-BYOND'),
        isActive: true,
      },
      {
        name: 'Top-up Diamond Mobile Legends 50',
        provider: 'Mobile Legends',
        category: 'Gaming',
        voucherType: 'GAME_TOPUP',
        price: BigInt(15_000_00),
        faceValue: BigInt(15_000_00),
        stock: 200,
        maxPerChild: 5,
        description: '50 Diamond Mobile Legends Bang Bang. Kode dikirim ke akun MLBB kamu.',
        mockCode: generateMockCode('MLBB-BYOND'),
        isActive: true,
      },
      {
        name: 'Top-up Diamond Mobile Legends 150',
        provider: 'Mobile Legends',
        category: 'Gaming',
        voucherType: 'GAME_TOPUP',
        price: BigInt(40_000_00),
        faceValue: BigInt(40_000_00),
        stock: 100,
        maxPerChild: 3,
        description: '150 Diamond Mobile Legends Bang Bang. Kode dikirim ke akun MLBB kamu.',
        mockCode: generateMockCode('MLBB-BYOND'),
        isActive: true,
      },
      {
        name: 'Top-up Free Fire 70 Diamond',
        provider: 'Garena Free Fire',
        category: 'Gaming',
        voucherType: 'GAME_TOPUP',
        price: BigInt(12_000_00),
        faceValue: BigInt(12_000_00),
        stock: 200,
        maxPerChild: 5,
        description: '70 Diamond Garena Free Fire. Kode dikirim ke akun FF kamu.',
        mockCode: generateMockCode('FF-BYOND'),
        isActive: true,
      },
      {
        name: 'Top-up GoPay Rp 20.000',
        provider: 'GoPay',
        category: 'E-Wallet',
        voucherType: 'E_WALLET',
        price: BigInt(20_000_00),
        faceValue: BigInt(20_000_00),
        stock: 50,
        maxPerChild: 2,
        description: 'Top-up GoPay senilai Rp 20.000',
        mockCode: generateMockCode('GOPAY-BYOND'),
        isActive: true,
      },
      {
        name: 'Langganan Ruangguru 1 Bulan',
        provider: 'Ruangguru',
        category: 'Edukasi',
        voucherType: 'EDUCATION',
        price: BigInt(45_000_00),
        faceValue: BigInt(99_000_00),
        stock: 30,
        maxPerChild: 1,
        description: 'Akses penuh Ruangguru selama 1 bulan — belajar lebih asyik!',
        mockCode: generateMockCode('RG-BYOND'),
        isActive: true,
      },
    ],
  });

  console.log(`✅ Voucher catalog: 7 voucher ditambahkan (Shopee, MLBB, FF, GoPay, Ruangguru)`);

  // =============================================
  // Summary
  // =============================================
  console.log(`
╔══════════════════════════════════════════════╗
║          SEED SELESAI — Data Demo            ║
╠══════════════════════════════════════════════╣
║                                              ║
║  🔐 SUPER ADMIN                              ║
║     Email   : admin@byond.id                 ║
║     Password: Admin@Byond2026!               ║
║                                              ║
║  👨 ORANG TUA — Budi Santoso                 ║
║     Email      : budi.santoso@demo.byond.id  ║
║     Password   : Byond@2026                  ║
║     savingsPin : 123456                      ║
║     BSI Rek    : 7123456789                  ║
║     Saldo      : Rp 10.000.000               ║
║                                              ║
║  👧 ANAK 1 — Aisha Ramadhani                 ║
║     Username: aisha_byond                    ║
║     Password: 123456                         ║
║     PIN     : 123456                         ║
║     Saldo   : Rp 150.000                     ║
║                                              ║
║  👦 ANAK 2 — Rizky Maulana                   ║
║     Username: rizky_byond                    ║
║     Password: 654321                         ║
║     PIN     : 654321                         ║
║     Saldo   : Rp 80.000                      ║
║                                              ║
╚══════════════════════════════════════════════╝
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
