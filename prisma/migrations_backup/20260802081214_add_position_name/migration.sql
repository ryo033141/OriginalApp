/*
  Warnings:

  - You are about to drop the column `postion_id` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `postion_name` on the `Position` table. All the data in the column will be lost.
  - Added the required column `position_id` to the `Employee` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_postion_id_fkey";

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "postion_id",
ADD COLUMN     "position_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Position" DROP COLUMN "postion_name",
ADD COLUMN     "position_name" VARCHAR(20);

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
