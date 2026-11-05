-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('CUSTOMERS_VIEW', 'CUSTOMERS_EDIT', 'LOYALTY_MANAGE', 'RESOURCES_VIEW', 'RESOURCES_MANAGE', 'ORDERS_VIEW', 'ORDERS_CREATE', 'ORDERS_MANAGE', 'INVOICES_MANAGE', 'INVENTORY_VIEW', 'INVENTORY_MANAGE', 'PRICELIST_MANAGE', 'EMPLOYEES_VIEW', 'EMPLOYEES_MANAGE', 'RANKS_MANAGE', 'TIMES_VIEW_ALL', 'TIMES_MANAGE', 'COMPANY_MANAGE', 'AUDIT_VIEW');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "CompanyStatusMode" AS ENUM ('AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('REPAIR', 'TUNING', 'PAINT', 'TOWING', 'OTHER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('OPEN', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK');

-- CreateEnum
CREATE TYPE "StockMovementReason" AS ENUM ('PURCHASE', 'ORDER_USAGE', 'CORRECTION', 'LOSS');

-- CreateEnum
CREATE TYPE "ThemePreference" AS ENUM ('SYSTEM', 'LIGHT', 'DARK');

-- CreateEnum
CREATE TYPE "LoyaltyMode" AS ENUM ('STAMPS', 'POINTS');

-- CreateEnum
CREATE TYPE "LoyaltyTxType" AS ENUM ('EARN', 'REDEEM', 'REVERSAL', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('PERCENT_DISCOUNT', 'FIXED_DISCOUNT', 'FREE_SERVICE');

-- CreateEnum
CREATE TYPE "ResourceCategory" AS ENUM ('RAW', 'INTERMEDIATE', 'FINAL');

-- CreateEnum
CREATE TYPE "LogoVariant" AS ENUM ('LOS_SANTOS', 'VICE_CITY', 'EMBLEM');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "username" TEXT,
    "displayUsername" TEXT,
    "role" TEXT DEFAULT 'user',
    "banned" BOOLEAN DEFAULT false,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "impersonatedBy" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL DEFAULT 'Benny''s',
    "logoVariant" "LogoVariant" NOT NULL DEFAULT 'VICE_CITY',
    "phone" TEXT,
    "radioChannel" TEXT,
    "radioPassword" TEXT,
    "statusMode" "CompanyStatusMode" NOT NULL DEFAULT 'AUTO',
    "manualOpen" BOOLEAN NOT NULL DEFAULT false,
    "minOnDuty" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rank" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#A1A1AA',
    "hourlyWage" INTEGER NOT NULL DEFAULT 0,
    "permissions" "Permission"[],
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceNumber" INTEGER NOT NULL,
    "phone" TEXT,
    "rankId" TEXT NOT NULL,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "hiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terminatedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preference" (
    "userId" TEXT NOT NULL,
    "theme" "ThemePreference" NOT NULL DEFAULT 'SYSTEM',
    "reducedMotion" BOOLEAN NOT NULL DEFAULT false,
    "dashboardMusic" BOOLEAN NOT NULL DEFAULT false,
    "musicVolume" INTEGER NOT NULL DEFAULT 35,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preference_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "time_entry" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "clockIn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clockOut" TIMESTAMP(3),
    "note" TEXT,
    "editedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "notes" TEXT,
    "loyaltyBalance" INTEGER NOT NULL DEFAULT 0,
    "lastVisitAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle" (
    "id" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "color" TEXT,
    "customerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "type" "OrderType" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'OPEN',
    "customerId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "loyaltyRewardId" TEXT,
    "loyaltyDiscount" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "priceListItemId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" INTEGER NOT NULL,

    CONSTRAINT "order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'OPEN',
    "paymentMethod" "PaymentMethod",
    "issuedById" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "price_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_list_item" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "partId" TEXT,
    "partQuantity" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_list_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'Stk',
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minStock" INTEGER NOT NULL DEFAULT 0,
    "purchasePrice" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "part_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movement" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" "StockMovementReason" NOT NULL,
    "orderId" TEXT,
    "employeeId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "mode" "LoyaltyMode" NOT NULL DEFAULT 'STAMPS',
    "stampsPerVisit" INTEGER NOT NULL DEFAULT 1,
    "dollarsPerPoint" INTEGER NOT NULL DEFAULT 100,
    "minVisitTotal" INTEGER NOT NULL DEFAULT 500,
    "cooldownHours" INTEGER NOT NULL DEFAULT 12,
    "cardSize" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_reward" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cost" INTEGER NOT NULL,
    "type" "RewardType" NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "priceListItemId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_reward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_transaction" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "LoyaltyTxType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "orderId" TEXT,
    "invoiceId" TEXT,
    "rewardId" TEXT,
    "employeeId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ResourceCategory" NOT NULL,
    "weightGrams" INTEGER NOT NULL,
    "exportPrice" INTEGER NOT NULL,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "rank_name_key" ON "rank"("name");

-- CreateIndex
CREATE UNIQUE INDEX "rank_level_key" ON "rank"("level");

-- CreateIndex
CREATE UNIQUE INDEX "employee_userId_key" ON "employee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_serviceNumber_key" ON "employee"("serviceNumber");

-- CreateIndex
CREATE INDEX "employee_rankId_idx" ON "employee"("rankId");

-- CreateIndex
CREATE INDEX "employee_status_idx" ON "employee"("status");

-- CreateIndex
CREATE INDEX "time_entry_employeeId_clockIn_idx" ON "time_entry"("employeeId", "clockIn");

-- CreateIndex
CREATE INDEX "time_entry_clockOut_idx" ON "time_entry"("clockOut");

-- CreateIndex
CREATE INDEX "time_entry_editedById_idx" ON "time_entry"("editedById");

-- CreateIndex
CREATE UNIQUE INDEX "customer_number_key" ON "customer"("number");

-- CreateIndex
CREATE INDEX "customer_name_idx" ON "customer"("name");

-- CreateIndex
CREATE INDEX "customer_phone_idx" ON "customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_plate_key" ON "vehicle"("plate");

-- CreateIndex
CREATE INDEX "vehicle_customerId_idx" ON "vehicle"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "work_order_number_key" ON "work_order"("number");

-- CreateIndex
CREATE INDEX "work_order_status_createdAt_idx" ON "work_order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "work_order_customerId_idx" ON "work_order"("customerId");

-- CreateIndex
CREATE INDEX "work_order_vehicleId_idx" ON "work_order"("vehicleId");

-- CreateIndex
CREATE INDEX "work_order_createdById_idx" ON "work_order"("createdById");

-- CreateIndex
CREATE INDEX "work_order_assignedToId_idx" ON "work_order"("assignedToId");

-- CreateIndex
CREATE INDEX "work_order_loyaltyRewardId_idx" ON "work_order"("loyaltyRewardId");

-- CreateIndex
CREATE INDEX "order_item_orderId_idx" ON "order_item"("orderId");

-- CreateIndex
CREATE INDEX "order_item_priceListItemId_idx" ON "order_item"("priceListItemId");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_number_key" ON "invoice"("number");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_orderId_key" ON "invoice"("orderId");

-- CreateIndex
CREATE INDEX "invoice_status_issuedAt_idx" ON "invoice"("status", "issuedAt");

-- CreateIndex
CREATE INDEX "invoice_issuedById_idx" ON "invoice"("issuedById");

-- CreateIndex
CREATE UNIQUE INDEX "price_category_name_key" ON "price_category"("name");

-- CreateIndex
CREATE INDEX "price_list_item_partId_idx" ON "price_list_item"("partId");

-- CreateIndex
CREATE UNIQUE INDEX "price_list_item_categoryId_name_key" ON "price_list_item"("categoryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "part_name_key" ON "part"("name");

-- CreateIndex
CREATE UNIQUE INDEX "part_sku_key" ON "part"("sku");

-- CreateIndex
CREATE INDEX "stock_movement_partId_createdAt_idx" ON "stock_movement"("partId", "createdAt");

-- CreateIndex
CREATE INDEX "stock_movement_orderId_idx" ON "stock_movement"("orderId");

-- CreateIndex
CREATE INDEX "stock_movement_employeeId_idx" ON "stock_movement"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_reward_name_key" ON "loyalty_reward"("name");

-- CreateIndex
CREATE INDEX "loyalty_reward_priceListItemId_idx" ON "loyalty_reward"("priceListItemId");

-- CreateIndex
CREATE INDEX "loyalty_transaction_customerId_createdAt_idx" ON "loyalty_transaction"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "loyalty_transaction_orderId_idx" ON "loyalty_transaction"("orderId");

-- CreateIndex
CREATE INDEX "loyalty_transaction_invoiceId_idx" ON "loyalty_transaction"("invoiceId");

-- CreateIndex
CREATE INDEX "loyalty_transaction_rewardId_idx" ON "loyalty_transaction"("rewardId");

-- CreateIndex
CREATE INDEX "loyalty_transaction_employeeId_idx" ON "loyalty_transaction"("employeeId");

-- CreateIndex
CREATE INDEX "resource_category_idx" ON "resource"("category");

-- CreateIndex
CREATE INDEX "resource_createdById_idx" ON "resource"("createdById");

-- CreateIndex
CREATE INDEX "audit_log_entity_entityId_idx" ON "audit_log"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_log_actorId_idx" ON "audit_log"("actorId");

-- CreateIndex
CREATE INDEX "audit_log_createdAt_idx" ON "audit_log"("createdAt");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "rank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preference" ADD CONSTRAINT "user_preference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entry" ADD CONSTRAINT "time_entry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entry" ADD CONSTRAINT "time_entry_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order" ADD CONSTRAINT "work_order_loyaltyRewardId_fkey" FOREIGN KEY ("loyaltyRewardId") REFERENCES "loyalty_reward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "work_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_priceListItemId_fkey" FOREIGN KEY ("priceListItemId") REFERENCES "price_list_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "work_order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_list_item" ADD CONSTRAINT "price_list_item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "price_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_list_item" ADD CONSTRAINT "price_list_item_partId_fkey" FOREIGN KEY ("partId") REFERENCES "part"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_partId_fkey" FOREIGN KEY ("partId") REFERENCES "part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "work_order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_reward" ADD CONSTRAINT "loyalty_reward_priceListItemId_fkey" FOREIGN KEY ("priceListItemId") REFERENCES "price_list_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transaction" ADD CONSTRAINT "loyalty_transaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transaction" ADD CONSTRAINT "loyalty_transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "work_order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transaction" ADD CONSTRAINT "loyalty_transaction_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transaction" ADD CONSTRAINT "loyalty_transaction_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "loyalty_reward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transaction" ADD CONSTRAINT "loyalty_transaction_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource" ADD CONSTRAINT "resource_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Zusätzliches SQL aus Spec 7.4 ─────────────────────────────────────────

-- Höchstens ein offener Stempel pro Mitarbeiter
CREATE UNIQUE INDEX time_entry_one_open_per_employee
  ON time_entry ("employeeId") WHERE "clockOut" IS NULL;

-- Plausibilität
ALTER TABLE time_entry ADD CONSTRAINT time_entry_out_after_in
  CHECK ("clockOut" IS NULL OR "clockOut" > "clockIn");
ALTER TABLE part ADD CONSTRAINT part_stock_non_negative CHECK (stock >= 0);
ALTER TABLE work_order ADD CONSTRAINT work_order_discount_range
  CHECK ("discountPercent" BETWEEN 0 AND 100);
ALTER TABLE order_item ADD CONSTRAINT order_item_qty_positive CHECK (quantity > 0);
ALTER TABLE company_settings ADD CONSTRAINT company_settings_singleton CHECK (id = 1);

-- Treuesystem
ALTER TABLE customer ADD CONSTRAINT customer_loyalty_non_negative CHECK ("loyaltyBalance" >= 0);
ALTER TABLE loyalty_settings ADD CONSTRAINT loyalty_settings_singleton CHECK (id = 1);
ALTER TABLE loyalty_settings ADD CONSTRAINT loyalty_settings_positive
  CHECK ("stampsPerVisit" > 0 AND "dollarsPerPoint" > 0 AND "cardSize" BETWEEN 4 AND 20
         AND "minVisitTotal" >= 0 AND "cooldownHours" >= 0);
ALTER TABLE loyalty_reward ADD CONSTRAINT loyalty_reward_cost_positive CHECK (cost > 0);
ALTER TABLE loyalty_reward ADD CONSTRAINT loyalty_reward_value_range
  CHECK (type <> 'PERCENT_DISCOUNT' OR value BETWEEN 1 AND 100);
ALTER TABLE work_order ADD CONSTRAINT work_order_loyalty_discount_non_negative
  CHECK ("loyaltyDiscount" >= 0);
-- Höchstens eine Besuchs-Gutschrift pro Rechnung
CREATE UNIQUE INDEX loyalty_tx_one_earn_per_invoice
  ON loyalty_transaction ("invoiceId") WHERE type = 'EARN';

-- Ressourcen
CREATE UNIQUE INDEX resource_name_ci_unique ON resource (lower(name));
ALTER TABLE resource ADD CONSTRAINT resource_weight_range
  CHECK ("weightGrams" BETWEEN 0 AND 10000000);      -- 0 bis 10.000 kg
ALTER TABLE resource ADD CONSTRAINT resource_price_range
  CHECK ("exportPrice" BETWEEN 0 AND 10000000);

-- Ränge und Einstellungen
ALTER TABLE rank ADD CONSTRAINT rank_level_range CHECK (level BETWEEN 1 AND 100);
ALTER TABLE user_preference ADD CONSTRAINT user_preference_volume_range
  CHECK ("musicVolume" BETWEEN 0 AND 100);
