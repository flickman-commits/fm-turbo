-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "arteloOrderData" JSONB NOT NULL,
    "shopifyOrderData" JSONB,
    "raceName" TEXT NOT NULL,
    "raceYear" INTEGER NOT NULL,
    "runnerName" TEXT NOT NULL,
    "productSize" TEXT NOT NULL,
    "frameType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "researchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Race" (
    "id" SERIAL NOT NULL,
    "raceName" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "raceDate" TIMESTAMP(3) NOT NULL,
    "eventTypes" JSONB NOT NULL,
    "resultsUrl" TEXT,
    "resultsSiteType" TEXT,
    "location" TEXT,
    "weatherCondition" TEXT,
    "weatherTemp" TEXT,
    "weatherFetchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Race_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunnerResearch" (
    "id" SERIAL NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "raceId" INTEGER NOT NULL,
    "runnerName" TEXT NOT NULL,
    "bibNumber" TEXT,
    "officialTime" TEXT,
    "officialPace" TEXT,
    "eventType" TEXT,
    "yearFound" INTEGER,
    "researchStatus" TEXT NOT NULL DEFAULT 'pending',
    "researchNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RunnerResearch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_raceName_raceYear_idx" ON "Order"("raceName", "raceYear");

-- CreateIndex
CREATE INDEX "Race_raceName_idx" ON "Race"("raceName");

-- CreateIndex
CREATE INDEX "Race_year_idx" ON "Race"("year");

-- CreateIndex
CREATE UNIQUE INDEX "Race_raceName_year_key" ON "Race"("raceName", "year");

-- CreateIndex
CREATE INDEX "RunnerResearch_orderNumber_idx" ON "RunnerResearch"("orderNumber");

-- CreateIndex
CREATE INDEX "RunnerResearch_raceId_idx" ON "RunnerResearch"("raceId");

-- CreateIndex
CREATE INDEX "RunnerResearch_researchStatus_idx" ON "RunnerResearch"("researchStatus");

-- AddForeignKey
ALTER TABLE "RunnerResearch" ADD CONSTRAINT "RunnerResearch_orderNumber_fkey" FOREIGN KEY ("orderNumber") REFERENCES "Order"("orderNumber") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunnerResearch" ADD CONSTRAINT "RunnerResearch_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "Race"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

