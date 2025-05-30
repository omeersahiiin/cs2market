/*
  Warnings:

  - You are about to drop the column `currentPrice` on the `Position` table. All the data in the column will be lost.
  - You are about to drop the column `pnl` on the `Position` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Position` table. All the data in the column will be lost.
  - Added the required column `margin` to the `Position` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `Position` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Position" DROP COLUMN "currentPrice",
DROP COLUMN "pnl",
DROP COLUMN "quantity",
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "margin" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "size" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "balance" SET DEFAULT 10000;

-- CreateIndex
CREATE INDEX "Position_userId_idx" ON "Position"("userId");

-- CreateIndex
CREATE INDEX "Position_skinId_idx" ON "Position"("skinId");
