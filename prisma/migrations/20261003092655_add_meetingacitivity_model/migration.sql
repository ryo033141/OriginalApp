-- CreateEnum
CREATE TYPE "MeetingAction" AS ENUM ('create', 'update', 'delete');

-- CreateTable
CREATE TABLE "MeetingActivity" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "meeting_id" INTEGER,
    "old_meeting_title" VARCHAR(30),
    "meeting_title" VARCHAR(30) NOT NULL,
    "action" "MeetingAction" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingActivity_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MeetingActivity" ADD CONSTRAINT "MeetingActivity_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingActivity" ADD CONSTRAINT "MeetingActivity_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;
