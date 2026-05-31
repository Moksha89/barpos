import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { hash } from "bcryptjs";

import { toCents } from "../src/lib/money";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const permissions = [
  ["dashboard.view", "View dashboard"],
  ["pos.create", "Create bills"],
  ["tables.manage", "Manage active tables"],
  ["pos.discount", "Apply discounts"],
  ["pos.void", "Void bills"],
  ["offers.manage", "Manage offers"],
  ["products.manage", "Manage products and inventory"],
  ["staff.manage", "Manage staff"],
  ["commission.manage", "Manage commission rules"],
  ["expenses.manage", "Manage expenses"],
  ["settlements.manage", "Manage staff settlements"],
  ["reports.view", "View reports"],
  ["profit.view", "View profit and loss"],
  ["settings.manage", "Manage system settings"],
  ["audit.view", "View audit logs"],
] as const;

async function main() {
  for (const [key, label] of permissions) {
    await prisma.permission.upsert({
      where: { key },
      update: { label },
      create: { key, label },
    });
  }

  const allPermissions = await prisma.permission.findMany();
  const roleConfigs = [
    {
      name: "OWNER_ADMIN" as const,
      label: "Owner/Admin",
      permissionKeys: allPermissions.map((permission) => permission.key),
    },
    {
      name: "MANAGER" as const,
      label: "Manager",
      permissionKeys: [
        "dashboard.view",
        "pos.create",
        "pos.discount",
        "offers.manage",
        "expenses.manage",
        "settlements.manage",
        "reports.view",
      ],
    },
    {
      name: "CASHIER" as const,
      label: "Billman / Cashier",
      permissionKeys: ["dashboard.view", "pos.create", "tables.manage"],
    },
    {
      name: "WAITER_WAITRESS" as const,
      label: "Waiter/Waitress",
      permissionKeys: ["pos.create"],
    },
    {
      name: "ACCOUNTANT" as const,
      label: "Accountant",
      permissionKeys: [
        "dashboard.view",
        "expenses.manage",
        "settlements.manage",
        "reports.view",
        "profit.view",
      ],
    },
    {
      name: "KITCHEN_BAR" as const,
      label: "Kitchen/Bar Staff",
      permissionKeys: ["dashboard.view"],
    },
  ];

  for (const roleConfig of roleConfigs) {
    const role = await prisma.role.upsert({
      where: { name: roleConfig.name },
      update: { label: roleConfig.label },
      create: { name: roleConfig.name, label: roleConfig.label },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

    const rolePermissions = allPermissions.filter((permission) =>
      roleConfig.permissionKeys.includes(permission.key),
    );

    await prisma.rolePermission.createMany({
      data: rolePermissions.map((permission) => ({
        roleId: role.id,
        permissionId: permission.id,
      })),
    });
  }

  const categories = [
    {
      name: "Inventory",
      type: "alcohol",
      commissionEligible: true,
      complimentaryEligible: false,
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: category,
      create: category,
    });
  }

  await prisma.category.updateMany({
    where: { name: { notIn: categories.map((category) => category.name) } },
    data: { active: false },
  });

  const categoryByName = new Map(
    (await prisma.category.findMany()).map((category) => [category.name, category]),
  );

  const items = [
    { name: "budweiser(24beers)", sku: "INV-BUDWEISER-24BEERS", purchaseCost: 110 },
    { name: "corona(24beers)", sku: "INV-CORONA-24BEERS", purchaseCost: 140 },
    { name: "heniken(24beers)", sku: "INV-HENIKEN-24BEERS", purchaseCost: 110 },
    { name: "kf(12beers)", sku: "INV-KF-12BEERS", purchaseCost: 95 },
    { name: "ice beer(24beers)", sku: "INV-ICE-BEER-24BEERS", purchaseCost: 140 },
    { name: "breezer(24)", sku: "INV-BREEZER-24", purchaseCost: 180 },
    { name: "jd full", sku: "INV-JD-FULL", purchaseCost: 65 },
    { name: "black label full", sku: "INV-BLACK-LABEL-FULL", purchaseCost: 85 },
    { name: "red label full", sku: "INV-RED-LABEL-FULL", purchaseCost: 45 },
    { name: "chivas full", sku: "INV-CHIVAS-FULL", purchaseCost: 80 },
    { name: "BALLENTINES", sku: "INV-BALLENTINES", purchaseCost: 50 },
    { name: "blenders pride", sku: "INV-BLENDERS-PRIDE", purchaseCost: 18 },
    { name: "DOUBLE BLACK", sku: "INV-DOUBLE-BLACK", purchaseCost: 130 },
    { name: "GLENFIDICH", sku: "INV-GLENFIDICH", purchaseCost: 120 },
    { name: "THE GLENVLIET", sku: "INV-THE-GLENVLIET", purchaseCost: 132 },
    { name: "CHIVAS REGAL 18 YEARS", sku: "INV-CHIVAS-REGAL-18-YEARS", purchaseCost: 200 },
    { name: "gold label full", sku: "INV-GOLD-LABEL-FULL", purchaseCost: 156 },
    { name: "teachers", sku: "INV-TEACHERS", purchaseCost: 41 },
    { name: "jaggrmister", sku: "INV-JAGGRMISTER", purchaseCost: 55 },
    { name: "gordans", sku: "INV-GORDANS", purchaseCost: 50 },
    { name: "captain morgan dark", sku: "INV-CAPTAIN-MORGAN-DARK", purchaseCost: 85 },
    { name: "captain morgan gold", sku: "INV-CAPTAIN-MORGAN-GOLD", purchaseCost: 60 },
    { name: "black label half", sku: "INV-BLACK-LABEL-HALF", purchaseCost: 56 },
    { name: "red label half", sku: "INV-RED-LABEL-HALF", purchaseCost: 26 },
    { name: "jd half", sku: "INV-JD-HALF", purchaseCost: 38 },
    { name: "chivas half", sku: "INV-CHIVAS-HALF", purchaseCost: 50 },
    { name: "st remy vsop", sku: "INV-ST-REMY-VSOP", purchaseCost: 39 },
    { name: "hennessy vs", sku: "INV-HENNESSY-VS", purchaseCost: 179 },
    { name: "willam lawson", sku: "INV-WILLAM-LAWSON", purchaseCost: 44 },
    { name: "hennessy vsop", sku: "INV-HENNESSY-VSOP", purchaseCost: 0 },
    { name: "grey goose half", sku: "INV-GREY-GOOSE-HALF", purchaseCost: 0 },
    { name: "grey goose full", sku: "INV-GREY-GOOSE-FULL", purchaseCost: 0 },
    { name: "KAHLUA LIQ", sku: "INV-KAHLUA-LIQ", purchaseCost: 80 },
    { name: "OLD MONK", sku: "INV-OLD-MONK", purchaseCost: 10 },
    { name: "magic moments", sku: "INV-MAGIC-MOMENTS", purchaseCost: 20 },
    { name: "absolute full", sku: "INV-ABSOLUTE-FULL", purchaseCost: 39 },
    { name: "absolute half", sku: "INV-ABSOLUTE-HALF", purchaseCost: 0 },
    { name: "BOMBAY SAPHARI", sku: "INV-BOMBAY-SAPHARI", purchaseCost: 55 },
    { name: "JOSE CUERVO SILVER", sku: "INV-JOSE-CUERVO-SILVER", purchaseCost: 45 },
    { name: "baileys", sku: "INV-BAILEYS", purchaseCost: 78 },
    { name: "MEMIROVSKAYA", sku: "INV-MEMIROVSKAYA", purchaseCost: 35 },
    { name: "SILVER PATRON", sku: "INV-SILVER-PATRON", purchaseCost: 180 },
    { name: "JACOBS CREEK RED", sku: "INV-JACOBS-CREEK-RED", purchaseCost: 50 },
    { name: "WHITE WINE", sku: "INV-WHITE-WINE", purchaseCost: 50 },
    { name: "bacardi white", sku: "INV-BACARDI-WHITE", purchaseCost: 50 },
    { name: "bacardi black", sku: "INV-BACARDI-BLACK", purchaseCost: 60 },
    { name: "blue curacro", sku: "INV-BLUE-CURACRO", purchaseCost: 45 },
  ];

  await prisma.item.updateMany({
    where: { sku: { notIn: items.map((item) => item.sku) } },
    data: { active: false },
  });

  for (const item of items) {
    const category = categoryByName.get("Inventory");
    if (!category) {
      throw new Error("Missing category Inventory");
    }

    await prisma.item.upsert({
      where: { sku: item.sku },
      update: {
        name: item.name,
        categoryId: category.id,
        sellingPriceCents: 0,
        purchaseCostCents: toCents(item.purchaseCost),
        stockQuantity: 0,
        commissionEligible: true,
        specialCommissionEligible: false,
        complimentaryEligible: false,
        active: true,
      },
      create: {
        name: item.name,
        sku: item.sku,
        categoryId: category.id,
        sellingPriceCents: 0,
        purchaseCostCents: toCents(item.purchaseCost),
        stockQuantity: 0,
        commissionEligible: true,
        specialCommissionEligible: false,
        complimentaryEligible: false,
        active: true,
      },
    });
  }

  const staffConfigs = [
    {
      name: "Priya",
      role: "WAITRESS" as const,
      phone: "9000000001",
      fixedSalary: 2000,
      normalCommissionPercent: 25,
      specialCommissionPercent: 50,
    },
    {
      name: "Asha",
      role: "WAITRESS" as const,
      phone: "9000000002",
      fixedSalary: 0,
      normalCommissionPercent: 20,
      specialCommissionPercent: 50,
    },
    {
      name: "Rahul",
      role: "WAITER" as const,
      phone: "9000000003",
      fixedSalary: 1800,
      normalCommissionPercent: 10,
      specialCommissionPercent: 25,
    },
  ];

  for (const staffConfig of staffConfigs) {
    const existingStaff = await prisma.staff.findFirst({
      where: { name: staffConfig.name },
    });
    const staffData = {
      role: staffConfig.role,
      phone: staffConfig.phone,
      fixedSalaryCents: toCents(staffConfig.fixedSalary),
      normalCommissionPercent: staffConfig.normalCommissionPercent,
      specialCommissionPercent: staffConfig.specialCommissionPercent,
      active: true,
    };

    if (existingStaff) {
      await prisma.staff.update({
        where: { id: existingStaff.id },
        data: staffData,
      });
    } else {
      await prisma.staff.create({
        data: { name: staffConfig.name, ...staffData },
      });
    }
  }

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: "OWNER_ADMIN" },
  });
  await prisma.user.upsert({
    where: { email: "admin@barpos.local" },
    update: {
      name: "BarPOS Admin",
      roleId: adminRole.id,
      active: true,
      passwordHash: await hash("admin123", 12),
    },
    create: {
      name: "BarPOS Admin",
      email: "admin@barpos.local",
      passwordHash: await hash("admin123", 12),
      roleId: adminRole.id,
    },
  });

  const cashierRole = await prisma.role.findUniqueOrThrow({
    where: { name: "CASHIER" },
  });
  await prisma.user.upsert({
    where: { email: "billman@barpos.local" },
    update: {
      name: "Demo Billman",
      roleId: cashierRole.id,
      active: true,
      passwordHash: await hash("billman123", 12),
    },
    create: {
      name: "Demo Billman",
      email: "billman@barpos.local",
      passwordHash: await hash("billman123", 12),
      roleId: cashierRole.id,
    },
  });

  await prisma.offer.updateMany({ data: { active: false } });

  const expenseCategories = [
    "Staff food",
    "Cleaning",
    "Rent",
    "Electricity",
    "Maintenance",
    "Transport",
    "Purchase adjustment",
    "Miscellaneous",
    "Other",
  ];

  for (const name of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { name },
      update: { active: true },
      create: { name },
    });
  }

  const paymentMethods = [
    { name: "Cash Counter", code: "CASH_COUNTER", mode: "CASH" as const, sortOrder: 1 },
    { name: "Card Machine 1", code: "CARD_MACHINE_1", mode: "CARD" as const, sortOrder: 2 },
    { name: "Card Machine 2", code: "CARD_MACHINE_2", mode: "CARD" as const, sortOrder: 3 },
    { name: "Card Machine 3", code: "CARD_MACHINE_3", mode: "CARD" as const, sortOrder: 4 },
    { name: "UPI India", code: "UPI_INDIA", mode: "UPI" as const, sortOrder: 5 },
    { name: "Online Transfer", code: "ONLINE_TRANSFER", mode: "ONLINE" as const, sortOrder: 6 },
  ];
  for (const method of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { code: method.code },
      update: {
        name: method.name,
        mode: method.mode,
        active: true,
        sortOrder: method.sortOrder,
      },
      create: {
        ...method,
        active: true,
      },
    });
  }

  const invoiceSetting = await prisma.invoiceSetting.findFirst();
  if (!invoiceSetting) {
    await prisma.invoiceSetting.create({
      data: {
        restaurantName: "BarPOS Restaurant & Lounge",
        address: "Dubai, UAE",
        phone: "+971 50 000 0000",
        gstNumber: "TRN-DEMO",
        thankYouMessage: "Thank you. Visit again!",
      },
    });
  }

  const printerSetting = await prisma.printerSetting.findFirst();
  if (!printerSetting) {
    await prisma.printerSetting.create({
      data: {
        invoicePrinter: "Default Browser Printer",
        receiptPrinter: "Default Browser Printer",
        paperSize: "80mm",
      },
    });
  }

  const taxSetting = await prisma.taxSetting.findFirst({
    where: { name: "VAT" },
  });
  if (!taxSetting) {
    await prisma.taxSetting.create({
      data: {
        name: "VAT",
        percent: 0,
        active: true,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
