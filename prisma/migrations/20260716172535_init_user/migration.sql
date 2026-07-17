/*
  Warnings:

  - You are about to drop the column `author` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `claimedBy` on the `Task` table. All the data in the column will be lost.
  - Added the required column `authorId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'performer',
    "reputation" INTEGER NOT NULL DEFAULT 0
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "acceptanceCriteria" TEXT,
    "bountyAmount" TEXT NOT NULL,
    "bountyCurrency" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "timePosted" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvalType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "submissionText" TEXT,
    "submissionLinks" TEXT,
    "authorId" TEXT NOT NULL,
    "claimedById" TEXT,
    CONSTRAINT "Task_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Task_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("acceptanceCriteria", "approvalType", "bountyAmount", "bountyCurrency", "category", "description", "id", "status", "submissionLinks", "submissionText", "timePosted", "title") SELECT "acceptanceCriteria", "approvalType", "bountyAmount", "bountyCurrency", "category", "description", "id", "status", "submissionLinks", "submissionText", "timePosted", "title" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");
