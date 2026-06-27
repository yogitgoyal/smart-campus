-- CreateTable
CREATE TABLE "Period" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "periodNumber" INTEGER,
    "label" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isBreak" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Period_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Period_classId_order_key" ON "Period"("classId", "order");

-- AddForeignKey
ALTER TABLE "Period" ADD CONSTRAINT "Period_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
