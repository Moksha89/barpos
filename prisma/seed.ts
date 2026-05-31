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
    // Champagne & sparkling wine
    { name: "Lanson Black Label Bottle", sku: "MENU-LANSON-BLACK-LABEL-BOTTLE", purchaseCost: 0, sellingPrice: 600, unitType: "bottle" },
    { name: "House Sparkling Bottega Prosecco Bottle", sku: "MENU-HOUSE-SPARKLING-BOTTEGA-PROSECCO-BOTTLE", purchaseCost: 0, sellingPrice: 150, unitType: "bottle" },

    // Wine
    { name: "Shiraz Cabernet Bottle", sku: "MENU-SHIRAZ-CABERNET-BOTTLE", purchaseCost: 50, sellingPrice: 150, unitType: "bottle" },
    { name: "Red Wine Glass", sku: "MENU-RED-WINE-GLASS", purchaseCost: 10, sellingPrice: 30, unitType: "glass" },
    { name: "Chardonnay Bottle", sku: "MENU-CHARDONNAY-BOTTLE", purchaseCost: 50, sellingPrice: 150, unitType: "bottle" },
    { name: "White Wine Glass", sku: "MENU-WHITE-WINE-GLASS", purchaseCost: 10, sellingPrice: 30, unitType: "glass" },
    { name: "Mateus Rose Bottle", sku: "MENU-MATEUS-ROSE-BOTTLE", purchaseCost: 0, sellingPrice: 150, unitType: "bottle" },

    // Draught beers
    { name: "Draught Beer Small", sku: "MENU-DRAUGHT-BEER-SMALL", purchaseCost: 0, sellingPrice: 35, unitType: "glass" },
    { name: "Draught Beer Large", sku: "MENU-DRAUGHT-BEER-LARGE", purchaseCost: 0, sellingPrice: 40, unitType: "glass" },

    // Bottle beers
    { name: "Budweiser Bottle", sku: "MENU-BUDWEISER-BOTTLE", purchaseCost: 4.58, sellingPrice: 25, unitType: "bottle" },
    { name: "Heineken Bottle", sku: "MENU-HEINEKEN-BOTTLE", purchaseCost: 4.58, sellingPrice: 25, unitType: "bottle" },
    { name: "Corona Bottle", sku: "MENU-CORONA-BOTTLE", purchaseCost: 5.83, sellingPrice: 32, unitType: "bottle" },
    { name: "King Fisher Bottle", sku: "MENU-KING-FISHER-BOTTLE", purchaseCost: 7.92, sellingPrice: 45, unitType: "bottle" },

    // Brandy / cognac — 30ml / half / full
    { name: "St-Rémy 30ml", sku: "MENU-ST-REMY-30ML", purchaseCost: 1.56, sellingPrice: 30, unitType: "peg" },
    { name: "St-Rémy Half", sku: "MENU-ST-REMY-HALF", purchaseCost: 19.5, sellingPrice: 175, unitType: "half" },
    { name: "St-Rémy Full", sku: "MENU-ST-REMY-FULL", purchaseCost: 39, sellingPrice: 350, unitType: "full" },
    { name: "Hennessy VS 30ml", sku: "MENU-HENNESSY-VS-30ML", purchaseCost: 7.16, sellingPrice: 40, unitType: "peg" },
    { name: "Hennessy VS Half", sku: "MENU-HENNESSY-VS-HALF", purchaseCost: 89.5, sellingPrice: 300, unitType: "half" },
    { name: "Hennessy VS Full", sku: "MENU-HENNESSY-VS-FULL", purchaseCost: 179, sellingPrice: 600, unitType: "full" },
    { name: "Hennessy VSOP 30ml", sku: "MENU-HENNESSY-VSOP-30ML", purchaseCost: 0, sellingPrice: 50, unitType: "peg" },
    { name: "Hennessy VSOP Half", sku: "MENU-HENNESSY-VSOP-HALF", purchaseCost: 0, sellingPrice: 450, unitType: "half" },
    { name: "Hennessy VSOP Full", sku: "MENU-HENNESSY-VSOP-FULL", purchaseCost: 0, sellingPrice: 900, unitType: "full" },
    { name: "Rémy Martin VSOP 30ml", sku: "MENU-REMY-MARTIN-VSOP-30ML", purchaseCost: 0, sellingPrice: 55, unitType: "peg" },
    { name: "Rémy Martin VSOP Half", sku: "MENU-REMY-MARTIN-VSOP-HALF", purchaseCost: 0, sellingPrice: 450, unitType: "half" },
    { name: "Rémy Martin VSOP Full", sku: "MENU-REMY-MARTIN-VSOP-FULL", purchaseCost: 0, sellingPrice: 900, unitType: "full" },

    // Vodka — 30ml / half / full
    { name: "Absolut 30ml", sku: "MENU-ABSOLUT-30ML", purchaseCost: 1.56, sellingPrice: 28, unitType: "peg" },
    { name: "Absolut Half", sku: "MENU-ABSOLUT-HALF", purchaseCost: 19.5, sellingPrice: 250, unitType: "half" },
    { name: "Absolut Full", sku: "MENU-ABSOLUT-FULL", purchaseCost: 39, sellingPrice: 450, unitType: "full" },
    { name: "Smirnoff Red 30ml", sku: "MENU-SMIRNOFF-RED-30ML", purchaseCost: 0, sellingPrice: 28, unitType: "peg" },
    { name: "Smirnoff Red Half", sku: "MENU-SMIRNOFF-RED-HALF", purchaseCost: 0, sellingPrice: 200, unitType: "half" },
    { name: "Smirnoff Red Full", sku: "MENU-SMIRNOFF-RED-FULL", purchaseCost: 0, sellingPrice: 400, unitType: "full" },
    { name: "Grey Goose 30ml", sku: "MENU-GREY-GOOSE-30ML", purchaseCost: 0, sellingPrice: 50, unitType: "peg" },
    { name: "Grey Goose Half", sku: "MENU-GREY-GOOSE-HALF", purchaseCost: 0, sellingPrice: 450, unitType: "half" },
    { name: "Grey Goose Full", sku: "MENU-GREY-GOOSE-FULL", purchaseCost: 0, sellingPrice: 900, unitType: "full" },

    // Rum — 30ml / half / full
    { name: "Bacardi White 30ml", sku: "MENU-BACARDI-WHITE-30ML", purchaseCost: 2, sellingPrice: 30, unitType: "peg" },
    { name: "Bacardi White Half", sku: "MENU-BACARDI-WHITE-HALF", purchaseCost: 25, sellingPrice: 250, unitType: "half" },
    { name: "Bacardi White Full", sku: "MENU-BACARDI-WHITE-FULL", purchaseCost: 50, sellingPrice: 400, unitType: "full" },
    { name: "Captain Morgan Dark 30ml", sku: "MENU-CAPTAIN-MORGAN-DARK-30ML", purchaseCost: 3.4, sellingPrice: 30, unitType: "peg" },
    { name: "Captain Morgan Dark Half", sku: "MENU-CAPTAIN-MORGAN-DARK-HALF", purchaseCost: 42.5, sellingPrice: 250, unitType: "half" },
    { name: "Captain Morgan Dark Full", sku: "MENU-CAPTAIN-MORGAN-DARK-FULL", purchaseCost: 85, sellingPrice: 400, unitType: "full" },
    { name: "Malibu 30ml", sku: "MENU-MALIBU-30ML", purchaseCost: 0, sellingPrice: 30, unitType: "peg" },
    { name: "Malibu Half", sku: "MENU-MALIBU-HALF", purchaseCost: 0, sellingPrice: 250, unitType: "half" },
    { name: "Malibu Full", sku: "MENU-MALIBU-FULL", purchaseCost: 0, sellingPrice: 400, unitType: "full" },
    { name: "Captain Morgan Spiced Gold 30ml", sku: "MENU-CAPTAIN-MORGAN-SPICED-GOLD-30ML", purchaseCost: 2.4, sellingPrice: 30, unitType: "peg" },
    { name: "Captain Morgan Spiced Gold Half", sku: "MENU-CAPTAIN-MORGAN-SPICED-GOLD-HALF", purchaseCost: 30, sellingPrice: 250, unitType: "half" },
    { name: "Captain Morgan Spiced Gold Full", sku: "MENU-CAPTAIN-MORGAN-SPICED-GOLD-FULL", purchaseCost: 60, sellingPrice: 400, unitType: "full" },

    // Gin — 30ml / half / full
    { name: "Gordon's 30ml", sku: "MENU-GORDONS-30ML", purchaseCost: 2, sellingPrice: 40, unitType: "peg" },
    { name: "Gordon's Half", sku: "MENU-GORDONS-HALF", purchaseCost: 25, sellingPrice: 350, unitType: "half" },
    { name: "Gordon's Full", sku: "MENU-GORDONS-FULL", purchaseCost: 50, sellingPrice: 700, unitType: "full" },
    { name: "Bombay Sapphire 30ml", sku: "MENU-BOMBAY-SAPPHIRE-30ML", purchaseCost: 2.2, sellingPrice: 28, unitType: "peg" },
    { name: "Bombay Sapphire Half", sku: "MENU-BOMBAY-SAPPHIRE-HALF", purchaseCost: 27.5, sellingPrice: 200, unitType: "half" },
    { name: "Bombay Sapphire Full", sku: "MENU-BOMBAY-SAPPHIRE-FULL", purchaseCost: 55, sellingPrice: 450, unitType: "full" },

    // Tequila — 30ml / half / full
    { name: "Jose Cuervo Silver 30ml", sku: "MENU-JOSE-CUERVO-SILVER-30ML", purchaseCost: 1.8, sellingPrice: 30, unitType: "peg" },
    { name: "Jose Cuervo Silver Half", sku: "MENU-JOSE-CUERVO-SILVER-HALF", purchaseCost: 22.5, sellingPrice: 250, unitType: "half" },
    { name: "Jose Cuervo Silver Full", sku: "MENU-JOSE-CUERVO-SILVER-FULL", purchaseCost: 45, sellingPrice: 400, unitType: "full" },
    { name: "Jose Cuervo Gold 30ml", sku: "MENU-JOSE-CUERVO-GOLD-30ML", purchaseCost: 0, sellingPrice: 30, unitType: "peg" },
    { name: "Jose Cuervo Gold Half", sku: "MENU-JOSE-CUERVO-GOLD-HALF", purchaseCost: 0, sellingPrice: 250, unitType: "half" },
    { name: "Jose Cuervo Gold Full", sku: "MENU-JOSE-CUERVO-GOLD-FULL", purchaseCost: 0, sellingPrice: 400, unitType: "full" },

    // Regular whisky — 30ml / half / full
    { name: "Ballantine's 30ml", sku: "MENU-BALLANTINES-30ML", purchaseCost: 2, sellingPrice: 28, unitType: "peg" },
    { name: "Ballantine's Half", sku: "MENU-BALLANTINES-HALF", purchaseCost: 25, sellingPrice: 225, unitType: "half" },
    { name: "Ballantine's Full", sku: "MENU-BALLANTINES-FULL", purchaseCost: 50, sellingPrice: 425, unitType: "full" },
    { name: "Red Label 30ml", sku: "MENU-RED-LABEL-30ML", purchaseCost: 1.8, sellingPrice: 28, unitType: "peg" },
    { name: "Red Label Half", sku: "MENU-RED-LABEL-HALF", purchaseCost: 26, sellingPrice: 225, unitType: "half" },
    { name: "Red Label Full", sku: "MENU-RED-LABEL-FULL", purchaseCost: 45, sellingPrice: 425, unitType: "full" },
    { name: "J & B Rare 30ml", sku: "MENU-JB-RARE-30ML", purchaseCost: 0, sellingPrice: 28, unitType: "peg" },
    { name: "J & B Rare Half", sku: "MENU-JB-RARE-HALF", purchaseCost: 0, sellingPrice: 250, unitType: "half" },
    { name: "J & B Rare Full", sku: "MENU-JB-RARE-FULL", purchaseCost: 0, sellingPrice: 500, unitType: "full" },
    { name: "Canadian Club 30ml", sku: "MENU-CANADIAN-CLUB-30ML", purchaseCost: 0, sellingPrice: 28, unitType: "peg" },
    { name: "Canadian Club Half", sku: "MENU-CANADIAN-CLUB-HALF", purchaseCost: 0, sellingPrice: 250, unitType: "half" },
    { name: "Canadian Club Full", sku: "MENU-CANADIAN-CLUB-FULL", purchaseCost: 0, sellingPrice: 500, unitType: "full" },
    { name: "Jameson 30ml", sku: "MENU-JAMESON-30ML", purchaseCost: 0, sellingPrice: 28, unitType: "peg" },
    { name: "Jameson Half", sku: "MENU-JAMESON-HALF", purchaseCost: 0, sellingPrice: 250, unitType: "half" },
    { name: "Jameson Full", sku: "MENU-JAMESON-FULL", purchaseCost: 0, sellingPrice: 500, unitType: "full" },

    // Premium whisky — 30ml / half / full
    { name: "Chivas Regal 12 30ml", sku: "MENU-CHIVAS-REGAL-12-30ML", purchaseCost: 3.2, sellingPrice: 35, unitType: "peg" },
    { name: "Chivas Regal 12 Half", sku: "MENU-CHIVAS-REGAL-12-HALF", purchaseCost: 50, sellingPrice: 300, unitType: "half" },
    { name: "Chivas Regal 12 Full", sku: "MENU-CHIVAS-REGAL-12-FULL", purchaseCost: 80, sellingPrice: 600, unitType: "full" },
    { name: "Jack Daniel's 30ml", sku: "MENU-JACK-DANIELS-30ML", purchaseCost: 2.6, sellingPrice: 35, unitType: "peg" },
    { name: "Jack Daniel's Half", sku: "MENU-JACK-DANIELS-HALF", purchaseCost: 38, sellingPrice: 300, unitType: "half" },
    { name: "Jack Daniel's Full", sku: "MENU-JACK-DANIELS-FULL", purchaseCost: 65, sellingPrice: 600, unitType: "full" },
    { name: "Black Label 30ml", sku: "MENU-BLACK-LABEL-30ML", purchaseCost: 3.4, sellingPrice: 35, unitType: "peg" },
    { name: "Black Label Half", sku: "MENU-BLACK-LABEL-HALF", purchaseCost: 56, sellingPrice: 300, unitType: "half" },
    { name: "Black Label Full", sku: "MENU-BLACK-LABEL-FULL", purchaseCost: 85, sellingPrice: 600, unitType: "full" },
    { name: "Double Black 30ml", sku: "MENU-DOUBLE-BLACK-30ML", purchaseCost: 5.2, sellingPrice: 40, unitType: "peg" },
    { name: "Double Black Half", sku: "MENU-DOUBLE-BLACK-HALF", purchaseCost: 65, sellingPrice: 400, unitType: "half" },
    { name: "Double Black Full", sku: "MENU-DOUBLE-BLACK-FULL", purchaseCost: 130, sellingPrice: 800, unitType: "full" },
    { name: "Jim Beam 30ml", sku: "MENU-JIM-BEAM-30ML", purchaseCost: 0, sellingPrice: 35, unitType: "peg" },
    { name: "Jim Beam Half", sku: "MENU-JIM-BEAM-HALF", purchaseCost: 0, sellingPrice: 300, unitType: "half" },
    { name: "Jim Beam Full", sku: "MENU-JIM-BEAM-FULL", purchaseCost: 0, sellingPrice: 600, unitType: "full" },

    // Deluxe scotch whisky — 30ml / half / full
    { name: "Blue Label 30ml", sku: "MENU-BLUE-LABEL-30ML", purchaseCost: 0, sellingPrice: 100, unitType: "peg" },
    { name: "Blue Label Half", sku: "MENU-BLUE-LABEL-HALF", purchaseCost: 0, sellingPrice: 1250, unitType: "half" },
    { name: "Blue Label Full", sku: "MENU-BLUE-LABEL-FULL", purchaseCost: 0, sellingPrice: 2500, unitType: "full" },
    { name: "Chivas Regal 18 Years 30ml", sku: "MENU-CHIVAS-REGAL-18-YEARS-30ML", purchaseCost: 8, sellingPrice: 50, unitType: "peg" },
    { name: "Chivas Regal 18 Years Half", sku: "MENU-CHIVAS-REGAL-18-YEARS-HALF", purchaseCost: 100, sellingPrice: 1000, unitType: "half" },
    { name: "Chivas Regal 18 Years Full", sku: "MENU-CHIVAS-REGAL-18-YEARS-FULL", purchaseCost: 200, sellingPrice: 2000, unitType: "full" },
    { name: "Royal Salute 21 Years 30ml", sku: "MENU-ROYAL-SALUTE-21-YEARS-30ML", purchaseCost: 0, sellingPrice: 85, unitType: "peg" },
    { name: "Royal Salute 21 Years Half", sku: "MENU-ROYAL-SALUTE-21-YEARS-HALF", purchaseCost: 0, sellingPrice: 1000, unitType: "half" },
    { name: "Royal Salute 21 Years Full", sku: "MENU-ROYAL-SALUTE-21-YEARS-FULL", purchaseCost: 0, sellingPrice: 2000, unitType: "full" },

    // Single malt scotch whisky
    { name: "Glenfiddich 12 Years 30ml", sku: "MENU-GLENFIDDICH-12-YEARS-30ML", purchaseCost: 4.8, sellingPrice: 40, unitType: "peg" },
    { name: "Glenfiddich 12 Years Half", sku: "MENU-GLENFIDDICH-12-YEARS-HALF", purchaseCost: 60, sellingPrice: 350, unitType: "half" },
    { name: "Glenfiddich 12 Years Full", sku: "MENU-GLENFIDDICH-12-YEARS-FULL", purchaseCost: 120, sellingPrice: 700, unitType: "full" },

    // Liqueurs — per peg
    { name: "Baileys Peg", sku: "MENU-BAILEYS-PEG", purchaseCost: 3.12, sellingPrice: 30, unitType: "peg" },
    { name: "Cointreau Peg", sku: "MENU-COINTREAU-PEG", purchaseCost: 0, sellingPrice: 30, unitType: "peg" },
    { name: "Kahlua Peg", sku: "MENU-KAHLUA-PEG", purchaseCost: 3.2, sellingPrice: 30, unitType: "peg" },
    { name: "Peach Schnapps Peg", sku: "MENU-PEACH-SCHNAPPS-PEG", purchaseCost: 0, sellingPrice: 30, unitType: "peg" },
    { name: "Triple Sec Peg", sku: "MENU-TRIPLE-SEC-PEG", purchaseCost: 0, sellingPrice: 30, unitType: "peg" },
    { name: "Sambuca Peg", sku: "MENU-SAMBUCA-PEG", purchaseCost: 0, sellingPrice: 30, unitType: "peg" },
    { name: "Jagermeister Peg", sku: "MENU-JAGERMEISTER-PEG", purchaseCost: 2.2, sellingPrice: 30, unitType: "peg" },

    // Cocktails
    { name: "Long Island", sku: "MENU-LONG-ISLAND", purchaseCost: 0, sellingPrice: 60, unitType: "glass" },
    { name: "Bull Frog", sku: "MENU-BULL-FROG", purchaseCost: 0, sellingPrice: 60, unitType: "glass" },
    { name: "Sex On The Beach", sku: "MENU-SEX-ON-THE-BEACH", purchaseCost: 0, sellingPrice: 45, unitType: "glass" },
    { name: "Margarita", sku: "MENU-MARGARITA", purchaseCost: 0, sellingPrice: 45, unitType: "glass" },
    { name: "Pina Colada", sku: "MENU-PINA-COLADA", purchaseCost: 0, sellingPrice: 45, unitType: "glass" },
    { name: "Cosmopolitan", sku: "MENU-COSMOPOLITAN", purchaseCost: 0, sellingPrice: 45, unitType: "glass" },
    { name: "Mojito", sku: "MENU-MOJITO", purchaseCost: 0, sellingPrice: 45, unitType: "glass" },
    { name: "Tequila Sunrise", sku: "MENU-TEQUILA-SUNRISE", purchaseCost: 0, sellingPrice: 40, unitType: "glass" },
    { name: "Jäger Bomb", sku: "MENU-JAGER-BOMB", purchaseCost: 0, sellingPrice: 50, unitType: "glass" },
    { name: "Black Russian", sku: "MENU-BLACK-RUSSIAN", purchaseCost: 0, sellingPrice: 45, unitType: "glass" },

    // Shooters
    { name: "Kamikaze", sku: "MENU-KAMIKAZE", purchaseCost: 0, sellingPrice: 35, unitType: "shot" },
    { name: "B-52", sku: "MENU-B-52", purchaseCost: 0, sellingPrice: 35, unitType: "shot" },
    { name: "Brain Damage", sku: "MENU-BRAIN-DAMAGE", purchaseCost: 0, sellingPrice: 35, unitType: "shot" },
    { name: "Flat Liner", sku: "MENU-FLAT-LINER", purchaseCost: 0, sellingPrice: 35, unitType: "shot" },

    // Rice / biryanis
    { name: "Ghee Rice", sku: "MENU-GHEE-RICE", purchaseCost: 0, sellingPrice: 15, unitType: "plate" },
    { name: "Jeera Rice", sku: "MENU-JEERA-RICE", purchaseCost: 0, sellingPrice: 15, unitType: "plate" },
    { name: "Curd Rice", sku: "MENU-CURD-RICE", purchaseCost: 0, sellingPrice: 15, unitType: "plate" },
    { name: "Veg Biryani", sku: "MENU-VEG-BIRYANI", purchaseCost: 0, sellingPrice: 20, unitType: "plate" },
    { name: "Egg Biryani", sku: "MENU-EGG-BIRYANI", purchaseCost: 0, sellingPrice: 25, unitType: "plate" },
    { name: "Hyderabadi Chicken Biryani", sku: "MENU-HYDERABADI-CHICKEN-BIRYANI", purchaseCost: 0, sellingPrice: 25, unitType: "plate" },
    { name: "Natu Kodi Biryani", sku: "MENU-NATU-KODI-BIRYANI", purchaseCost: 0, sellingPrice: 30, unitType: "plate" },
    { name: "Mutton Biryani", sku: "MENU-MUTTON-BIRYANI", purchaseCost: 0, sellingPrice: 30, unitType: "plate" },
    { name: "Prawns Biryani", sku: "MENU-PRAWNS-BIRYANI", purchaseCost: 0, sellingPrice: 30, unitType: "plate" },
    { name: "Fish Biryani", sku: "MENU-FISH-BIRYANI", purchaseCost: 0, sellingPrice: 30, unitType: "plate" },
    { name: "Beef Biryani", sku: "MENU-BEEF-BIRYANI", purchaseCost: 0, sellingPrice: 35, unitType: "plate" },
    { name: "Mixed Biryani", sku: "MENU-MIXED-BIRYANI", purchaseCost: 0, sellingPrice: 40, unitType: "plate" },

    // Fried rice / noodles
    { name: "Veg Fried Rice", sku: "MENU-VEG-FRIED-RICE", purchaseCost: 0, sellingPrice: 20, unitType: "plate" },
    { name: "Egg Fried Rice", sku: "MENU-EGG-FRIED-RICE", purchaseCost: 0, sellingPrice: 25, unitType: "plate" },
    { name: "Chicken Fried Rice", sku: "MENU-CHICKEN-FRIED-RICE", purchaseCost: 0, sellingPrice: 30, unitType: "plate" },
    { name: "Mixed Fried Rice", sku: "MENU-MIXED-FRIED-RICE", purchaseCost: 0, sellingPrice: 35, unitType: "plate" },
    { name: "Veg Noodles", sku: "MENU-VEG-NOODLES", purchaseCost: 0, sellingPrice: 20, unitType: "plate" },
    { name: "Egg Noodles", sku: "MENU-EGG-NOODLES", purchaseCost: 0, sellingPrice: 25, unitType: "plate" },
    { name: "Chicken Noodles", sku: "MENU-CHICKEN-NOODLES", purchaseCost: 0, sellingPrice: 30, unitType: "plate" },
    { name: "Mixed Noodles", sku: "MENU-MIXED-NOODLES", purchaseCost: 0, sellingPrice: 35, unitType: "plate" },

    // Seafood starters
    { name: "Apollo Fish", sku: "MENU-APOLLO-FISH", purchaseCost: 0, sellingPrice: 25, unitType: "plate" },
    { name: "Chilli Fish", sku: "MENU-CHILLI-FISH", purchaseCost: 0, sellingPrice: 25, unitType: "plate" },
    { name: "King Fish", sku: "MENU-KING-FISH", purchaseCost: 0, sellingPrice: 25, unitType: "plate" },
    { name: "Tawa Fish Fry", sku: "MENU-TAWA-FISH-FRY", purchaseCost: 0, sellingPrice: 30, unitType: "plate" },
    { name: "Loose Prawns", sku: "MENU-LOOSE-PRAWNS", purchaseCost: 0, sellingPrice: 25, unitType: "plate" },
    { name: "Chilli Prawns", sku: "MENU-CHILLI-PRAWNS", purchaseCost: 0, sellingPrice: 25, unitType: "plate" },
    { name: "Ghee Roast Prawns Fry", sku: "MENU-GHEE-ROAST-PRAWNS-FRY", purchaseCost: 0, sellingPrice: 25, unitType: "plate" },

    // Breads
    { name: "Chapati", sku: "MENU-CHAPATI", purchaseCost: 0, sellingPrice: 3, unitType: "pcs" },
    { name: "Pulka", sku: "MENU-PULKA", purchaseCost: 0, sellingPrice: 3, unitType: "pcs" },
    { name: "Parotta", sku: "MENU-PAROTTA", purchaseCost: 0, sellingPrice: 5, unitType: "pcs" },
    { name: "Roti", sku: "MENU-ROTI", purchaseCost: 0, sellingPrice: 5, unitType: "pcs" },
    { name: "Dosa Set", sku: "MENU-DOSA-SET", purchaseCost: 0, sellingPrice: 15, unitType: "plate" },

    // Fresh fruit juices
    { name: "Orange Juice", sku: "MENU-ORANGE-JUICE", purchaseCost: 0, sellingPrice: 20, unitType: "glass" },
    { name: "Lemon Juice", sku: "MENU-LEMON-JUICE", purchaseCost: 0, sellingPrice: 20, unitType: "glass" },
    { name: "Watermelon Juice", sku: "MENU-WATERMELON-JUICE", purchaseCost: 0, sellingPrice: 20, unitType: "glass" },
    { name: "Grapes Juice", sku: "MENU-GRAPES-JUICE", purchaseCost: 0, sellingPrice: 20, unitType: "glass" },
    { name: "Pineapple Juice", sku: "MENU-PINEAPPLE-JUICE", purchaseCost: 0, sellingPrice: 20, unitType: "glass" },
    { name: "Lassi", sku: "MENU-LASSI", purchaseCost: 0, sellingPrice: 15, unitType: "glass" },
    { name: "Mango Juice", sku: "MENU-MANGO-JUICE", purchaseCost: 0, sellingPrice: 25, unitType: "glass" },
    { name: "Avocado Juice", sku: "MENU-AVOCADO-JUICE", purchaseCost: 0, sellingPrice: 25, unitType: "glass" },

    // Veg starters
    { name: "French Fries", sku: "MENU-FRENCH-FRIES", purchaseCost: 0, sellingPrice: 15, unitType: "plate" },
    { name: "Peanut Masala", sku: "MENU-PEANUT-MASALA", purchaseCost: 0, sellingPrice: 15, unitType: "plate" },
    { name: "Crispy Corn", sku: "MENU-CRISPY-CORN", purchaseCost: 0, sellingPrice: 15, unitType: "plate" },
    { name: "Mix Pakodi", sku: "MENU-MIX-PAKODI", purchaseCost: 0, sellingPrice: 15, unitType: "plate" },
    { name: "Gobi 65", sku: "MENU-GOBI-65", purchaseCost: 0, sellingPrice: 15, unitType: "plate" },
    { name: "Gobi Manchurian", sku: "MENU-GOBI-MANCHURIAN", purchaseCost: 0, sellingPrice: 15, unitType: "plate" },
    { name: "Chilli Gobi", sku: "MENU-CHILLI-GOBI", purchaseCost: 0, sellingPrice: 15, unitType: "plate" },
    { name: "Chilli Paneer", sku: "MENU-CHILLI-PANEER", purchaseCost: 0, sellingPrice: 25, unitType: "plate" },
    { name: "Pepper Paneer Fry", sku: "MENU-PEPPER-PANEER-FRY", purchaseCost: 0, sellingPrice: 25, unitType: "plate" },
    { name: "Chilli Mushroom", sku: "MENU-CHILLI-MUSHROOM", purchaseCost: 0, sellingPrice: 25, unitType: "plate" },
    { name: "Mushroom Pepper Fry", sku: "MENU-MUSHROOM-PEPPER-FRY", purchaseCost: 0, sellingPrice: 25, unitType: "plate" },

    // Veg main course
    { name: "Dal Tadka", sku: "MENU-DAL-TADKA", purchaseCost: 0, sellingPrice: 15, unitType: "plate" },
    { name: "Kaju Tomato", sku: "MENU-KAJU-TOMATO", purchaseCost: 0, sellingPrice: 20, unitType: "plate" },
    { name: "Paneer Butter Masala", sku: "MENU-PANEER-BUTTER-MASALA", purchaseCost: 0, sellingPrice: 25, unitType: "plate" },
    { name: "Kadai Paneer", sku: "MENU-KADAI-PANEER", purchaseCost: 0, sellingPrice: 25, unitType: "plate" },
    { name: "Palak Paneer", sku: "MENU-PALAK-PANEER", purchaseCost: 0, sellingPrice: 25, unitType: "plate" },
    { name: "Mushroom Masala", sku: "MENU-MUSHROOM-MASALA", purchaseCost: 0, sellingPrice: 25, unitType: "plate" },

    // Fruit platter
    { name: "Fruit Platter Half", sku: "MENU-FRUIT-PLATTER-HALF", purchaseCost: 0, sellingPrice: 15, unitType: "plate" },
    { name: "Fruit Platter Full", sku: "MENU-FRUIT-PLATTER-FULL", purchaseCost: 0, sellingPrice: 25, unitType: "plate" },

    // Non veg starters
    { name: "Chicken 65", sku: "MENU-CHICKEN-65", purchaseCost: 0, sellingPrice: 25, unitType: "plate" },
    { name: "Guntur Chicken Fry (Spicy)", sku: "MENU-GUNTUR-CHICKEN-FRY-SPICY", purchaseCost: 0, sellingPrice: 25, unitType: "plate" },
    { name: "Kaju Chicken", sku: "MENU-KAJU-CHICKEN", purchaseCost: 0, sellingPrice: 30, unitType: "plate" },
    { name: "Chilli Chicken", sku: "MENU-CHILLI-CHICKEN", purchaseCost: 0, sellingPrice: 25, unitType: "plate" },
    { name: "Chicken Lollipop", sku: "MENU-CHICKEN-LOLLIPOP", purchaseCost: 0, sellingPrice: 30, unitType: "plate" },
    { name: "Kaju Mutton Fry", sku: "MENU-KAJU-MUTTON-FRY", purchaseCost: 0, sellingPrice: 35, unitType: "plate" },
    { name: "Pepper Mutton Fry", sku: "MENU-PEPPER-MUTTON-FRY", purchaseCost: 0, sellingPrice: 35, unitType: "plate" },
    { name: "Hyderabadi Style Kadak Mutton Fry", sku: "MENU-HYDERABADI-STYLE-KADAK-MUTTON-FRY", purchaseCost: 0, sellingPrice: 40, unitType: "plate" },
    { name: "Double Egg Omelette", sku: "MENU-DOUBLE-EGG-OMELETTE", purchaseCost: 0, sellingPrice: 15, unitType: "plate" },
    { name: "Chilli Egg", sku: "MENU-CHILLI-EGG", purchaseCost: 0, sellingPrice: 20, unitType: "plate" },
    { name: "Egg Bhurji", sku: "MENU-EGG-BHURJI", purchaseCost: 0, sellingPrice: 15, unitType: "plate" },
    { name: "Beef Roast", sku: "MENU-BEEF-ROAST", purchaseCost: 0, sellingPrice: 30, unitType: "plate" },
    { name: "Chilli Beef", sku: "MENU-CHILLI-BEEF", purchaseCost: 0, sellingPrice: 30, unitType: "plate" },
    { name: "Beef Coconut", sku: "MENU-BEEF-COCONUT", purchaseCost: 0, sellingPrice: 35, unitType: "plate" },

    // Non veg main course
    { name: "Egg Masala", sku: "MENU-EGG-MASALA", purchaseCost: 0, sellingPrice: 20, unitType: "plate" },
    { name: "Chicken Curry", sku: "MENU-CHICKEN-CURRY", purchaseCost: 0, sellingPrice: 25, unitType: "plate" },
    { name: "Butter Chicken Masala", sku: "MENU-BUTTER-CHICKEN-MASALA", purchaseCost: 0, sellingPrice: 30, unitType: "plate" },
    { name: "Natu Kodi Curry (Desi Chicken)", sku: "MENU-NATU-KODI-CURRY-DESI-CHICKEN", purchaseCost: 0, sellingPrice: 35, unitType: "plate" },
    { name: "Telangana Chicken Curry (Spicy)", sku: "MENU-TELANGANA-CHICKEN-CURRY-SPICY", purchaseCost: 0, sellingPrice: 30, unitType: "plate" },
    { name: "Mutton Curry", sku: "MENU-MUTTON-CURRY", purchaseCost: 0, sellingPrice: 35, unitType: "plate" },
    { name: "Beef Masala", sku: "MENU-BEEF-MASALA", purchaseCost: 0, sellingPrice: 35, unitType: "plate" },
    { name: "Prawns Curry", sku: "MENU-PRAWNS-CURRY", purchaseCost: 0, sellingPrice: 30, unitType: "plate" },
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
        sellingPriceCents: toCents(item.sellingPrice),
        purchaseCostCents: toCents(item.purchaseCost),
        stockQuantity: 0,
        unitType: item.unitType,
        commissionEligible: true,
        specialCommissionEligible: false,
        complimentaryEligible: false,
        active: true,
      },
      create: {
        name: item.name,
        sku: item.sku,
        categoryId: category.id,
        sellingPriceCents: toCents(item.sellingPrice),
        purchaseCostCents: toCents(item.purchaseCost),
        stockQuantity: 0,
        unitType: item.unitType,
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
