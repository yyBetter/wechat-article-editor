-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "aiUsageCount" INTEGER NOT NULL DEFAULT 0,
    "aiUsageLimit" INTEGER NOT NULL DEFAULT 10,
    "aiUsageResetAt" DATETIME,
    "preferences" TEXT NOT NULL DEFAULT '{"theme":"light","autoSave":true,"defaultTemplate":"simple-doc"}',
    "brandSettings" TEXT NOT NULL DEFAULT '{"logo":null,"qrcode":null,"dividers":[],"brandColors":["#1e6fff","#333333","#666666"],"customCSS":""}',
    "wechatConfig" TEXT NOT NULL DEFAULT '{"appId":"","appSecret":"","isConnected":false,"accountInfo":null}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("avatar", "brandSettings", "createdAt", "email", "id", "password", "preferences", "updatedAt", "username", "wechatConfig") SELECT "avatar", "brandSettings", "createdAt", "email", "id", "password", "preferences", "updatedAt", "username", "wechatConfig" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
