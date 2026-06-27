-- CreateEnum
CREATE TYPE "NoticeStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "fileType" TEXT,
ADD COLUMN     "subjectName" TEXT;

-- AlterTable
ALTER TABLE "Notice" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'General',
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'Normal';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "SchoolSetting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "platformName" TEXT NOT NULL DEFAULT 'Smart Campus',
    "platformDesc" TEXT NOT NULL DEFAULT '',
    "academicSession" TEXT NOT NULL DEFAULT '2026 - 2027',
    "schoolName" TEXT NOT NULL DEFAULT '',
    "schoolEmail" TEXT NOT NULL DEFAULT '',
    "schoolPhone" TEXT NOT NULL DEFAULT '',
    "schoolAddress" TEXT NOT NULL DEFAULT '',
    "schoolCity" TEXT NOT NULL DEFAULT '',
    "schoolState" TEXT NOT NULL DEFAULT '',
    "schoolWebsite" TEXT NOT NULL DEFAULT '',
    "language" TEXT NOT NULL DEFAULT 'English',
    "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "theme" TEXT NOT NULL DEFAULT 'indigo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolSetting_pkey" PRIMARY KEY ("id")
);
