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
import { calculateCommission } from "@/lib/commission";
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

type PosOrderLine = {
  itemId: string;
  quantity: number;
  isComplimentary: boolean;
  offerId?: string | null;
  complimentaryReason?: string | null;
};

type PosPaymentLine = {
  mode: PaymentMode;
  amount: number;
  reference?: string | null;
};

type PosOrderPayload = {
  tableNumber?: string | null;
  customerName?: string | null;
  staffId: string;
  discount: number;
  tip: number;
  items: PosOrderLine[];
  payments: PosPaymentLine[];
};

function parsePosOrderPayload(formData: FormData): PosOrderPayload {
  const raw = formString(formData, "orderJson");
  const parsed = JSON.parse(raw) as PosOrderPayload;
  return parsed;
}

async function nextBillNumber() {
  const count = await prisma.order.count();
  return `BILL-${String(count + 1).padStart(6, "0")}`;
}

export async function createPosOrder(formData: FormData) {
  const payload = parsePosOrderPayload(formData);
  const discountCents = toCents(payload.discount);
  const tipCents = toCents(payload.tip);
  const billNumber = await nextBillNumber();

  const order = await prisma.$transaction(async (tx) => {
    const staff = await tx.staff.findUniqueOrThrow({
      where: { id: payload.staffId },
    });
    const itemIds = payload.items.map((line) => line.itemId);
    const items = await tx.item.findMany({
      where: { id: { in: itemIds }, active: true },
    });
    const itemById = new Map(items.map((item) => [item.id, item]));

    const paidLines = payload.items.filter((line) => !line.isComplimentary);
    const subtotalCents = paidLines.reduce((total, line) => {
      const item = itemById.get(line.itemId);
      if (!item) {
        throw new Error("Invalid item in bill");
      }
      return total + Math.round(item.sellingPriceCents * line.quantity);
    }, 0);
    const cappedDiscountCents = Math.min(discountCents, subtotalCents);
    const discountRatio =
      subtotalCents > 0 ? cappedDiscountCents / subtotalCents : 0;

    let inventoryCostCents = 0;
    let complimentaryValueCents = 0;
    let eligibleSalesCents = 0;
    let specialDrinkSalesCents = 0;
    let taxCents = 0;

    const orderItems = payload.items.map((line) => {
      const item = itemById.get(line.itemId);
      if (!item) {
        throw new Error("Invalid item in bill");
      }
      const amountCents = line.isComplimentary
        ? 0
        : Math.round(item.sellingPriceCents * line.quantity);
      const discountedAmountCents = Math.round(amountCents * (1 - discountRatio));
      const totalCostCents = Math.round(item.purchaseCostCents * line.quantity);

      inventoryCostCents += totalCostCents;
      taxCents += Math.round((discountedAmountCents * item.taxPercent) / 100);

      if (line.isComplimentary) {
        complimentaryValueCents += Math.round(
          item.sellingPriceCents * line.quantity,
        );
      }

      if (!line.isComplimentary && item.commissionEligible) {
        eligibleSalesCents += discountedAmountCents;
        if (item.specialCommissionEligible) {
          specialDrinkSalesCents += discountedAmountCents;
        }
      }

      return {
        itemId: line.itemId,
        offerId: line.offerId ?? null,
        quantity: line.quantity,
        rateCents: line.isComplimentary ? 0 : item.sellingPriceCents,
        amountCents,
        purchaseCostCents: item.purchaseCostCents,
        totalCostCents,
        isComplimentary: line.isComplimentary,
        complimentaryReason: line.complimentaryReason ?? null,
        commissionEligible: !line.isComplimentary && item.commissionEligible,
        specialCommissionEligible:
          !line.isComplimentary && item.specialCommissionEligible,
      };
    });

    const commission = calculateCommission({
      eligibleSalesCents,
      specialDrinkSalesCents,
      normalCommissionPercent: staff.normalCommissionPercent,
      specialCommissionPercent: staff.specialCommissionPercent,
    });

    const netSalesCents = subtotalCents - cappedDiscountCents + taxCents;
    const paymentAmountCents = payload.payments.reduce(
      (total, payment) => total + toCents(payment.amount),
      0,
    );

    if (paymentAmountCents !== netSalesCents + tipCents) {
      throw new Error("Payment amount must match net sales plus tip");
    }

    const createdOrder = await tx.order.create({
      data: {
        billNumber,
        tableNumber: payload.tableNumber ?? null,
        customerName: payload.customerName ?? null,
        staffId: payload.staffId,
        status: "PAID",
        subtotalCents,
        discountCents: cappedDiscountCents,
        taxCents,
        netSalesCents,
        tipCents,
        totalCollectedCents: netSalesCents + tipCents,
        complimentaryValueCents,
        inventoryCostCents,
        normalCommissionSalesCents: commission.normalEligibleSalesCents,
        specialCommissionSalesCents: commission.specialDrinkSalesCents,
        normalCommissionCents: commission.normalCommissionCents,
        specialCommissionCents: commission.specialCommissionCents,
        totalCommissionCents: commission.totalCommissionCents,
        paidAt: new Date(),
        items: { create: orderItems },
        payments: {
          create: payload.payments.map((payment) => ({
            mode: payment.mode,
            amountCents: toCents(payment.amount),
            reference: payment.reference ?? null,
          })),
        },
        tips:
          tipCents > 0
            ? {
                create: {
                  staffId: payload.staffId,
                  amountCents: tipCents,
                  paymentMode: payload.payments[0]?.mode ?? PaymentMode.CASH,
                },
              }
            : undefined,
      },
    });

    for (const line of payload.items) {
      const item = itemById.get(line.itemId);
      if (!item) {
        throw new Error("Invalid inventory line");
      }
      const totalCostCents = Math.round(item.purchaseCostCents * line.quantity);
      await tx.item.update({
        where: { id: item.id },
        data: { stockQuantity: { decrement: line.quantity } },
      });
      await tx.inventoryTransaction.create({
        data: {
          itemId: item.id,
          orderId: createdOrder.id,
          type: line.isComplimentary ? "COMPLIMENTARY" : "SALE",
          quantityChange: -line.quantity,
          unitCostCents: item.purchaseCostCents,
          totalCostCents,
          notes: line.isComplimentary ? "Complimentary offer item" : "POS sale",
        },
      });
    }

    return createdOrder;
  });

  if (discountCents > 0) {
    await audit(AuditAction.DISCOUNT_APPLIED, "Order", order.id);
  }
  if (payload.items.some((line) => line.isComplimentary)) {
    await audit(AuditAction.COMPLIMENTARY_ADDED, "Order", order.id);
  }

  revalidatePath("/pos");
  revalidatePath("/reports");
  revalidatePath(`/invoices/customer/${order.id}`);
}
