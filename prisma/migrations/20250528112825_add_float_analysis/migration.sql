-- AlterTable
ALTER TABLE "Skin" ADD COLUMN     "defIndex" INTEGER,
ADD COLUMN     "maxFloat" DOUBLE PRECISION,
ADD COLUMN     "minFloat" DOUBLE PRECISION,
ADD COLUMN     "paintIndex" INTEGER;

-- CreateTable
CREATE TABLE "FloatData" (
    "id" TEXT NOT NULL,
    "skinId" TEXT NOT NULL,
    "wear" TEXT NOT NULL,
    "floatMin" DOUBLE PRECISION NOT NULL,
    "floatMax" DOUBLE PRECISION NOT NULL,
    "avgFloat" DOUBLE PRECISION NOT NULL,
    "avgPrice" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FloatData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FloatPriceRange" (
    "id" TEXT NOT NULL,
    "floatDataId" TEXT NOT NULL,
    "floatMin" DOUBLE PRECISION NOT NULL,
    "floatMax" DOUBLE PRECISION NOT NULL,
    "avgPrice" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FloatPriceRange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FloatData_skinId_idx" ON "FloatData"("skinId");

-- CreateIndex
CREATE UNIQUE INDEX "FloatData_skinId_wear_key" ON "FloatData"("skinId", "wear");

-- CreateIndex
CREATE INDEX "FloatPriceRange_floatDataId_idx" ON "FloatPriceRange"("floatDataId");

-- CreateIndex
CREATE INDEX "FloatPriceRange_floatMin_floatMax_idx" ON "FloatPriceRange"("floatMin", "floatMax");

-- AddForeignKey
ALTER TABLE "FloatData" ADD CONSTRAINT "FloatData_skinId_fkey" FOREIGN KEY ("skinId") REFERENCES "Skin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FloatPriceRange" ADD CONSTRAINT "FloatPriceRange_floatDataId_fkey" FOREIGN KEY ("floatDataId") REFERENCES "FloatData"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
