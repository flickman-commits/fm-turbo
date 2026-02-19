-- AlterTable: Add custom order classification and fields
ALTER TABLE "Order" ADD COLUMN "trackstarOrderType" TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE "Order" ADD COLUMN "designStatus" TEXT NOT NULL DEFAULT 'not_started';
ALTER TABLE "Order" ADD COLUMN "dueDate" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "customerEmail" TEXT;
ALTER TABLE "Order" ADD COLUMN "customerName" TEXT;
ALTER TABLE "Order" ADD COLUMN "bibNumberCustomer" TEXT;
ALTER TABLE "Order" ADD COLUMN "timeCustomer" TEXT;
ALTER TABLE "Order" ADD COLUMN "creativeDirection" TEXT;
ALTER TABLE "Order" ADD COLUMN "isGift" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Order_trackstarOrderType_idx" ON "Order"("trackstarOrderType");
