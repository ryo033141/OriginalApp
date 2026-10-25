/*
  Warnings:

  - You are about to drop the column `meetingplace_id` on the `Meeting` table. All the data in the column will be lost.
  - You are about to drop the `MeetingPlace` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `place` to the `Meeting` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_meetingplace_id_fkey";

-- AlterTable
ALTER TABLE "Meeting" DROP COLUMN "meetingplace_id",
ADD COLUMN     "place" VARCHAR(20) NOT NULL;

-- DropTable
DROP TABLE "MeetingPlace";
