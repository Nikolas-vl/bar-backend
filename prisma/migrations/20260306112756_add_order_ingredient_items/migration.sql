-- CreateTable
CREATE TABLE "OrderIngredientItem" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,

    CONSTRAINT "OrderIngredientItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderIngredientItem_orderId_idx" ON "OrderIngredientItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderIngredientItem_ingredientId_idx" ON "OrderIngredientItem"("ingredientId");

-- AddForeignKey
ALTER TABLE "OrderIngredientItem" ADD CONSTRAINT "OrderIngredientItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderIngredientItem" ADD CONSTRAINT "OrderIngredientItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
