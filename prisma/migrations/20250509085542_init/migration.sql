-- CreateEnum
CREATE TYPE "vat_type" AS ENUM ('inclusive', 'exclusive');

-- CreateEnum
CREATE TYPE "shop_status" AS ENUM ('active', 'inactive', 'pending_approval', 'suspended', 'on_break');

-- CreateTable
CREATE TABLE "shops" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" VARCHAR(255),
    "cover" VARCHAR(255),
    "description" TEXT,
    "address_id" INTEGER,
    "contact_info_id" INTEGER,
    "social_links_id" INTEGER,
    "currency_info_id" INTEGER NOT NULL,
    "business_info_id" INTEGER NOT NULL,
    "status" "shop_status" NOT NULL DEFAULT 'active',
    "orders_count" INTEGER NOT NULL DEFAULT 0,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "last_sale_at" TIMESTAMP(3),
    "opening_hours" JSONB,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Cairo',
    "language" TEXT NOT NULL DEFAULT 'ar-EG',
    "rating" DOUBLE PRECISION DEFAULT 0.0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "payment_methods" TEXT[],
    "fulfillment_types" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" SERIAL NOT NULL,
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT DEFAULT 'Egypt',
    "postal_code" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "shop_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_infos" (
    "id" SERIAL NOT NULL,
    "phone" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "website" TEXT,
    "support_email" TEXT,
    "whatsapp" TEXT,
    "telegram" TEXT,
    "shop_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_infos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_links" (
    "id" SERIAL NOT NULL,
    "facebook" TEXT,
    "twitter" TEXT,
    "instagram" TEXT,
    "linkedin" TEXT,
    "whatsapp" TEXT,
    "telegram" TEXT,
    "snapchat" TEXT,
    "youtube" TEXT,
    "tiktok" TEXT,
    "pinterest" TEXT,
    "follower_count" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currency_infos" (
    "id" SERIAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'LE',
    "currency_symbol" TEXT NOT NULL DEFAULT 'L.E',
    "currency_code" TEXT NOT NULL DEFAULT 'EGP',
    "decimal_places" INTEGER NOT NULL DEFAULT 2,
    "exchange_rate" DOUBLE PRECISION DEFAULT 1.0,
    "is_default" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currency_infos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_infos" (
    "id" SERIAL NOT NULL,
    "has_delivery" BOOLEAN NOT NULL DEFAULT false,
    "has_takeaway" BOOLEAN NOT NULL DEFAULT false,
    "has_reservation" BOOLEAN NOT NULL DEFAULT false,
    "has_dine_in" BOOLEAN NOT NULL DEFAULT false,
    "delivery_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minimum_order" DOUBLE PRECISION,
    "delivery_radius" DOUBLE PRECISION,
    "preparation_time" INTEGER,
    "vat_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vat_type" "vat_type" NOT NULL DEFAULT 'inclusive',
    "vat_number" TEXT,
    "vat_certificate_url" TEXT,
    "commercial_license" TEXT,
    "license_url" TEXT,
    "opening_time" TEXT,
    "closing_time" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_infos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shops_slug_key" ON "shops"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "shops_address_id_key" ON "shops"("address_id");

-- CreateIndex
CREATE UNIQUE INDEX "shops_contact_info_id_key" ON "shops"("contact_info_id");

-- CreateIndex
CREATE UNIQUE INDEX "shops_social_links_id_key" ON "shops"("social_links_id");

-- CreateIndex
CREATE UNIQUE INDEX "shops_currency_info_id_key" ON "shops"("currency_info_id");

-- CreateIndex
CREATE UNIQUE INDEX "shops_business_info_id_key" ON "shops"("business_info_id");

-- CreateIndex
CREATE UNIQUE INDEX "addresses_shop_id_key" ON "addresses"("shop_id");

-- CreateIndex
CREATE UNIQUE INDEX "contact_infos_shop_id_key" ON "contact_infos"("shop_id");

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_social_links_id_fkey" FOREIGN KEY ("social_links_id") REFERENCES "social_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_currency_info_id_fkey" FOREIGN KEY ("currency_info_id") REFERENCES "currency_infos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_business_info_id_fkey" FOREIGN KEY ("business_info_id") REFERENCES "business_infos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_infos" ADD CONSTRAINT "contact_infos_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE SET NULL ON UPDATE CASCADE;
