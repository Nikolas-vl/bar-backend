-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "note" TEXT;

-- CreateTable
CREATE TABLE "OrderItemExtra" (
    "id" SERIAL NOT NULL,
    "orderItemId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "OrderItemExtra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderItemExtra_orderItemId_idx" ON "OrderItemExtra"("orderItemId");

-- CreateIndex
CREATE INDEX "OrderItemExtra_ingredientId_idx" ON "OrderItemExtra"("ingredientId");

-- AddForeignKey
ALTER TABLE "OrderItemExtra" ADD CONSTRAINT "OrderItemExtra_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemExtra" ADD CONSTRAINT "OrderItemExtra_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
