-- Add multi-item support to Order table
-- This migration allows multiple line items from a single Shopify/Etsy order

-- Step 1: Add new columns to Order table
ALTER TABLE "Order" ADD COLUMN "parentOrderNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN "lineItemIndex" INTEGER DEFAULT 0;

-- Step 2: Populate new columns with existing data
-- For existing orders, set parentOrderNumber = orderNumber and lineItemIndex = 0
UPDATE "Order" SET "parentOrderNumber" = "orderNumber" WHERE "parentOrderNumber" IS NULL;
UPDATE "Order" SET "lineItemIndex" = 0 WHERE "lineItemIndex" IS NULL;

-- Step 3: Make the new columns NOT NULL now that they have data
ALTER TABLE "Order" ALTER COLUMN "parentOrderNumber" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "lineItemIndex" SET NOT NULL;

-- Step 4: Update RunnerResearch to use orderId instead of orderNumber
-- First, add the new column
ALTER TABLE "RunnerResearch" ADD COLUMN "orderId" TEXT;

-- Step 5: Populate orderId by looking up the Order id from orderNumber
UPDATE "RunnerResearch"
SET "orderId" = "Order"."id"
FROM "Order"
WHERE "RunnerResearch"."orderNumber" = "Order"."orderNumber";

-- Step 6: Make orderId NOT NULL
ALTER TABLE "RunnerResearch" ALTER COLUMN "orderId" SET NOT NULL;

-- Step 7: Drop the old foreign key constraint (MUST be done before dropping index)
ALTER TABLE "RunnerResearch" DROP CONSTRAINT "RunnerResearch_orderNumber_fkey";

-- Step 8: Drop the old index on orderNumber in RunnerResearch
DROP INDEX "RunnerResearch_orderNumber_idx";

-- Step 9: Drop the unique constraint on Order.orderNumber (now safe to drop)
DROP INDEX "Order_orderNumber_key";

-- Step 10: Add new unique constraint on (parentOrderNumber, lineItemIndex)
CREATE UNIQUE INDEX "Order_parentOrderNumber_lineItemIndex_key" ON "Order"("parentOrderNumber", "lineItemIndex");

-- Step 11: Add index on parentOrderNumber for grouping
CREATE INDEX "Order_parentOrderNumber_idx" ON "Order"("parentOrderNumber");

-- Step 12: Add new foreign key on orderId
ALTER TABLE "RunnerResearch" ADD CONSTRAINT "RunnerResearch_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 13: Add new index on orderId
CREATE INDEX "RunnerResearch_orderId_idx" ON "RunnerResearch"("orderId");

-- Step 14: Drop the old orderNumber column from RunnerResearch
ALTER TABLE "RunnerResearch" DROP COLUMN "orderNumber";
