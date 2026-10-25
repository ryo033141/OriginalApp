/*
  Warnings:

  - You are about to drop the column `status_id` on the `Meeting` table. All the data in the column will be lost.
  - You are about to drop the `MeetingStatus` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[employee_id,meeting_id]` on the table `MeetingParticipant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `attendance_type` to the `MeetingParticipant` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AttendanceType" AS ENUM ('required', 'optional');

-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_status_id_fkey";

-- AlterTable
ALTER TABLE "Meeting" DROP COLUMN "status_id";

-- AlterTable
ALTER TABLE "MeetingParticipant" ADD COLUMN     "attendance_type" "AttendanceType" NOT NULL;

-- DropTable
DROP TABLE "MeetingStatus";

-- CreateIndex
CREATE UNIQUE INDEX "MeetingParticipant_employee_id_meeting_id_key" ON "MeetingParticipant"("employee_id", "meeting_id");
