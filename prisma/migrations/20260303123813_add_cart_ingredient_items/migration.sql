/*
  Warnings:

  - You are about to alter the column `quantity` on the `CartItemExtra` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `quantity` on the `DishIngredient` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "CartItemExtra" ALTER COLUMN "quantity" SET DEFAULT 1,
ALTER COLUMN "quantity" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "DishIngredient" ALTER COLUMN "quantity" SET DEFAULT 1,
ALTER COLUMN "quantity" SET DATA TYPE INTEGER;

-- CreateTable
CREATE TABLE "CartIngredientItem" (
    "id" SERIAL NOT NULL,
    "cartId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,

    CONSTRAINT "CartIngredientItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CartIngredientItem_cartId_idx" ON "CartIngredientItem"("cartId");

-- CreateIndex
CREATE INDEX "CartIngredientItem_ingredientId_idx" ON "CartIngredientItem"("ingredientId");

-- AddForeignKey
ALTER TABLE "CartIngredientItem" ADD CONSTRAINT "CartIngredientItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartIngredientItem" ADD CONSTRAINT "CartIngredientItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
