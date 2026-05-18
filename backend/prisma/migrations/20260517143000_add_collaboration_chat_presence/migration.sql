-- CreateTable
CREATE TABLE "CollaborationMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CollaborationMessage_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CollaborationGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollaborationMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CollaborationPresence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CollaborationPresence_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CollaborationGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollaborationPresence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CollaborationMessage_groupId_createdAt_idx" ON "CollaborationMessage"("groupId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CollaborationPresence_groupId_userId_key" ON "CollaborationPresence"("groupId", "userId");

-- CreateIndex
CREATE INDEX "CollaborationPresence_groupId_lastSeenAt_idx" ON "CollaborationPresence"("groupId", "lastSeenAt");
