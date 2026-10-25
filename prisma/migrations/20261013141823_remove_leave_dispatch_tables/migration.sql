/*
  Warnings:

  - You are about to drop the `DispatchPeriod` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LeavePeriod` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DispatchPeriod" DROP CONSTRAINT "DispatchPeriod_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "LeavePeriod" DROP CONSTRAINT "LeavePeriod_employee_id_fkey";

-- DropTable
DROP TABLE "DispatchPeriod";

-- DropTable
DROP TABLE "LeavePeriod";
