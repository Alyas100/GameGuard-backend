-- CreateTable
CREATE TABLE "ScreenTimeLog" (
    "id" SERIAL NOT NULL,
    "childId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "logDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScreenTimeLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ScreenTimeLog" ADD CONSTRAINT "ScreenTimeLog_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreenTimeLog" ADD CONSTRAINT "ScreenTimeLog_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
