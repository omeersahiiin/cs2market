/*
  Warnings:

  - You are about to drop the column `type` on the `Order` table. All the data in the column will be lost.
  - Added the required column `orderType` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `positionType` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `remainingQty` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `side` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "type",
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "filledAt" TIMESTAMP(3),
ADD COLUMN     "filledQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "orderType" TEXT NOT NULL,
ADD COLUMN     "positionType" TEXT NOT NULL,
ADD COLUMN     "remainingQty" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "side" TEXT NOT NULL,
ADD COLUMN     "timeInForce" TEXT NOT NULL DEFAULT 'GTC';

-- CreateTable
CREATE TABLE "OrderFill" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderFill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderFill_orderId_idx" ON "OrderFill"("orderId");

-- CreateIndex
CREATE INDEX "Order_skinId_side_status_idx" ON "Order"("skinId", "side", "status");

-- CreateIndex
CREATE INDEX "Order_skinId_price_createdAt_idx" ON "Order"("skinId", "price", "createdAt");

-- CreateIndex
CREATE INDEX "Order_userId_status_idx" ON "Order"("userId", "status");

-- AddForeignKey
ALTER TABLE "OrderFill" ADD CONSTRAINT "OrderFill_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
