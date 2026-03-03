/*
  Warnings:

  - You are about to alter the column `price` on the `Dish` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `price` on the `Ingredient` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `total` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - A unique constraint covering the columns `[cartId,ingredientId,note]` on the table `CartIngredientItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cartItemId,ingredientId,note]` on the table `CartItemExtra` will be added. If there are existing duplicate values, this will fail.
  - Made the column `price` on table `Ingredient` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "CartItemExtra_cartItemId_ingredientId_key";

-- AlterTable
ALTER TABLE "CartItemExtra" ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "Dish" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Ingredient" ALTER COLUMN "price" SET NOT NULL,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "total" SET DATA TYPE DECIMAL(10,2);

-- CreateIndex
CREATE UNIQUE INDEX "CartIngredientItem_cartId_ingredientId_note_key" ON "CartIngredientItem"("cartId", "ingredientId", "note");

-- CreateIndex
CREATE UNIQUE INDEX "CartItemExtra_cartItemId_ingredientId_note_key" ON "CartItemExtra"("cartItemId", "ingredientId", "note");
