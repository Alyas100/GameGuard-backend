-- CreateTable
CREATE TABLE "MonitoringSession" (
    "id" SERIAL NOT NULL,
    "gameName" TEXT NOT NULL,
    "packageName" TEXT,
    "deviceType" TEXT,
    "deviceId" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "childId" INTEGER NOT NULL,

    CONSTRAINT "MonitoringSession_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MonitoringSession" ADD CONSTRAINT "MonitoringSession_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
