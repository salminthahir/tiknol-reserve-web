-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "cashierName" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "startCash" INTEGER NOT NULL DEFAULT 0,
    "expectedCash" INTEGER,
    "actualCash" INTEGER,
    "difference" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'OPEN',

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);
