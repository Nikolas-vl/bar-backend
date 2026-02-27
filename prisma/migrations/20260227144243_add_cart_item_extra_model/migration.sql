-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "note" TEXT;

-- CreateTable
CREATE TABLE "CartItemExtra" (
    "id" SERIAL NOT NULL,
    "cartItemId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "CartItemExtra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CartItemExtra_cartItemId_idx" ON "CartItemExtra"("cartItemId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItemExtra_cartItemId_ingredientId_key" ON "CartItemExtra"("cartItemId", "ingredientId");

-- AddForeignKey
ALTER TABLE "CartItemExtra" ADD CONSTRAINT "CartItemExtra_cartItemId_fkey" FOREIGN KEY ("cartItemId") REFERENCES "CartItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItemExtra" ADD CONSTRAINT "CartItemExtra_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
