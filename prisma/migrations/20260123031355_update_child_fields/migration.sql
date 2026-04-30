/*
  Warnings:

  - You are about to drop the column `ageRange` on the `Child` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Child` table. All the data in the column will be lost.
  - Added the required column `age` to the `Child` table without a default value. This is not possible if the table is not empty.
  - Added the required column `childName` to the `Child` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- Rename 'name' to 'childName'
ALTER TABLE "Child" RENAME COLUMN "name" TO "childName";

-- Convert 'ageRange' (String) to 'age' (Int)
-- First, rename the column
ALTER TABLE "Child" RENAME COLUMN "ageRange" TO "age_temp";

-- Add new 'age' column as integer
ALTER TABLE "Child" ADD COLUMN "age" INTEGER;

-- Copy data (extract first number from range like "13-16" -> 13)
UPDATE "Child" SET "age" = CAST(SPLIT_PART("age_temp", '-', 1) AS INTEGER);

-- Make it NOT NULL
ALTER TABLE "Child" ALTER COLUMN "age" SET NOT NULL;

-- Drop old column
ALTER TABLE "Child" DROP COLUMN "age_temp";