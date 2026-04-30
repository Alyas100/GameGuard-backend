/*
  Warnings:

  - A unique constraint covering the columns `[deviceId]` on the table `Child` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Child" ADD COLUMN     "deviceId" TEXT,
ADD COLUMN     "isLinked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "linkedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Child_deviceId_key" ON "Child"("deviceId");
