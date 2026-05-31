"use server";

import { hash } from "bcryptjs";

import {
  AuditAction,
  BusinessDayStatus,
  LedgerEntryType,
  OrderStatus,
  PaymentMode,
  StaffRole,
  TableStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  formBoolean,
  formNumber,
  formOptionalString,
  formString,
} from "@/lib/form";
import { toCents } from "@/lib/money";
import { calculateCommission } from "@/lib/commission";
import { prisma } from "@/lib/db";
import { hasPermission, requirePermission, signIn, signOut } from "@/lib/auth";
import { businessDateStart, getOrOpenBusinessDay, nextTableNumber } from "@/lib/tables";

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

async function getDayPasscode() {
  const setting = await prisma.dayPasscodeSetting.findFirst({
    orderBy: { createdAt: "asc" },
  });

  return setting?.passcode || "1599";
}

async function requireDayPasscode(formData: FormData) {
  const passcode = formString(formData, "dayPasscode");
  const expectedPasscode = await getDayPasscode();

  if (passcode !== expectedPasscode) {
    redirect("/?dayPasscode=invalid");
  }
}

export async function loginAction(formData: FormData) {
  const ok = await signIn(
    formString(formData, "username"),
    formString(formData, "password"),
  );

  if (!ok) {
    redirect("/login?error=invalid");
  }

  redirect("/");
}

export async function logoutAction() {
  await signOut();
  redirect("/login");
}

export async function createTable(formData: FormData) {
  const user = await requirePermission("pos.create");
  const businessDay = await getOrOpenBusinessDay();
  const requestedNumber = formNumber(formData, "tableNumber");
  const tableNumber =
    requestedNumber > 0 ? Math.trunc(requestedNumber) : await nextTableNumber(businessDay.id);
  const tableName = formOptionalString(formData, "tableName") || `Table ${tableNumber}`;
  const table = await prisma.barTable.create({
    data: {
      businessDayId: businessDay.id,
      tableNumber,
      tableName,
      customerName: formOptionalString(formData, "customerName"),
      guestCount: formNumber(formData, "guestCount") || null,
      staffId: formString(formData, "staffId"),
      openedByUserId: user.id,
      status: TableStatus.OPEN,
    },
  });
  revalidatePath("/");
  revalidatePath("/tables");
  redirect(`/pos?tableId=${table.id}`);
}

export async function openBusinessDay(formData: FormData) {
  await requirePermission("pos.create");
  await requireDayPasscode(formData);
  const businessDate = businessDateStart();
  await prisma.businessDay.upsert({
    where: { businessDate },
    update: { status: BusinessDayStatus.OPEN, closedAt: null },
    create: { businessDate, status: BusinessDayStatus.OPEN },
  });
  revalidatePath("/");
  revalidatePath("/tables");
}

export async function closeBusinessDay(formData: FormData) {
  const user = await requirePermission("pos.create");
  await requireDayPasscode(formData);
  const businessDay = await prisma.businessDay.findUnique({
    where: { businessDate: businessDateStart() },
  });
  if (!businessDay) {
    return;
  }
  await prisma.$transaction(async (tx) => {
    await tx.barTable.updateMany({
      where: { businessDayId: businessDay.id, status: TableStatus.OPEN },
      data: {
        status: TableStatus.VOID,
        closedAt: new Date(),
        closedByUserId: user.id,
      }
    });
    await tx.businessDay.update({
      where: { id: businessDay.id },
      data: {
        status: BusinessDayStatus.CLOSED,
        closedAt: new Date(),
      }
    });
  });
  revalidatePath("/");
  revalidatePath("/tables");
}

