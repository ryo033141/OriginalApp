-- CreateTable
CREATE TABLE "Employee" (
    "id" INTEGER NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "department_id" INTEGER NOT NULL,
    "postion_id" INTEGER NOT NULL,
    "employee_status_id" INTEGER NOT NULL,
    "enrollment_status_id" INTEGER NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingParticipant" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "meeting_id" INTEGER NOT NULL,

    CONSTRAINT "MeetingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(30) NOT NULL,
    "start_datetime" TIMESTAMP(3) NOT NULL,
    "end_datetime" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "meetingplace_id" INTEGER NOT NULL,
    "status_id" INTEGER NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingPlace" (
    "id" SERIAL NOT NULL,
    "place" VARCHAR(20) NOT NULL,

    CONSTRAINT "MeetingPlace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingStatus" (
    "id" SERIAL NOT NULL,
    "status" VARCHAR(20) NOT NULL,

    CONSTRAINT "MeetingStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "department_name" VARCHAR(20) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" SERIAL NOT NULL,
    "postion_name" VARCHAR(20) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploymentStatus" (
    "id" SERIAL NOT NULL,
    "employee_status" VARCHAR(20) NOT NULL,

    CONSTRAINT "EmploymentStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrollmentStstus" (
    "id" SERIAL NOT NULL,
    "enrollment_status" VARCHAR(20) NOT NULL,

    CONSTRAINT "EnrollmentStstus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeavePeriod" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "leave_startdate" TIMESTAMP(3) NOT NULL,
    "leave_enddate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeavePeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchPeriod" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "dispatch_name" VARCHAR(50) NOT NULL,
    "dispatch_startdate" TIMESTAMP(3) NOT NULL,
    "dispatch_enddate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatchPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Authentication" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "password" VARCHAR(100) NOT NULL,
    "active_flag" BOOLEAN NOT NULL DEFAULT false,
    "admin_flag" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Authentication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Authentication_employee_id_key" ON "Authentication"("employee_id");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_postion_id_fkey" FOREIGN KEY ("postion_id") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_employee_status_id_fkey" FOREIGN KEY ("employee_status_id") REFERENCES "EmploymentStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_enrollment_status_id_fkey" FOREIGN KEY ("enrollment_status_id") REFERENCES "EnrollmentStstus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_meetingplace_id_fkey" FOREIGN KEY ("meetingplace_id") REFERENCES "MeetingPlace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "MeetingStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeavePeriod" ADD CONSTRAINT "LeavePeriod_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchPeriod" ADD CONSTRAINT "DispatchPeriod_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Authentication" ADD CONSTRAINT "Authentication_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
