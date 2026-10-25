/*
  Warnings:

  - You are about to drop the `Authentication` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[auth_user_id]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `auth_user_id` to the `Employee` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Authentication" DROP CONSTRAINT "Authentication_employee_id_fkey";

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "auth_user_id" UUID NOT NULL;

-- DropTable
DROP TABLE "Authentication";

-- CreateIndex
CREATE UNIQUE INDEX "Employee_auth_user_id_key" ON "Employee"("auth_user_id");
