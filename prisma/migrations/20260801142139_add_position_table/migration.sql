/*
  Warnings:

  - You are about to drop the `EnrollmentStstus` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_enrollment_status_id_fkey";

-- DropTable
DROP TABLE "EnrollmentStstus";

-- CreateTable
CREATE TABLE "EnrollmentStatus" (
    "id" SERIAL NOT NULL,
    "enrollment_status" VARCHAR(20) NOT NULL,

    CONSTRAINT "EnrollmentStatus_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_enrollment_status_id_fkey" FOREIGN KEY ("enrollment_status_id") REFERENCES "EnrollmentStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
