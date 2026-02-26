/*
  Warnings:

  - You are about to alter the column `last4` on the `PaymentMethod` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(4)`.

*/
-- AlterTable
ALTER TABLE "PaymentMethod" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "last4" SET DATA TYPE VARCHAR(4);

-- CreateIndex
CREATE INDEX "PaymentMethod_userId_idx" ON "PaymentMethod"("userId");
