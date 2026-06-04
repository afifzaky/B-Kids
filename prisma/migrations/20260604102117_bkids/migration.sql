-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'PARENT', 'CHILD');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('SAVINGS', 'CHILD_SAVINGS');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "TransactionSource" AS ENUM ('TOP_UP_FROM_PARENT', 'CHORE_REWARD', 'POCKET_ALLOCATE', 'POCKET_DEALLOCATE', 'VOUCHER_PURCHASE', 'INFAQ', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ChoreStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'REVISION_NEEDED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PocketCategory" AS ENUM ('JAJAN', 'HAJI', 'QURBAN', 'INFAQ', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SpendingLimitPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "InfaqInstitution" AS ENUM ('BSI_MASLAHAT', 'BAZNAS', 'LAZISNU', 'LAZISMU', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "bsi_account_number" TEXT NOT NULL,
    "dummy_balance" BIGINT NOT NULL DEFAULT 5000000000,

    CONSTRAINT "parent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "pin_hash" TEXT NOT NULL,
    "device_id" TEXT,
    "created_by_parent_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "child_account_number" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "child_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_links" (
    "id" TEXT NOT NULL,
    "parent_profile_id" TEXT NOT NULL,
    "child_profile_id" TEXT NOT NULL,
    "linked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_accounts" (
    "id" TEXT NOT NULL,
    "child_profile_id" TEXT NOT NULL,
    "balance" BIGINT NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "child_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_ledger" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "source" "TransactionSource" NOT NULL,
    "amount" BIGINT NOT NULL,
    "balance_after" BIGINT NOT NULL,
    "reference_id" TEXT,
    "triggered_by" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pockets" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "PocketCategory" NOT NULL,
    "balance" BIGINT NOT NULL DEFAULT 0,
    "target_amount" BIGINT,
    "intention_text" TEXT,
    "emoji" TEXT DEFAULT '💰',
    "deadline" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_goal_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pockets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pocket_ledger" (
    "id" TEXT NOT NULL,
    "pocket_id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "source" "TransactionSource" NOT NULL,
    "amount" BIGINT NOT NULL,
    "balance_after" BIGINT NOT NULL,
    "reference_id" TEXT,
    "triggered_by" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pocket_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chores" (
    "id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "assigned_to_id" TEXT NOT NULL,
    "target_pocket_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "reward_amount" BIGINT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "ChoreStatus" NOT NULL DEFAULT 'DRAFT',
    "rejection_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chore_submissions" (
    "id" TEXT NOT NULL,
    "chore_id" TEXT NOT NULL,
    "media_url" TEXT,
    "notes" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewer_note" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "chore_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spending_limits" (
    "id" TEXT NOT NULL,
    "child_profile_id" TEXT NOT NULL,
    "set_by_parent_id" TEXT NOT NULL,
    "period" "SpendingLimitPeriod" NOT NULL,
    "limit_amount" BIGINT NOT NULL,
    "exclude_infaq" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spending_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infaq_logs" (
    "id" TEXT NOT NULL,
    "child_profile_id" TEXT NOT NULL,
    "institution" "InfaqInstitution" NOT NULL,
    "institution_name" TEXT,
    "amount" BIGINT NOT NULL,
    "source_pocket_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "infaq_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_catalog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" BIGINT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "mock_code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "voucher_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_redemptions" (
    "id" TEXT NOT NULL,
    "child_profile_id" TEXT NOT NULL,
    "voucher_id" TEXT NOT NULL,
    "source_pocket_id" TEXT,
    "amount" BIGINT NOT NULL,
    "mock_code_issued" TEXT NOT NULL,
    "redeemed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "parent_profiles_user_id_key" ON "parent_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "parent_profiles_nik_key" ON "parent_profiles"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "child_profiles_user_id_key" ON "child_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "family_links_parent_profile_id_child_profile_id_key" ON "family_links"("parent_profile_id", "child_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "child_accounts_child_profile_id_key" ON "child_accounts"("child_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "spending_limits_child_profile_id_period_key" ON "spending_limits"("child_profile_id", "period");

-- AddForeignKey
ALTER TABLE "parent_profiles" ADD CONSTRAINT "parent_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_profiles" ADD CONSTRAINT "child_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_links" ADD CONSTRAINT "family_links_parent_profile_id_fkey" FOREIGN KEY ("parent_profile_id") REFERENCES "parent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_links" ADD CONSTRAINT "family_links_child_profile_id_fkey" FOREIGN KEY ("child_profile_id") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_accounts" ADD CONSTRAINT "child_accounts_child_profile_id_fkey" FOREIGN KEY ("child_profile_id") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_ledger" ADD CONSTRAINT "account_ledger_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "child_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pockets" ADD CONSTRAINT "pockets_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "child_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pocket_ledger" ADD CONSTRAINT "pocket_ledger_pocket_id_fkey" FOREIGN KEY ("pocket_id") REFERENCES "pockets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chores" ADD CONSTRAINT "chores_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "parent_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chores" ADD CONSTRAINT "chores_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "child_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chores" ADD CONSTRAINT "chores_target_pocket_id_fkey" FOREIGN KEY ("target_pocket_id") REFERENCES "pockets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chore_submissions" ADD CONSTRAINT "chore_submissions_chore_id_fkey" FOREIGN KEY ("chore_id") REFERENCES "chores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spending_limits" ADD CONSTRAINT "spending_limits_child_profile_id_fkey" FOREIGN KEY ("child_profile_id") REFERENCES "child_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spending_limits" ADD CONSTRAINT "spending_limits_set_by_parent_id_fkey" FOREIGN KEY ("set_by_parent_id") REFERENCES "parent_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infaq_logs" ADD CONSTRAINT "infaq_logs_child_profile_id_fkey" FOREIGN KEY ("child_profile_id") REFERENCES "child_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_redemptions" ADD CONSTRAINT "voucher_redemptions_child_profile_id_fkey" FOREIGN KEY ("child_profile_id") REFERENCES "child_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_redemptions" ADD CONSTRAINT "voucher_redemptions_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "voucher_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
