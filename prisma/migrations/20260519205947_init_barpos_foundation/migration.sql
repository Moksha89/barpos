-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "roleId" TEXT NOT NULL,
    "staffId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "User_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "commissionEligible" BOOLEAN NOT NULL DEFAULT false,
    "complimentaryEligible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "categoryId" TEXT NOT NULL,
    "sellingPriceCents" INTEGER NOT NULL,
    "purchaseCostCents" INTEGER NOT NULL,
    "stockQuantity" REAL NOT NULL DEFAULT 0,
    "unitType" TEXT NOT NULL DEFAULT 'pcs',
    "taxPercent" REAL NOT NULL DEFAULT 0,
    "commissionEligible" BOOLEAN NOT NULL DEFAULT false,
    "specialCommissionEligible" BOOLEAN NOT NULL DEFAULT false,
    "complimentaryEligible" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "fixedSalaryCents" INTEGER NOT NULL DEFAULT 0,
    "normalCommissionPercent" REAL NOT NULL DEFAULT 0,
    "specialCommissionPercent" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StaffCommissionRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "staffId" TEXT,
    "normalCommissionPercent" REAL NOT NULL,
    "specialCommissionPercent" REAL NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StaffCommissionRule_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StaffCommissionRuleCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ruleId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    CONSTRAINT "StaffCommissionRuleCategory_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "StaffCommissionRule" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StaffCommissionRuleCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StaffCommissionRuleItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ruleId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    CONSTRAINT "StaffCommissionRuleItem_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "StaffCommissionRule" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StaffCommissionRuleItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "buyItemId" TEXT,
    "buyCategoryId" TEXT,
    "buyQuantity" INTEGER NOT NULL DEFAULT 1,
    "freeCategoryId" TEXT,
    "freeQuantity" INTEGER NOT NULL DEFAULT 1,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "managerApprovalRequired" BOOLEAN NOT NULL DEFAULT false,
    "waiterCanChooseFreeItem" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Offer_buyItemId_fkey" FOREIGN KEY ("buyItemId") REFERENCES "Item" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Offer_buyCategoryId_fkey" FOREIGN KEY ("buyCategoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Offer_freeCategoryId_fkey" FOREIGN KEY ("freeCategoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OfferEligibleItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "offerId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    CONSTRAINT "OfferEligibleItem_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OfferEligibleItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "billNumber" TEXT NOT NULL,
    "tableNumber" TEXT,
    "customerName" TEXT,
    "staffId" TEXT NOT NULL,
    "cashierId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "subtotalCents" INTEGER NOT NULL DEFAULT 0,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "taxCents" INTEGER NOT NULL DEFAULT 0,
    "netSalesCents" INTEGER NOT NULL DEFAULT 0,
    "tipCents" INTEGER NOT NULL DEFAULT 0,
    "totalCollectedCents" INTEGER NOT NULL DEFAULT 0,
    "complimentaryValueCents" INTEGER NOT NULL DEFAULT 0,
    "inventoryCostCents" INTEGER NOT NULL DEFAULT 0,
    "normalCommissionSalesCents" INTEGER NOT NULL DEFAULT 0,
    "specialCommissionSalesCents" INTEGER NOT NULL DEFAULT 0,
    "normalCommissionCents" INTEGER NOT NULL DEFAULT 0,
    "specialCommissionCents" INTEGER NOT NULL DEFAULT 0,
    "totalCommissionCents" INTEGER NOT NULL DEFAULT 0,
    "paidAt" DATETIME,
    "voidReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "offerId" TEXT,
    "quantity" REAL NOT NULL,
    "rateCents" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "purchaseCostCents" INTEGER NOT NULL,
    "totalCostCents" INTEGER NOT NULL,
    "isComplimentary" BOOLEAN NOT NULL DEFAULT false,
    "complimentaryReason" TEXT,
    "commissionEligible" BOOLEAN NOT NULL DEFAULT false,
    "specialCommissionEligible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "reference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "paidStatus" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tip_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Tip_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StaffAdvance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staffId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "deductedCents" INTEGER NOT NULL DEFAULT 0,
    "paymentMode" TEXT NOT NULL,
    "reason" TEXT,
    "givenBy" TEXT NOT NULL,
    "deductionStatus" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StaffAdvance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StaffSettlement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receiptNumber" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "normalSalesCents" INTEGER NOT NULL,
    "specialDrinkSalesCents" INTEGER NOT NULL,
    "normalCommissionPercent" REAL NOT NULL,
    "specialCommissionPercent" REAL NOT NULL,
    "normalCommissionCents" INTEGER NOT NULL,
    "specialCommissionCents" INTEGER NOT NULL,
    "totalCommissionCents" INTEGER NOT NULL,
    "tipsCents" INTEGER NOT NULL,
    "previousPendingCents" INTEGER NOT NULL DEFAULT 0,
    "advanceBalanceCents" INTEGER NOT NULL DEFAULT 0,
    "advanceDeductedCents" INTEGER NOT NULL DEFAULT 0,
    "totalPayableCents" INTEGER NOT NULL,
    "amountPaidCents" INTEGER NOT NULL,
    "remainingPendingCents" INTEGER NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "notes" TEXT,
    "paidBy" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StaffSettlement_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StaffSettlementAdvance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "settlementId" TEXT NOT NULL,
    "advanceId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    CONSTRAINT "StaffSettlementAdvance_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "StaffSettlement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StaffSettlementAdvance_advanceId_fkey" FOREIGN KEY ("advanceId") REFERENCES "StaffAdvance" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StaffLedgerEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staffId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "creditCents" INTEGER NOT NULL DEFAULT 0,
    "debitCents" INTEGER NOT NULL DEFAULT 0,
    "balanceCents" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "settlementId" TEXT,
    "advanceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffLedgerEntry_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StaffLedgerEntry_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "StaffSettlement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StaffLedgerEntry_advanceId_fkey" FOREIGN KEY ("advanceId") REFERENCES "StaffAdvance" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "paidTo" TEXT NOT NULL,
    "notes" TEXT,
    "attachmentUrl" TEXT,
    "addedByUserId" TEXT,
    "expenseDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Expense_addedByUserId_fkey" FOREIGN KEY ("addedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "orderId" TEXT,
    "type" TEXT NOT NULL,
    "quantityChange" REAL NOT NULL,
    "unitCostCents" INTEGER NOT NULL,
    "totalCostCents" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryTransaction_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvoiceSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restaurantName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "gstNumber" TEXT,
    "thankYouMessage" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TaxSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "percent" REAL NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PrinterSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoicePrinter" TEXT,
    "receiptPrinter" TEXT,
    "paperSize" TEXT NOT NULL DEFAULT '80mm',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_staffId_key" ON "User"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Item_sku_key" ON "Item"("sku");

-- CreateIndex
CREATE INDEX "Item_categoryId_idx" ON "Item"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffCommissionRuleCategory_ruleId_categoryId_key" ON "StaffCommissionRuleCategory"("ruleId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffCommissionRuleItem_ruleId_itemId_key" ON "StaffCommissionRuleItem"("ruleId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "OfferEligibleItem_offerId_itemId_key" ON "OfferEligibleItem"("offerId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_billNumber_key" ON "Order"("billNumber");

-- CreateIndex
CREATE INDEX "Order_staffId_idx" ON "Order"("staffId");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StaffSettlement_receiptNumber_key" ON "StaffSettlement"("receiptNumber");

-- CreateIndex
CREATE INDEX "StaffLedgerEntry_staffId_createdAt_idx" ON "StaffLedgerEntry"("staffId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_name_key" ON "ExpenseCategory"("name");

-- CreateIndex
CREATE INDEX "Expense_expenseDate_idx" ON "Expense"("expenseDate");

-- CreateIndex
CREATE INDEX "InventoryTransaction_itemId_createdAt_idx" ON "InventoryTransaction"("itemId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");
