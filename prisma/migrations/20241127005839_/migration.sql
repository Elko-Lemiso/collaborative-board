-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "currentBoardId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "boardId" TEXT,
    CONSTRAINT "User_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sticker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boardId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "x" REAL NOT NULL,
    "y" REAL NOT NULL,
    "width" REAL NOT NULL,
    "height" REAL NOT NULL,
    "rotation" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    CONSTRAINT "Sticker_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sticker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Sticker" ("boardId", "createdAt", "height", "id", "imageUrl", "rotation", "updatedAt", "width", "x", "y") SELECT "boardId", "createdAt", "height", "id", "imageUrl", "rotation", "updatedAt", "width", "x", "y" FROM "Sticker";
DROP TABLE "Sticker";
ALTER TABLE "new_Sticker" RENAME TO "Sticker";
CREATE TABLE "new_Stroke" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boardId" TEXT NOT NULL,
    "fromX" REAL NOT NULL,
    "fromY" REAL NOT NULL,
    "toX" REAL NOT NULL,
    "toY" REAL NOT NULL,
    "color" TEXT NOT NULL,
    "width" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    CONSTRAINT "Stroke_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Stroke_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Stroke" ("boardId", "color", "createdAt", "fromX", "fromY", "id", "toX", "toY", "width") SELECT "boardId", "color", "createdAt", "fromX", "fromY", "id", "toX", "toY", "width" FROM "Stroke";
DROP TABLE "Stroke";
ALTER TABLE "new_Stroke" RENAME TO "Stroke";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