export async function createCategory(formData: FormData) {
  await requirePermission("products.manage");
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
  await requirePermission("products.manage");
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

export async function createInventoryPurchase(formData: FormData) {
  await requirePermission("products.manage");
  const itemId = formString(formData, "itemId");
  const quantity = formNumber(formData, "quantity");
  const unitCostCents = toCents(formNumber(formData, "unitCost"));
  const totalCostCents = Math.round(unitCostCents * quantity);
  const notes = formOptionalString(formData, "notes") ?? "Inventory added";

  await prisma.$transaction(async (tx) => {
    await tx.item.update({
      where: { id: itemId },
      data: { stockQuantity: { increment: quantity } },
    });
    await tx.inventoryTransaction.create({
      data: {
        itemId,
        type: "PURCHASE",
        quantityChange: quantity,
        unitCostCents,
        totalCostCents,
        notes,
      },
    });
  });

  await audit(AuditAction.SETTINGS_UPDATED, "InventoryTransaction", itemId);
  revalidatePath("/admin/products");
  revalidatePath("/reports");
}

export async function createOffer(formData: FormData) {
  await requirePermission("offers.manage");
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
  await requirePermission("staff.manage");
  const staff = await prisma.staff.create({
    data: {
      name: formString(formData, "name"),
      role: formString(formData, "role") as StaffRole,
      phone: formOptionalString(formData, "phone"),
      fixedSalaryCents: toCents(formNumber(formData, "fixedSalary")),
      normalCommissionPercent: formNumber(formData, "normalCommissionPercent"),
      specialCommissionPercent: 50,
      active: formBoolean(formData, "active"),
    },
  });
  await audit(AuditAction.SETTINGS_UPDATED, "Staff", staff.id);
  revalidatePath("/admin/staff");
  revalidatePath("/admin/settings");
  revalidatePath("/reports");
}

export async function updateStaffCommission(formData: FormData) {
  await requirePermission("staff.manage");
  const staffId = formString(formData, "staffId");
  const staff = await prisma.staff.update({
    where: { id: staffId },
    data: {
      normalCommissionPercent: formNumber(formData, "normalCommissionPercent"),
      specialCommissionPercent: 50,
    },
  });
  await audit(AuditAction.COMMISSION_CHANGED, "Staff", staff.id);
  revalidatePath("/admin/staff");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/commission");
  revalidatePath("/reports");
  revalidatePath(`/reports/staff/${staff.id}`);
}

export async function updateUserPassword(formData: FormData) {
  await requirePermission("settings.manage");
  const userId = formString(formData, "userId");
  const password = formString(formData, "password");
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hash(password, 12) },
  });
  await audit(AuditAction.SETTINGS_UPDATED, "User", userId);
  revalidatePath("/admin/settings");
}

export async function createCommissionRule(formData: FormData) {
  await requirePermission("commission.manage");
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
  await requirePermission("settings.manage");
  const category = await prisma.expenseCategory.create({
    data: {
      name: formString(formData, "name"),
      active: formBoolean(formData, "active"),
    },
  });
  await audit(AuditAction.SETTINGS_UPDATED, "ExpenseCategory", category.id);
  revalidatePath("/admin/settings");
}

export async function createPaymentMethod(formData: FormData) {
  await requirePermission("settings.manage");
  const name = formString(formData, "name");
  const method = await prisma.paymentMethod.create({
    data: {
      name,
      code: name.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, ""),
      mode: formString(formData, "mode") as PaymentMode,
      sortOrder: formNumber(formData, "sortOrder"),
      active: formBoolean(formData, "active"),
    },
  });
  await audit(AuditAction.SETTINGS_UPDATED, "PaymentMethod", method.id);
  revalidatePath("/admin/settings");
}

