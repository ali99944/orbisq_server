/*
  Warnings:

  - Added the required column `shop_owner_id` to the `shops` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "shops" ADD COLUMN     "shop_owner_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "shop_owners" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_access_portal" (
    "id" SERIAL NOT NULL,
    "shop_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "permissions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_access_portal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_access_token" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "owner_id" INTEGER,
    "portal_id" INTEGER,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_access_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shop_owners_email_key" ON "shop_owners"("email");

-- CreateIndex
CREATE UNIQUE INDEX "shop_owners_phone_key" ON "shop_owners"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "shop_access_portal_shop_id_key" ON "shop_access_portal"("shop_id");

-- CreateIndex
CREATE UNIQUE INDEX "shop_access_portal_username_key" ON "shop_access_portal"("username");

-- CreateIndex
CREATE UNIQUE INDEX "shop_access_token_token_key" ON "shop_access_token"("token");

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_shop_owner_id_fkey" FOREIGN KEY ("shop_owner_id") REFERENCES "shop_owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_access_portal" ADD CONSTRAINT "shop_access_portal_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_access_token" ADD CONSTRAINT "shop_access_token_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "shop_owners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_access_token" ADD CONSTRAINT "shop_access_token_portal_id_fkey" FOREIGN KEY ("portal_id") REFERENCES "shop_access_portal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
