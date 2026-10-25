-- DropForeignKey
ALTER TABLE "MeetingActivity" DROP CONSTRAINT "MeetingActivity_employee_id_fkey";

-- AlterTable
ALTER TABLE "MeetingActivity" ADD COLUMN     "employee_name" VARCHAR(20),
ADD COLUMN     "organizer_name" VARCHAR(20),
ALTER COLUMN "employee_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "MeetingActivity" ADD CONSTRAINT "MeetingActivity_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
