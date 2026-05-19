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
      name: "Beer",
      type: "alcohol",
      commissionEligible: true,
      complimentaryEligible: false,
    },
    {
      name: "Half Bottle",
      type: "alcohol",
      commissionEligible: true,
      complimentaryEligible: false,
    },
    {
      name: "Full Bottle",
      type: "alcohol",
      commissionEligible: true,
      complimentaryEligible: false,
    },
    {
      name: "Cocktails",
      type: "alcohol",
      commissionEligible: true,
      complimentaryEligible: false,
    },
    {
      name: "Special Commission Drinks",
      type: "alcohol",
      commissionEligible: true,
      complimentaryEligible: false,
    },
    {
      name: "Starters",
      type: "food",
      commissionEligible: false,
      complimentaryEligible: true,
    },
    {
      name: "Main Course",
      type: "food",
      commissionEligible: false,
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

  const categoryByName = new Map(
    (await prisma.category.findMany()).map((category) => [category.name, category]),
  );

  const items = [
    {
      name: "Kingfisher Beer Bucket",
      sku: "BEER-BUCKET-KF",
      categoryName: "Beer",
      sellingPrice: 120,
      purchaseCost: 70,
      stockQuantity: 60,
      commissionEligible: true,
    },
    {
      name: "Premium Half Bottle",
      sku: "HALF-PREMIUM",
      categoryName: "Half Bottle",
      sellingPrice: 240,
      purchaseCost: 145,
      stockQuantity: 35,
      commissionEligible: true,
    },
    {
      name: "Whisky Full Bottle",
      sku: "FULL-WHISKY",
      categoryName: "Full Bottle",
      sellingPrice: 450,
      purchaseCost: 280,
      stockQuantity: 25,
      commissionEligible: true,
    },
    {
      name: "Gold Cocktail",
      sku: "COCKTAIL-GOLD",
      categoryName: "Cocktails",
      sellingPrice: 90,
      purchaseCost: 35,
      stockQuantity: 90,
      commissionEligible: true,
    },
    {
      name: "VIP Special Drink",
      sku: "SPECIAL-VIP",
      categoryName: "Special Commission Drinks",
      sellingPrice: 200,
      purchaseCost: 90,
      stockQuantity: 30,
      commissionEligible: true,
      specialCommissionEligible: true,
    },
    {
      name: "Chicken Pakoda",
      sku: "STARTER-CHICKEN-PAKODA",
      categoryName: "Starters",
      sellingPrice: 35,
      purchaseCost: 12,
      stockQuantity: 120,
      complimentaryEligible: true,
    },
    {
      name: "Chicken 65",
      sku: "STARTER-CHICKEN-65",
      categoryName: "Starters",
      sellingPrice: 42,
      purchaseCost: 16,
      stockQuantity: 100,
      complimentaryEligible: true,
    },
    {
      name: "Paneer Tikka",
      sku: "STARTER-PANEER-TIKKA",
      categoryName: "Starters",
      sellingPrice: 38,
      purchaseCost: 14,
      stockQuantity: 100,
      complimentaryEligible: true,
    },
    {
      name: "Veg Biryani",
      sku: "MAIN-VEG-BIRYANI",
      categoryName: "Main Course",
      sellingPrice: 50,
      purchaseCost: 22,
      stockQuantity: 80,
    },
  ];

  for (const item of items) {
    const category = categoryByName.get(item.categoryName);
    if (!category) {
      throw new Error(`Missing category ${item.categoryName}`);
    }

    await prisma.item.upsert({
      where: { sku: item.sku },
      update: {
        name: item.name,
        categoryId: category.id,
        sellingPriceCents: toCents(item.sellingPrice),
        purchaseCostCents: toCents(item.purchaseCost),
        stockQuantity: item.stockQuantity,
        commissionEligible: item.commissionEligible ?? false,
        specialCommissionEligible: item.specialCommissionEligible ?? false,
        complimentaryEligible: item.complimentaryEligible ?? false,
      },
      create: {
        name: item.name,
        sku: item.sku,
        categoryId: category.id,
        sellingPriceCents: toCents(item.sellingPrice),
        purchaseCostCents: toCents(item.purchaseCost),
        stockQuantity: item.stockQuantity,
        commissionEligible: item.commissionEligible ?? false,
        specialCommissionEligible: item.specialCommissionEligible ?? false,
        complimentaryEligible: item.complimentaryEligible ?? false,
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

  const starterItems = await prisma.item.findMany({
    where: { category: { name: "Starters" } },
  });

  const offerConfigs = [
    {
      name: "Beer Bucket = 1 Free Starter",
      buyCategoryName: "Beer",
      buyQuantity: 1,
      freeQuantity: 1,
    },
    {
      name: "Half Bottle = 1 Free Starter",
      buyCategoryName: "Half Bottle",
      buyQuantity: 1,
      freeQuantity: 1,
    },
    {
      name: "Full Bottle = 2 Free Starters",
      buyCategoryName: "Full Bottle",
      buyQuantity: 1,
      freeQuantity: 2,
    },
  ];

  for (const offerConfig of offerConfigs) {
    const buyCategory = categoryByName.get(offerConfig.buyCategoryName);
    const freeCategory = categoryByName.get("Starters");
    if (!buyCategory || !freeCategory) {
      throw new Error(`Missing offer category for ${offerConfig.name}`);
    }

    const existingOffer = await prisma.offer.findFirst({
      where: { name: offerConfig.name },
    });
    const offerData = {
      buyCategoryId: buyCategory.id,
      buyQuantity: offerConfig.buyQuantity,
      freeCategoryId: freeCategory.id,
      freeQuantity: offerConfig.freeQuantity,
      active: true,
      managerApprovalRequired: false,
      waiterCanChooseFreeItem: true,
    };

    const offer = existingOffer
      ? await prisma.offer.update({
          where: { id: existingOffer.id },
          data: offerData,
        })
      : await prisma.offer.create({
          data: { name: offerConfig.name, ...offerData },
        });

    await prisma.offerEligibleItem.deleteMany({ where: { offerId: offer.id } });
    await prisma.offerEligibleItem.createMany({
      data: starterItems.map((item) => ({
        offerId: offer.id,
        itemId: item.id,
      })),
    });
  }

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