export async function updateInvoiceSettings(formData: FormData) {
  await requirePermission("settings.manage");
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
  await requirePermission("settings.manage");
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

export async function updateDayPasscode(formData: FormData) {
  await requirePermission("settings.manage");
  const id = formOptionalString(formData, "id");
  const passcode = formString(formData, "passcode");

  if (passcode.length < 4) {
    redirect("/admin/settings?dayPasscode=invalid");
  }

  const setting = id
    ? await prisma.dayPasscodeSetting.update({ where: { id }, data: { passcode } })
    : await prisma.dayPasscodeSetting.create({ data: { passcode } });

  await audit(AuditAction.SETTINGS_UPDATED, "DayPasscodeSetting", setting.id);
  revalidatePath("/admin/settings");
  revalidatePath("/");
}

export async function createExpense(formData: FormData) {
  await requirePermission("expenses.manage");
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
  revalidatePath("/admin/settings");
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
  paymentMethodId?: string | null;
  amount: number;
  reference?: string | null;
};

type PosOrderPayload = {
  action?: "SAVE" | "SETTLE" | "PENDING";
  tableId?: string | null;
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

function nextBillNumber() {
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BILL-${stamp}-${suffix}`;
}

export async function createPosOrder(formData: FormData) {
  const user = await requirePermission("pos.create");
  const payload = parsePosOrderPayload(formData);
  const action = payload.action ?? "SETTLE";
  if (payload.tableId) {
    const selectedTable = await prisma.barTable.findUnique({
      where: { id: payload.tableId },
      select: { status: true },
    });
    if (!selectedTable || selectedTable.status !== TableStatus.OPEN) {
      redirect("/tables");
    }
  }
  if (!hasPermission(user, "pos.discount") && Number(payload.discount) > 0) {
    throw new Error("Discount permission required");
  }
  const discountCents = toCents(payload.discount);
  const tipCents = toCents(payload.tip);

  const order = await prisma.$transaction(async (tx) => {
    let table: {
      id: string;
      businessDayId: string;
      tableName: string;
      customerName: string | null;
      staffId: string;
      status: TableStatus;
    } | null = null;
    let businessDayId: string | null = null;
    let tableNumber = payload.tableNumber ?? null;
    let customerName = payload.customerName ?? null;
    let draftOrder: { id: string; status: OrderStatus; billNumber: string } | null = null;

    if (payload.tableId) {
      table = await tx.barTable.findUnique({
        where: { id: payload.tableId },
        select: {
          id: true,
          businessDayId: true,
          tableName: true,
          customerName: true,
          staffId: true,
          status: true,
        },
      });
      if (!table || table.status !== TableStatus.OPEN) {
        throw new Error("Selected table is not open");
      }
      businessDayId = table.businessDayId;
      tableNumber = table.tableName;
      customerName = table.customerName;
      draftOrder = await tx.order.findFirst({
        where: {
          tableId: table.id,
          status: { in: [OrderStatus.DRAFT, OrderStatus.PENDING] },
        },
        select: { id: true, status: true, billNumber: true },
        orderBy: { createdAt: "desc" },
      });
    }

    const staff = await tx.staff.findUniqueOrThrow({
      where: { id: table?.staffId ?? payload.staffId },
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
    });

    const netSalesCents = subtotalCents - cappedDiscountCents + taxCents;
    const paymentAmountCents = payload.payments.reduce(
      (total, payment) => total + toCents(payment.amount),
      0,
    );
    const isSettlement = action === "SETTLE";
    const isPending = action === "PENDING";

    if (isSettlement && paymentAmountCents !== netSalesCents + tipCents) {
      throw new Error("Payment amount must match net sales plus tip");
    }
    if (!isSettlement && paymentAmountCents > 0) {
      throw new Error("Save-to-table cannot include payment");
    }
    if (!isSettlement && tipCents > 0) {
      throw new Error("Tips are collected during settlement");
    }

    const paymentMethodIds = payload.payments
      .map((payment) => payment.paymentMethodId)
      .filter((id): id is string => Boolean(id));
    const paymentMethods =
      paymentMethodIds.length > 0
        ? await tx.paymentMethod.findMany({
            where: { id: { in: paymentMethodIds }, active: true },
          })
        : [];
    const methodById = new Map(paymentMethods.map((method) => [method.id, method]));
    const paymentsToCreate = isSettlement
      ? payload.payments.map((payment) => {
          const method = payment.paymentMethodId
            ? methodById.get(payment.paymentMethodId)
            : null;
          return {
            mode: method?.mode ?? payment.mode,
            paymentMethodId: method?.id ?? null,
            amountCents: toCents(payment.amount),
            reference: payment.reference ?? method?.name ?? null,
          };
        })
      : [];

    const orderStatus = isSettlement
      ? OrderStatus.PAID
      : isPending
        ? OrderStatus.PENDING
        : OrderStatus.DRAFT;
    const paidAt = isSettlement ? new Date() : null;
    const orderData = {
      businessDayId,
      tableId: table?.id ?? null,
      tableNumber,
      customerName,
      staffId: table?.staffId ?? payload.staffId,
      cashierId: user.id,
      status: orderStatus,
      subtotalCents,
      discountCents: cappedDiscountCents,
      taxCents,
      netSalesCents,
      tipCents: isSettlement ? tipCents : 0,
      totalCollectedCents: isSettlement ? netSalesCents + tipCents : 0,
      complimentaryValueCents,
      inventoryCostCents,
      normalCommissionSalesCents: commission.normalEligibleSalesCents,
      specialCommissionSalesCents: commission.specialDrinkSalesCents,
      normalCommissionCents: commission.normalCommissionCents,
      specialCommissionCents: commission.specialCommissionCents,
      totalCommissionCents: commission.totalCommissionCents,
      paidAt,
    };

    const createdOrder = draftOrder
      ? await tx.order.update({
          where: { id: draftOrder.id },
          data: {
            ...orderData,
            items: { deleteMany: {}, create: orderItems },
            payments: { deleteMany: {}, create: paymentsToCreate },
            tips: {
              deleteMany: {},
              ...(isSettlement && tipCents > 0
                ? {
                    create: {
                      staffId: table?.staffId ?? payload.staffId,
                      amountCents: tipCents,
                      paymentMode: paymentsToCreate[0]?.mode ?? PaymentMode.CASH,
                    },
                  }
                : {}),
            },
          },
        })
      : await tx.order.create({
          data: {
            billNumber: nextBillNumber(),
            ...orderData,
            items: { create: orderItems },
            payments: { create: paymentsToCreate },
            tips:
              isSettlement && tipCents > 0
                ? {
                    create: {
                      staffId: table?.staffId ?? payload.staffId,
                      amountCents: tipCents,
                      paymentMode: paymentsToCreate[0]?.mode ?? PaymentMode.CASH,
                    },
                  }
                : undefined,
          },
        });

    if (draftOrder && (isSettlement || isPending)) {
      await tx.inventoryTransaction.deleteMany({ where: { orderId: createdOrder.id } });
    }

    if (table && (isSettlement || isPending)) {
      await tx.barTable.update({
        where: { id: table.id },
        data: {
          status: TableStatus.SETTLED,
          settledAt: new Date(),
          closedAt: new Date(),
          closedByUserId: user.id,
        },
      });
    }

    if (isSettlement || isPending) {
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
  revalidatePath("/");
  revalidatePath("/tables");
  revalidatePath("/reports");
  revalidatePath(`/invoices/customer/${order.id}`);
  if (action === "SETTLE" || action === "PENDING") {
    redirect(`/invoices/customer/${order.id}`);
  }
  redirect("/tables");
}

export async function settlePendingOrder(formData: FormData) {
  const user = await requirePermission("pos.create");
  const orderId = formString(formData, "orderId");
  const paymentMethodId = formString(formData, "paymentMethodId");
  const amountCents = toCents(formNumber(formData, "amount"));

  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { payments: true },
  });
  if (order.status !== OrderStatus.PENDING) {
    throw new Error("Only pending bills can be collected");
  }
  const dueCents = order.netSalesCents + order.tipCents;
  if (amountCents !== dueCents) {
    throw new Error("Payment amount must match pending bill amount");
  }

  const method = await prisma.paymentMethod.findUniqueOrThrow({
    where: { id: paymentMethodId },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      cashierId: user.id,
      status: OrderStatus.PAID,
      paidAt: new Date(),
      totalCollectedCents: amountCents,
      payments: {
        deleteMany: {},
        create: {
          mode: method.mode,
          paymentMethodId: method.id,
          amountCents,
          reference: method.name,
        },
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/tables");
  revalidatePath("/invoices/customer");
  redirect(`/invoices/customer/${order.id}`);
}

async function getStaffLedgerBalance(staffId: string) {
  const lastEntry = await prisma.staffLedgerEntry.findFirst({
    where: { staffId },
    orderBy: { createdAt: "desc" },
  });
  return lastEntry?.balanceCents ?? 0;
}

export async function createStaffAdvance(formData: FormData) {
  await requirePermission("settlements.manage");
  const staffId = formString(formData, "staffId");
  const amountCents = toCents(formNumber(formData, "amount"));
  const previousBalanceCents = await getStaffLedgerBalance(staffId);

  const advance = await prisma.staffAdvance.create({
    data: {
      staffId,
      amountCents,
      paymentMode: formString(formData, "paymentMode") as PaymentMode,
      reason: formOptionalString(formData, "reason"),
      givenBy: formString(formData, "givenBy"),
      ledgerEntries: {
        create: {
          staffId,
          type: LedgerEntryType.ADVANCE_GIVEN,
          debitCents: amountCents,
          balanceCents: previousBalanceCents - amountCents,
          description: "Advance given to staff",
        },
      },
    },
  });

  await audit(AuditAction.ADVANCE_GIVEN, "StaffAdvance", advance.id);
  revalidatePath("/settlements");
  revalidatePath("/reports");
}

export async function createStaffSettlement(formData: FormData) {
  await requirePermission("settlements.manage");
  const staffId = formString(formData, "staffId");
  const startDate = new Date(formString(formData, "startDate"));
  const endDate = new Date(formString(formData, "endDate"));
  endDate.setHours(23, 59, 59, 999);
  const advanceDeductedCents = toCents(formNumber(formData, "advanceDeducted"));
  const amountPaidCents = toCents(formNumber(formData, "amountPaid"));
  const previousPendingCents = await getStaffLedgerBalance(staffId);

  const [staff, orders, openAdvances] = await Promise.all([
    prisma.staff.findUniqueOrThrow({ where: { id: staffId } }),
    prisma.order.findMany({
      where: {
        staffId,
        status: "PAID",
        paidAt: { gte: startDate, lte: endDate },
      },
    }),
    prisma.staffAdvance.findMany({
      where: { staffId, deductionStatus: { not: "DEDUCTED" } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const normalSalesCents = orders.reduce(
    (total, order) => total + order.normalCommissionSalesCents,
    0,
  );
  const specialDrinkSalesCents = orders.reduce(
    (total, order) => total + order.specialCommissionSalesCents,
    0,
  );
  const normalCommissionCents = orders.reduce(
    (total, order) => total + order.normalCommissionCents,
    0,
  );
  const specialCommissionCents = orders.reduce(
    (total, order) => total + order.specialCommissionCents,
    0,
  );
  const totalCommissionCents = normalCommissionCents + specialCommissionCents;
  const tipsCents = orders.reduce((total, order) => total + order.tipCents, 0);
  const advanceBalanceCents = openAdvances.reduce(
    (total, advance) => total + advance.amountCents - advance.deductedCents,
    0,
  );
  const cappedAdvanceDeductionCents = Math.min(
    advanceDeductedCents,
    advanceBalanceCents,
  );
  const totalPayableCents =
    previousPendingCents +
    totalCommissionCents +
    tipsCents -
    cappedAdvanceDeductionCents;
  const remainingPendingCents = totalPayableCents - amountPaidCents;
  const receiptNumber = `SET-${Date.now()}`;

  const settlement = await prisma.$transaction(async (tx) => {
    const createdSettlement = await tx.staffSettlement.create({
      data: {
        receiptNumber,
        staffId,
        startDate,
        endDate,
        normalSalesCents,
        specialDrinkSalesCents,
        normalCommissionPercent: staff.normalCommissionPercent,
        specialCommissionPercent: 50,
        normalCommissionCents,
        specialCommissionCents,
        totalCommissionCents,
        tipsCents,
        previousPendingCents,
        advanceBalanceCents,
        advanceDeductedCents: cappedAdvanceDeductionCents,
        totalPayableCents,
        amountPaidCents,
        remainingPendingCents,
        paymentMode: formString(formData, "paymentMode") as PaymentMode,
        notes: formOptionalString(formData, "notes"),
        paidBy: formString(formData, "paidBy"),
        status: remainingPendingCents > 0 ? "PARTIAL" : "PAID",
      },
    });

    let runningBalance = previousPendingCents;
    const ledgerEntries = [
      {
        type: LedgerEntryType.COMMISSION_EARNED,
        creditCents: totalCommissionCents,
        debitCents: 0,
        description: "Commission earned for settlement period",
      },
      {
        type: LedgerEntryType.TIPS_EARNED,
        creditCents: tipsCents,
        debitCents: 0,
        description: "Tips earned for settlement period",
      },
      {
        type: LedgerEntryType.ADVANCE_DEDUCTED,
        creditCents: 0,
        debitCents: cappedAdvanceDeductionCents,
        description: "Advance deducted during settlement",
      },
      {
        type: LedgerEntryType.AMOUNT_PAID,
        creditCents: 0,
        debitCents: amountPaidCents,
        description: "Settlement amount paid",
      },
    ];

    for (const entry of ledgerEntries) {
      runningBalance += entry.creditCents - entry.debitCents;
      await tx.staffLedgerEntry.create({
        data: {
          staffId,
          settlementId: createdSettlement.id,
          type: entry.type,
          creditCents: entry.creditCents,
          debitCents: entry.debitCents,
          balanceCents: runningBalance,
          description: entry.description,
        },
      });
    }

    let remainingDeduction = cappedAdvanceDeductionCents;
    for (const advance of openAdvances) {
      if (remainingDeduction <= 0) {
        break;
      }
      const balance = advance.amountCents - advance.deductedCents;
      const deduction = Math.min(balance, remainingDeduction);
      const newDeducted = advance.deductedCents + deduction;
      await tx.staffSettlementAdvance.create({
        data: {
          settlementId: createdSettlement.id,
          advanceId: advance.id,
          amountCents: deduction,
        },
      });
      await tx.staffAdvance.update({
        where: { id: advance.id },
        data: {
          deductedCents: newDeducted,
          deductionStatus:
            newDeducted >= advance.amountCents ? "DEDUCTED" : "PARTIAL",
        },
      });
      remainingDeduction -= deduction;
    }

    return createdSettlement;
  });

  await audit(AuditAction.COMMISSION_PAID, "StaffSettlement", settlement.id);
  revalidatePath("/settlements");
  revalidatePath("/reports");
  revalidatePath(`/invoices/settlement/${settlement.id}`);
}
