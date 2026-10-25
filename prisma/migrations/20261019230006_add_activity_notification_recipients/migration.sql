-- AlterTable
ALTER TABLE "MeetingActivity" ADD COLUMN     "notification_employee_ids" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
