/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Skin` table. All the data in the column will be lost.
  - Added the required column `iconPath` to the `Skin` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Skin" DROP COLUMN "imageUrl",
ADD COLUMN     "iconPath" TEXT NOT NULL;
