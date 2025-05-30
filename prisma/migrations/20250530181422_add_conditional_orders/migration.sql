-- CreateTable
CREATE TABLE "ConditionalOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skinId" TEXT NOT NULL,
    "orderType" TEXT NOT NULL,
    "triggerPrice" DOUBLE PRECISION NOT NULL,
    "limitPrice" DOUBLE PRECISION,
    "side" TEXT NOT NULL,
    "positionType" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "linkedPositionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "triggeredAt" TIMESTAMP(3),
    "filledAt" TIMESTAMP(3),

    CONSTRAINT "ConditionalOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConditionalOrder_skinId_status_idx" ON "ConditionalOrder"("skinId", "status");

-- CreateIndex
CREATE INDEX "ConditionalOrder_userId_status_idx" ON "ConditionalOrder"("userId", "status");

-- CreateIndex
CREATE INDEX "ConditionalOrder_triggerPrice_status_idx" ON "ConditionalOrder"("triggerPrice", "status");

-- AddForeignKey
ALTER TABLE "ConditionalOrder" ADD CONSTRAINT "ConditionalOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionalOrder" ADD CONSTRAINT "ConditionalOrder_skinId_fkey" FOREIGN KEY ("skinId") REFERENCES "Skin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConditionalOrder" ADD CONSTRAINT "ConditionalOrder_linkedPositionId_fkey" FOREIGN KEY ("linkedPositionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;
