/*
  Warnings:

  - Made the column `position_name` on table `Position` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Position" ALTER COLUMN "position_name" SET NOT NULL;
