-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventType" TEXT NOT NULL,
    "eventData" TEXT NOT NULL DEFAULT '{}',
    "userId" TEXT,
    "sessionId" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_document_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "templateVariables" TEXT NOT NULL,
    "changeType" TEXT NOT NULL DEFAULT 'EDIT',
    "changeDescription" TEXT,
    "changeReason" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "document_versions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_document_versions" ("changeDescription", "changeType", "content", "createdAt", "documentId", "id", "templateId", "templateVariables", "title", "version") SELECT "changeDescription", "changeType", "content", "createdAt", "documentId", "id", "templateId", "templateVariables", "title", "version" FROM "document_versions";
DROP TABLE "document_versions";
ALTER TABLE "new_document_versions" RENAME TO "document_versions";
CREATE UNIQUE INDEX "document_versions_documentId_version_key" ON "document_versions"("documentId", "version");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "preferences" TEXT NOT NULL DEFAULT '{"theme":"light","autoSave":true,"defaultTemplate":"simple-doc"}',
    "brandSettings" TEXT NOT NULL DEFAULT '{"logo":null,"qrcode":null,"dividers":[],"brandColors":["#1e6fff","#333333","#666666"],"customCSS":""}',
    "wechatConfig" TEXT NOT NULL DEFAULT '{"appId":"","appSecret":"","isConnected":false,"accountInfo":null}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("avatar", "brandSettings", "createdAt", "email", "id", "password", "preferences", "updatedAt", "username") SELECT "avatar", "brandSettings", "createdAt", "email", "id", "password", "preferences", "updatedAt", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
