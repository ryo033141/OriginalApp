/*
  Warnings:

  - Added the required column `organizer_id` to the `Meeting` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "auth_user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "organizer_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
