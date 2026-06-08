-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'PARENT', 'CHILD');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('SAVINGS', 'CHILD_SAVINGS');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "TransactionSource" AS ENUM ('TOP_UP_FROM_PARENT', 'CHORE_REWARD', 'POCKET_ALLOCATE', 'POCKET_DEALLOCATE', 'VOUCHER_PURCHASE', 'INFAQ', 'ADJUSTMENT', 'LEARNING_REWARD');

-- CreateEnum
CREATE TYPE "ParentTransactionSource" AS ENUM ('INITIAL_BALANCE', 'DEPOSIT', 'TRANSFER_TO_CHILD', 'CHORE_REWARD', 'ADJUSTMENT', 'LEARNING_REWARD');

-- CreateEnum
CREATE TYPE "LearningCategory" AS ENUM ('MENABUNG', 'BELANJA_BIJAK', 'INFAQ_SEDEKAH', 'KEUANGAN_DASAR', 'INVESTASI', 'LAINNYA');

-- CreateEnum
CREATE TYPE "LearningDifficulty" AS ENUM ('MUDAH', 'SEDANG', 'SULIT');

-- CreateEnum
CREATE TYPE "ChoreStatus" AS ENUM ('ACTIVE', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'REVISION_NEEDED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PocketCategory" AS ENUM ('JAJAN', 'HAJI', 'QURBAN', 'INFAQ', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SpendingLimitPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "InfaqInstitution" AS ENUM ('BSI_MASLAHAT', 'BAZNAS', 'LAZISNU', 'LAZISMU', 'OTHER');

-- CreateEnum
CREATE TYPE "VoucherType" AS ENUM ('DISCOUNT', 'GAME_TOPUP', 'E_WALLET', 'EDUCATION');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
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
    "pin_hash" TEXT NOT NULL DEFAULT '',
    "avatar_url" TEXT,
    "dummy_balance" BIGINT NOT NULL DEFAULT 1000000000,

    CONSTRAINT "parent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "username" TEXT,
    "pin_hash" TEXT NOT NULL,
    "device_id" TEXT,
    "avatar" TEXT,
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
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "reward_amount" BIGINT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "ChoreStatus" NOT NULL DEFAULT 'ACTIVE',
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
    "voucher_type" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spending_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infaq_institution_configs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "bank_info" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "infaq_institution_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "infaq_logs" (
    "id" TEXT NOT NULL,
    "child_profile_id" TEXT NOT NULL,
    "institution_config_id" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "infaq_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_catalog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "voucher_type" "VoucherType" NOT NULL DEFAULT 'DISCOUNT',
    "price" BIGINT NOT NULL,
    "face_value" BIGINT,
    "description" TEXT,
    "image_url" TEXT,
    "mock_code" TEXT NOT NULL,
    "stock" INTEGER,
    "max_per_child" INTEGER,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voucher_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_redemptions" (
    "id" TEXT NOT NULL,
    "child_profile_id" TEXT NOT NULL,
    "voucher_id" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "mock_code_issued" TEXT NOT NULL,
    "redeemed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_ledger" (
    "id" TEXT NOT NULL,
    "parent_profile_id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "source" "ParentTransactionSource" NOT NULL,
    "amount" BIGINT NOT NULL,
    "balance_after" BIGINT NOT NULL,
    "related_child_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_active_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_modules" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "LearningCategory" NOT NULL,
    "thumbnail" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_articles" (
    "id" TEXT NOT NULL,
    "module_id" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "image_url" TEXT,
    "category" "LearningCategory" NOT NULL,
    "difficulty" "LearningDifficulty" NOT NULL,
    "reading_time_min" INTEGER NOT NULL DEFAULT 5,
    "xp_reward" INTEGER NOT NULL DEFAULT 10,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "xp_bonus" INTEGER NOT NULL DEFAULT 20,
    "coin_reward" BIGINT NOT NULL DEFAULT 0,
    "pass_score" INTEGER NOT NULL DEFAULT 70,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "explanation" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_progresses" (
    "id" TEXT NOT NULL,
    "child_profile_id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "read_completed_at" TIMESTAMP(3),
    "quiz_score" INTEGER,
    "quiz_passed_at" TIMESTAMP(3),
    "xp_earned" INTEGER NOT NULL DEFAULT 0,
    "reward_paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_progresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_xp_balances" (
    "id" TEXT NOT NULL,
    "child_profile_id" TEXT NOT NULL,
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "child_xp_balances_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "parent_profiles_bsi_account_number_key" ON "parent_profiles"("bsi_account_number");

-- CreateIndex
CREATE UNIQUE INDEX "child_profiles_user_id_key" ON "child_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "child_profiles_username_key" ON "child_profiles"("username");

-- CreateIndex
CREATE UNIQUE INDEX "family_links_parent_profile_id_child_profile_id_key" ON "family_links"("parent_profile_id", "child_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "child_accounts_child_profile_id_key" ON "child_accounts"("child_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "spending_limits_child_profile_id_period_voucher_type_key" ON "spending_limits"("child_profile_id", "period", "voucher_type");

-- CreateIndex
CREATE UNIQUE INDEX "infaq_institution_configs_code_key" ON "infaq_institution_configs"("code");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "quizzes_article_id_key" ON "quizzes"("article_id");

-- CreateIndex
CREATE UNIQUE INDEX "learning_progresses_child_profile_id_article_id_key" ON "learning_progresses"("child_profile_id", "article_id");

-- CreateIndex
CREATE UNIQUE INDEX "child_xp_balances_child_profile_id_key" ON "child_xp_balances"("child_profile_id");

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
ALTER TABLE "chore_submissions" ADD CONSTRAINT "chore_submissions_chore_id_fkey" FOREIGN KEY ("chore_id") REFERENCES "chores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spending_limits" ADD CONSTRAINT "spending_limits_child_profile_id_fkey" FOREIGN KEY ("child_profile_id") REFERENCES "child_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spending_limits" ADD CONSTRAINT "spending_limits_set_by_parent_id_fkey" FOREIGN KEY ("set_by_parent_id") REFERENCES "parent_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infaq_logs" ADD CONSTRAINT "infaq_logs_child_profile_id_fkey" FOREIGN KEY ("child_profile_id") REFERENCES "child_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infaq_logs" ADD CONSTRAINT "infaq_logs_institution_config_id_fkey" FOREIGN KEY ("institution_config_id") REFERENCES "infaq_institution_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_redemptions" ADD CONSTRAINT "voucher_redemptions_child_profile_id_fkey" FOREIGN KEY ("child_profile_id") REFERENCES "child_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_redemptions" ADD CONSTRAINT "voucher_redemptions_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "voucher_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_ledger" ADD CONSTRAINT "parent_ledger_parent_profile_id_fkey" FOREIGN KEY ("parent_profile_id") REFERENCES "parent_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_ledger" ADD CONSTRAINT "parent_ledger_related_child_id_fkey" FOREIGN KEY ("related_child_id") REFERENCES "child_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_modules" ADD CONSTRAINT "learning_modules_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_articles" ADD CONSTRAINT "learning_articles_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "learning_modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_articles" ADD CONSTRAINT "learning_articles_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "learning_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_progresses" ADD CONSTRAINT "learning_progresses_child_profile_id_fkey" FOREIGN KEY ("child_profile_id") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_progresses" ADD CONSTRAINT "learning_progresses_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "learning_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_xp_balances" ADD CONSTRAINT "child_xp_balances_child_profile_id_fkey" FOREIGN KEY ("child_profile_id") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

