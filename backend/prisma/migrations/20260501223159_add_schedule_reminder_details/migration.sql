-- AlterTable
ALTER TABLE "Reminder" ADD COLUMN "linksJson" TEXT;
ALTER TABLE "Reminder" ADD COLUMN "location" TEXT;
ALTER TABLE "Reminder" ADD COLUMN "notes" TEXT;
ALTER TABLE "Reminder" ADD COLUMN "priority" TEXT;

-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN "extraInfo" TEXT;
ALTER TABLE "Schedule" ADD COLUMN "linksJson" TEXT;
ALTER TABLE "Schedule" ADD COLUMN "notes" TEXT;
