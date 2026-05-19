"use server";

import { AuditAction, PaymentMode, StaffRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

import {
  formBoolean,
  formNumber,
  formOptionalString,
  formString,
} from "@/lib/form";
import { toCents } from "@/lib/money";
import { prisma } from "@/lib/db";

async function audit(action: AuditAction, entityType: string, entityId?: string) {
  await prisma.auditLog.create({
    data: {
      action,
      entityType,
      entityId,
      newValue: "Admin settings updated from BarPOS web app",
    },
  });
}

export async function createCategory(formData: FormData) {
  const category = await prisma.category.create({
    data: {
      name: formString(formData, "name"),
      type: formString(formData, "type"),
      commissionEligible: formBoolean(formData, "commissionEligible"),
      complimentaryEligible: formBoolean(formData, "complimentaryEligible"),
      active: formBoolean(formData, "active"),
    },
  });
  await audit(AuditAction.SETTINGS_UPDATED, "Category", category.id);
  revalidatePath("/admin/products");
}

export async function createItem(formData: FormData) {
  const item = await prisma.item.create({
    data: {
      name: formString(formData, "name"),
      sku: formOptionalString(formData, "sku"),
      categoryId: formString(formData, "categoryId"),
      sellingPriceCents: toCents(formNumber(formData, "sellingPrice")),
      purchaseCostCents: toCents(formNumber(formData, "purchaseCost")),
      stockQuantity: formNumber(formData, "stockQuantity"),
      unitType: formString(formData, "unitType") || "pcs",
      taxPercent: formNumber(formData, "taxPercent"),
      commissionEligible: formBoolean(formData, "commissionEligible"),
      specialCommissionEligible: formBoolean(
        formData,
        "specialCommissionEligible",
      ),
      complimentaryEligible: formBoolean(formData, "complimentaryEligible"),
      active: formBoolean(formData, "active"),
    },
  });
  await audit(AuditAction.SETTINGS_UPDATED, "Item", item.id);
  revalidatePath("/admin/products");
}

export async function createOffer(formData: FormData) {
  const offer = await prisma.offer.create({
    data: {
      name: formString(formData, "name"),
      buyItemId: formOptionalString(formData, "buyItemId"),
      buyCategoryId: formOptionalString(formData, "buyCategoryId"),
      buyQuantity: formNumber(formData, "buyQuantity", 1),
      freeCategoryId: formOptionalString(formData, "freeCategoryId"),
      freeQuantity: formNumber(formData, "freeQuantity", 1),
      startDate: formOptionalString(formData, "startDate")
        ? new Date(formString(formData, "startDate"))
        : null,
      endDate: formOptionalString(formData, "endDate")
        ? new Date(formString(formData, "endDate"))
        : null,
      active: formBoolean(formData, "active"),
      managerApprovalRequired: formBoolean(
        formData,
        "managerApprovalRequired",
      ),
      waiterCanChooseFreeItem: formBoolean(formData, "waiterCanChooseFreeItem"),
    },
  });

  const eligibleFreeItemIds = formData
    .getAll("eligibleFreeItemIds")
    .filter((value): value is string => typeof value === "string");

  if (eligibleFreeItemIds.length > 0) {
    await prisma.offerEligibleItem.createMany({
      data: eligibleFreeItemIds.map((itemId) => ({
        offerId: offer.id,
        itemId,
      })),
    });
  }

  await audit(AuditAction.OFFER_CREATED, "Offer", offer.id);
  revalidatePath("/admin/offers");
}

export async function createStaff(formData: FormData) {
  const staff = await prisma.staff.create({
    data: {
      name: formString(formData, "name"),
      role: formString(formData, "role") as StaffRole,
      phone: formOptionalString(formData, "phone"),
      fixedSalaryCents: toCents(formNumber(formData, "fixedSalary")),
      normalCommissionPercent: formNumber(formData, "normalCommissionPercent"),
      specialCommissionPercent: formNumber(
        formData,
        "specialCommissionPercent",
      ),
      active: formBoolean(formData, "active"),
    },
  });
  await audit(AuditAction.SETTINGS_UPDATED, "Staff", staff.id);
  revalidatePath("/admin/staff");
}

export async function createCommissionRule(formData: FormData) {
  const rule = await prisma.staffCommissionRule.create({
    data: {
      name: formString(formData, "name"),
      staffId: formOptionalString(formData, "staffId"),
      normalCommissionPercent: formNumber(formData, "normalCommissionPercent"),
      specialCommissionPercent: formNumber(
        formData,
        "specialCommissionPercent",
      ),
      active: formBoolean(formData, "active"),
    },
  });

  const categoryIds = formData
    .getAll("categoryIds")
    .filter((value): value is string => typeof value === "string");
  const itemIds = formData
    .getAll("itemIds")
    .filter((value): value is string => typeof value === "string");

  if (categoryIds.length > 0) {
    await prisma.staffCommissionRuleCategory.createMany({
      data: categoryIds.map((categoryId) => ({ ruleId: rule.id, categoryId })),
    });
  }

  if (itemIds.length > 0) {
    await prisma.staffCommissionRuleItem.createMany({
      data: itemIds.map((itemId) => ({ ruleId: rule.id, itemId })),
    });
  }

  await audit(AuditAction.COMMISSION_CHANGED, "StaffCommissionRule", rule.id);
  revalidatePath("/admin/commission");
}

export async function createExpenseCategory(formData: FormData) {
  const category = await prisma.expenseCategory.create({
    data: {
      name: formString(formData, "name"),
      active: formBoolean(formData, "active"),
    },
  });
  await audit(AuditAction.SETTINGS_UPDATED, "ExpenseCategory", category.id);
  revalidatePath("/admin/settings");
}

export async function updateInvoiceSettings(formData: FormData) {
  const id = formOptionalString(formData, "id");
  const data = {
    restaurantName: formString(formData, "restaurantName"),
    address: formString(formData, "address"),
    phone: formString(formData, "phone"),
    gstNumber: formOptionalString(formData, "gstNumber"),
    thankYouMessage: formString(formData, "thankYouMessage"),
  };

  const setting = id
    ? await prisma.invoiceSetting.update({ where: { id }, data })
    : await prisma.invoiceSetting.create({ data });

  await audit(AuditAction.SETTINGS_UPDATED, "InvoiceSetting", setting.id);
  revalidatePath("/admin/settings");
}

export async function updatePrinterSettings(formData: FormData) {
  const id = formOptionalString(formData, "id");
  const data = {
    invoicePrinter: formOptionalString(formData, "invoicePrinter"),
    receiptPrinter: formOptionalString(formData, "receiptPrinter"),
    paperSize: formString(formData, "paperSize") || "80mm",
  };

  const setting = id
    ? await prisma.printerSetting.update({ where: { id }, data })
    : await prisma.printerSetting.create({ data });

  await audit(AuditAction.SETTINGS_UPDATED, "PrinterSetting", setting.id);
  revalidatePath("/admin/settings");
}

export async function createExpense(formData: FormData) {
  const expense = await prisma.expense.create({
    data: {
      categoryId: formString(formData, "categoryId"),
      amountCents: toCents(formNumber(formData, "amount")),
      paymentMode: formString(formData, "paymentMode") as PaymentMode,
      paidTo: formString(formData, "paidTo"),
      notes: formOptionalString(formData, "notes"),
      attachmentUrl: formOptionalString(formData, "attachmentUrl"),
      expenseDate: new Date(formString(formData, "expenseDate")),
    },
  });

  await audit(AuditAction.EXPENSE_CREATED, "Expense", expense.id);
  revalidatePath("/expenses");
  revalidatePath("/reports");
}
