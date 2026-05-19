import { prisma } from "@/lib/db";

export function businessDateStart(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

export async function getOrOpenBusinessDay() {
  const businessDate = businessDateStart();
  const existing = await prisma.businessDay.findUnique({
    where: { businessDate },
  });

  if (existing?.status === "OPEN") {
    return existing;
  }

  if (existing?.status === "CLOSED") {
    return prisma.businessDay.update({
      where: { id: existing.id },
      data: { status: "OPEN", closedAt: null },
    });
  }

  return prisma.businessDay.create({
    data: { businessDate, status: "OPEN" },
  });
}

export async function nextTableNumber(businessDayId: string) {
  const lastTable = await prisma.barTable.findFirst({
    where: { businessDayId },
    orderBy: { tableNumber: "desc" },
  });
  return (lastTable?.tableNumber ?? 0) + 1;
}

export async function getActiveTableCards() {
  const businessDay = await getOrOpenBusinessDay();
  const tables = await prisma.barTable.findMany({
    where: { businessDayId: businessDay.id },
    include: {
      staff: true,
      orders: {
        include: { payments: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { tableNumber: "asc" },
  });

  return { businessDay, tables };
}

export type ActiveTableCards = Awaited<ReturnType<typeof getActiveTableCards>>;
