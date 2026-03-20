-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "addressId" INTEGER;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "phone" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Order_addressId_idx" ON "Order"("addressId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
