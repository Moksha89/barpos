-- CreateTable
CREATE TABLE "DayPasscodeSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "passcode" TEXT NOT NULL DEFAULT '1599',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
