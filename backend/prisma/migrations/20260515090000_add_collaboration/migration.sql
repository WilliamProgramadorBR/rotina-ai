-- AlterTable
ALTER TABLE "User" ADD COLUMN "acceptedPrivacyAt" DATETIME;

-- CreateTable
CREATE TABLE "CollaborationGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CollaborationGroup_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CollaborationMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CollaborationMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CollaborationGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollaborationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CollaborationInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "invitedUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "acceptedAt" DATETIME,
    CONSTRAINT "CollaborationInvite_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CollaborationGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollaborationInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollaborationInvite_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN "groupId" TEXT REFERENCES "CollaborationGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Reminder" ADD COLUMN "assignedUserId" TEXT REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "CollaborationMember_groupId_userId_key" ON "CollaborationMember"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CollaborationInvite_groupId_email_key" ON "CollaborationInvite"("groupId", "email");
