/*
  Warnings:

  - A unique constraint covering the columns `[shop_theme_id]` on the table `shops` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shop_theme_id` to the `shops` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "branch_status" AS ENUM ('active', 'inactive', 'opening_soon', 'closed_temporary', 'closed_permanent', 'under_renovation');

-- CreateEnum
CREATE TYPE "terminal_type" AS ENUM ('cash_register', 'kitchen_printer', 'handheld', 'self_service', 'mobile');

-- CreateEnum
CREATE TYPE "day_of_week" AS ENUM ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');

-- CreateEnum
CREATE TYPE "UnitOfMeasure" AS ENUM ('grams', 'kilograms', 'milliliters', 'liters', 'pieces', 'ounces', 'pounds', 'cups', 'tablespoons', 'teaspoons', 'gallons');

-- CreateEnum
CREATE TYPE "AllergenType" AS ENUM ('gluten', 'dairy', 'nuts', 'peanuts', 'soy', 'eggs', 'fish', 'shellfish', 'sesame', 'mustard', 'celery', 'lupin', 'molluscs', 'sulphur_dioxide');

-- CreateEnum
CREATE TYPE "desk_status" AS ENUM ('free', 'occupied', 'reserved', 'cleaning', 'out_of_service');

-- CreateEnum
CREATE TYPE "discount_applies_to" AS ENUM ('all_products', 'specific_products', 'specific_categories', 'minimum_order');

-- CreateEnum
CREATE TYPE "gift_card_transaction_type" AS ENUM ('purchase', 'redemption', 'adjustment', 'refund');

-- CreateEnum
CREATE TYPE "CustomerEligibility" AS ENUM ('all', 'specific_groups', 'specific_customers', 'first_time_buyers', 'returning_customers');

-- CreateEnum
CREATE TYPE "discount_type" AS ENUM ('percentage', 'fixed_amount_off', 'fixed_price', 'free_shipping');

-- CreateEnum
CREATE TYPE "ModifierDisplayType" AS ENUM ('radio', 'checkbox', 'dropdown', 'quantity');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'served', 'out_for_delivery', 'delivered', 'completed', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "item_status" AS ENUM ('pending', 'preparing', 'ready', 'served', 'cancelled');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('unpaid', 'partially_paid', 'paid', 'refunded', 'failed');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('cash', 'credit_card', 'debit_card', 'mobile_wallet', 'bank_transfer', 'voucher', 'online_payment');

-- CreateEnum
CREATE TYPE "order_type" AS ENUM ('dine_in', 'takeaway', 'delivery');

-- CreateEnum
CREATE TYPE "pricing_type" AS ENUM ('fixed', 'dynamic');

-- CreateEnum
CREATE TYPE "sales_unit_type" AS ENUM ('piece', 'weight', 'volume', 'length');

-- CreateEnum
CREATE TYPE "cost_calculation_unit" AS ENUM ('ingredient', 'operation', 'time_based');

-- CreateEnum
CREATE TYPE "tax_type" AS ENUM ('sales', 'vat', 'gst', 'service');

-- AlterTable
ALTER TABLE "business_infos" ADD COLUMN     "has_through_drive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "shops" ADD COLUMN     "shop_theme_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "branches" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_main" BOOLEAN NOT NULL DEFAULT false,
    "status" "branch_status" NOT NULL DEFAULT 'active',
    "opening_date" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "locale" TEXT NOT NULL DEFAULT 'en-US',
    "tax_id_number" TEXT,
    "manager_id" INTEGER,
    "contact_person" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "accepts_reservations" BOOLEAN NOT NULL DEFAULT true,
    "accepts_walkins" BOOLEAN NOT NULL DEFAULT true,
    "has_delivery" BOOLEAN NOT NULL DEFAULT false,
    "has_pickup" BOOLEAN NOT NULL DEFAULT true,
    "has_dine_in" BOOLEAN NOT NULL DEFAULT true,
    "geo_latitude" DOUBLE PRECISION,
    "geo_longitude" DOUBLE PRECISION,
    "map_link" TEXT,
    "total_capacity" INTEGER,
    "current_occupancy" INTEGER NOT NULL DEFAULT 0,
    "monthly_sales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "average_rating" DOUBLE PRECISION DEFAULT 0.0,
    "shop_id" INTEGER NOT NULL,
    "address_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_operating_hours" (
    "id" SERIAL NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "day_of_week" "day_of_week" NOT NULL,
    "opening_time" TEXT,
    "closing_time" TEXT,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "special_note" TEXT,

    CONSTRAINT "branch_operating_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_menus" (
    "id" SERIAL NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "menu_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "available_from" TIMESTAMP(3),
    "available_to" TIMESTAMP(3),

    CONSTRAINT "branch_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_staff" (
    "id" SERIAL NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "position" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),

    CONSTRAINT "branch_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_terminals" (
    "id" SERIAL NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "type" "terminal_type" NOT NULL DEFAULT 'cash_register',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_active_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_terminals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_inventory" (
    "id" SERIAL NOT NULL,
    "branch_id" INTEGER NOT NULL,
    "product_id" INTEGER,
    "ingredient_id" INTEGER,
    "current_stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "low_stock_threshold" DOUBLE PRECISION DEFAULT 5,
    "last_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_by" INTEGER,

    CONSTRAINT "branch_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "barcode" TEXT,
    "category_id" INTEGER,
    "unit_of_measure" "UnitOfMeasure" NOT NULL DEFAULT 'grams',
    "cost_per_unit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "current_stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "low_stock_alert" DOUBLE PRECISION DEFAULT 10,
    "shelf_life_days" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_consumable" BOOLEAN NOT NULL DEFAULT true,
    "is_allergen" BOOLEAN NOT NULL DEFAULT false,
    "allergen_type" "AllergenType",
    "supplier_id" INTEGER,
    "supplier_code" TEXT,
    "minimum_order" DOUBLE PRECISION,
    "lead_time_days" INTEGER,
    "calories" DOUBLE PRECISION DEFAULT 0,
    "protein" DOUBLE PRECISION DEFAULT 0,
    "carbohydrates" DOUBLE PRECISION DEFAULT 0,
    "fat" DOUBLE PRECISION DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredient_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contact_person" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "payment_terms" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_ingredients" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "ingredient_id" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit_of_measure" "UnitOfMeasure" NOT NULL DEFAULT 'grams',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "product_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_step_ingredients" (
    "id" SERIAL NOT NULL,
    "recipe_step_id" INTEGER NOT NULL,
    "ingredient_id" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit_of_measure" "UnitOfMeasure" NOT NULL DEFAULT 'grams',
    "preparation_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_step_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_steps" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "step_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "estimated_time" INTEGER,
    "is_critical" BOOLEAN NOT NULL DEFAULT false,
    "image_url" TEXT,
    "video_url" TEXT,
    "notes" TEXT,
    "required_tools" TEXT[],
    "required_station" TEXT,
    "can_prep_ahead" BOOLEAN NOT NULL DEFAULT false,
    "prep_ahead_instructions" TEXT,
    "hold_time" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipe_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_step_variations" (
    "id" SERIAL NOT NULL,
    "step_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "substitute_ingredients" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipe_step_variations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "reference_code" TEXT NOT NULL,
    "total_products" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "slug" TEXT,
    "shop_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "desks" (
    "id" SERIAL NOT NULL,
    "desk_number" INTEGER NOT NULL,
    "number_of_seats" INTEGER NOT NULL DEFAULT 2,
    "qrcode" TEXT NOT NULL,
    "name" TEXT,
    "section" TEXT DEFAULT 'main',
    "floor" INTEGER DEFAULT 1,
    "position_x" DOUBLE PRECISION,
    "position_y" DOUBLE PRECISION,
    "status" "desk_status" NOT NULL DEFAULT 'free',
    "reservation_time" TIMESTAMP(3),
    "occupation_time" TIMESTAMP(3),
    "customer_id" INTEGER,
    "discount_id" INTEGER,
    "minimum_spend" DOUBLE PRECISION,
    "has_outlets" BOOLEAN NOT NULL DEFAULT false,
    "has_view" BOOLEAN NOT NULL DEFAULT false,
    "is_wheelchair_accessible" BOOLEAN NOT NULL DEFAULT true,
    "shop_id" INTEGER,
    "needs_cleaning" BOOLEAN NOT NULL DEFAULT false,
    "is_under_maintenance" BOOLEAN NOT NULL DEFAULT false,
    "maintenance_notes" TEXT,
    "branch_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "desks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discount_type" "discount_type" NOT NULL DEFAULT 'percentage',
    "discount_value" DECIMAL(10,2) NOT NULL,
    "min_order_amount" DECIMAL(10,2),
    "max_discount" DECIMAL(10,2),
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "usage_limit" INTEGER,
    "per_user_limit" INTEGER DEFAULT 1,
    "times_used" INTEGER NOT NULL DEFAULT 0,
    "shop_id" INTEGER NOT NULL,
    "branch_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_redemptions" (
    "id" SERIAL NOT NULL,
    "coupon_id" INTEGER NOT NULL,
    "order_id" INTEGER,
    "user_id" INTEGER,
    "redeemed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discount_amount" DECIMAL(10,2) NOT NULL,
    "branch_id" INTEGER,

    CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_cards" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "initial_value" DECIMAL(10,2) NOT NULL,
    "current_value" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expiry_date" TIMESTAMP(3),
    "shop_id" INTEGER NOT NULL,
    "branch_id" INTEGER,
    "purchaser_id" INTEGER,
    "recipient_email" TEXT,
    "recipient_name" TEXT,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_card_transactions" (
    "id" SERIAL NOT NULL,
    "gift_card_id" INTEGER NOT NULL,
    "order_id" INTEGER,
    "amount" DECIMAL(10,2) NOT NULL,
    "balance_after" DECIMAL(10,2) NOT NULL,
    "transaction_type" "gift_card_transaction_type" NOT NULL,
    "notes" TEXT,
    "processed_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gift_card_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discounts" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "discount_type" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "coupon_code" TEXT,
    "min_order" DECIMAL(10,2),
    "max_discount" DECIMAL(10,2),
    "usage_limit" INTEGER,
    "times_used" INTEGER NOT NULL DEFAULT 0,
    "customer_eligibility" "CustomerEligibility" NOT NULL DEFAULT 'all',
    "customer_ids" INTEGER[],
    "shop_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_modifier_groups" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "min_selections" INTEGER NOT NULL DEFAULT 1,
    "max_selections" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_modifier_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modifier_groups" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "display_type" "ModifierDisplayType" NOT NULL DEFAULT 'radio',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modifier_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modifiers" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_adjustment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "stock_quantity" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_addon_groups" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_addon_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addon_groups" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addon_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addons" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "sku" TEXT,
    "stock_quantity" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item_modifiers" (
    "id" SERIAL NOT NULL,
    "order_item_id" INTEGER NOT NULL,
    "modifier_id" INTEGER NOT NULL,
    "price_adjustment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_item_modifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item_addons" (
    "id" SERIAL NOT NULL,
    "order_item_id" INTEGER NOT NULL,
    "addon_id" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_item_addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "status" "order_status" NOT NULL DEFAULT 'pending',
    "customer_id" INTEGER,
    "desk_id" INTEGER,
    "order_type" "order_type" NOT NULL,
    "takeaway_pickup_time" TIMESTAMP(3),
    "takeaway_customer_name" TEXT,
    "takeaway_customer_phone" TEXT,
    "delivery_address" TEXT,
    "delivery_landmark" TEXT,
    "delivery_instructions" TEXT,
    "delivery_customer_name" TEXT,
    "delivery_customer_phone" TEXT,
    "estimated_delivery_time" TIMESTAMP(3),
    "actual_delivery_time" TIMESTAMP(3),
    "delivery_fee" DOUBLE PRECISION DEFAULT 0,
    "waiter_id" INTEGER,
    "chef_id" INTEGER,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "service_charge" DOUBLE PRECISION DEFAULT 0,
    "tip_amount" DOUBLE PRECISION DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payment_status" "payment_status" NOT NULL DEFAULT 'unpaid',
    "payment_method" "payment_method",
    "transaction_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "placed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preparation_time" INTEGER,
    "ready_at" TIMESTAMP(3),
    "served_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "dietary_restrictions" TEXT,
    "shop_id" INTEGER NOT NULL,
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "total_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "special_requests" TEXT,
    "variant_options" JSONB,
    "status" "item_status" NOT NULL DEFAULT 'pending',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "applied_discount_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "description" TEXT,
    "short_description" TEXT,
    "calories" DOUBLE PRECISION DEFAULT 0,
    "prepare_time" INTEGER DEFAULT 0,
    "protein" DOUBLE PRECISION,
    "carbohydrates" DOUBLE PRECISION,
    "fat" DOUBLE PRECISION,
    "allergens" TEXT,
    "product_category_id" INTEGER NOT NULL,
    "tax_id" INTEGER,
    "discount_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_retail" BOOLEAN NOT NULL DEFAULT false,
    "sku_number" TEXT,
    "reference_code" TEXT,
    "barcode" TEXT,
    "price" DOUBLE PRECISION,
    "cost_price" DOUBLE PRECISION,
    "pricing_type" "pricing_type" NOT NULL DEFAULT 'fixed',
    "sales_unit_type" "sales_unit_type" NOT NULL DEFAULT 'piece',
    "cost_calculation_unit" "cost_calculation_unit" NOT NULL DEFAULT 'ingredient',
    "stock" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER DEFAULT 5,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "has_variants" BOOLEAN NOT NULL DEFAULT false,
    "shop_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_theme" (
    "id" SERIAL NOT NULL,
    "primary_color" TEXT NOT NULL,
    "secondary_color" TEXT NOT NULL,
    "accent_color" TEXT NOT NULL,
    "text_color" TEXT NOT NULL,
    "background_color" TEXT,
    "background_image" TEXT,
    "shop_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taxes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tax_rate" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "tax_type" "tax_type" NOT NULL DEFAULT 'sales',
    "country" TEXT,
    "state" TEXT,
    "is_compound" BOOLEAN NOT NULL DEFAULT false,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "avatar" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" TIMESTAMP(3),
    "phone_verified_at" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "last_login_ip" TEXT,
    "role_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "branch_id" INTEGER NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT,
    "description" TEXT,
    "is_system_role" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission_groups" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT,
    "description" TEXT,
    "icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permission_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "display_name" TEXT,
    "description" TEXT,
    "guard_name" TEXT NOT NULL DEFAULT 'web',
    "group_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_devices" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "device_id" TEXT NOT NULL,
    "device_name" TEXT,
    "platform" TEXT,
    "fcm_token" TEXT,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "event" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_coupon_user_restrictions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_coupon_user_restrictions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_coupon_product_restrictions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_coupon_product_restrictions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");

-- CreateIndex
CREATE UNIQUE INDEX "branches_slug_key" ON "branches"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "branch_operating_hours_branch_id_day_of_week_key" ON "branch_operating_hours"("branch_id", "day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "branch_menus_branch_id_menu_id_key" ON "branch_menus"("branch_id", "menu_id");

-- CreateIndex
CREATE UNIQUE INDEX "branch_staff_branch_id_user_id_key" ON "branch_staff"("branch_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "branch_inventory_branch_id_product_id_ingredient_id_key" ON "branch_inventory"("branch_id", "product_id", "ingredient_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_code_key" ON "ingredients"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_barcode_key" ON "ingredients"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "product_ingredients_product_id_ingredient_id_key" ON "product_ingredients"("product_id", "ingredient_id");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_steps_product_id_step_number_key" ON "recipe_steps"("product_id", "step_number");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_reference_code_key" ON "product_categories"("reference_code");

-- CreateIndex
CREATE UNIQUE INDEX "desks_desk_number_key" ON "desks"("desk_number");

-- CreateIndex
CREATE UNIQUE INDEX "desks_qrcode_key" ON "desks"("qrcode");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupon_redemptions_coupon_id_user_id_idx" ON "coupon_redemptions"("coupon_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "gift_cards_code_key" ON "gift_cards"("code");

-- CreateIndex
CREATE INDEX "gift_card_transactions_gift_card_id_idx" ON "gift_card_transactions"("gift_card_id");

-- CreateIndex
CREATE UNIQUE INDEX "discounts_coupon_code_key" ON "discounts"("coupon_code");

-- CreateIndex
CREATE UNIQUE INDEX "product_modifier_groups_product_id_group_id_key" ON "product_modifier_groups"("product_id", "group_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_addon_groups_product_id_group_id_key" ON "product_addon_groups"("product_id", "group_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE UNIQUE INDEX "orders_desk_id_key" ON "orders"("desk_id");

-- CreateIndex
CREATE UNIQUE INDEX "shop_theme_shop_id_key" ON "shop_theme"("shop_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_uuid_key" ON "users"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permission_groups_name_key" ON "permission_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_email_idx" ON "password_resets"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_user_id_device_id_key" ON "user_devices"("user_id", "device_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "_coupon_user_restrictions_B_index" ON "_coupon_user_restrictions"("B");

-- CreateIndex
CREATE INDEX "_coupon_product_restrictions_B_index" ON "_coupon_product_restrictions"("B");

-- CreateIndex
CREATE UNIQUE INDEX "shops_shop_theme_id_key" ON "shops"("shop_theme_id");

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_operating_hours" ADD CONSTRAINT "branch_operating_hours_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_menus" ADD CONSTRAINT "branch_menus_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_staff" ADD CONSTRAINT "branch_staff_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_terminals" ADD CONSTRAINT "pos_terminals_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_inventory" ADD CONSTRAINT "branch_inventory_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_inventory" ADD CONSTRAINT "branch_inventory_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ingredient_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_step_ingredients" ADD CONSTRAINT "recipe_step_ingredients_recipe_step_id_fkey" FOREIGN KEY ("recipe_step_id") REFERENCES "recipe_steps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_step_ingredients" ADD CONSTRAINT "recipe_step_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_step_variations" ADD CONSTRAINT "recipe_step_variations_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "recipe_steps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desks" ADD CONSTRAINT "desks_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desks" ADD CONSTRAINT "desks_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desks" ADD CONSTRAINT "desks_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_purchaser_id_fkey" FOREIGN KEY ("purchaser_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_card_transactions" ADD CONSTRAINT "gift_card_transactions_gift_card_id_fkey" FOREIGN KEY ("gift_card_id") REFERENCES "gift_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_card_transactions" ADD CONSTRAINT "gift_card_transactions_processed_by_id_fkey" FOREIGN KEY ("processed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_modifier_groups" ADD CONSTRAINT "product_modifier_groups_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_modifier_groups" ADD CONSTRAINT "product_modifier_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "modifier_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifiers" ADD CONSTRAINT "modifiers_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "modifier_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_addon_groups" ADD CONSTRAINT "product_addon_groups_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_addon_groups" ADD CONSTRAINT "product_addon_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "addon_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addons" ADD CONSTRAINT "addons_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "addon_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_modifiers" ADD CONSTRAINT "order_item_modifiers_modifier_id_fkey" FOREIGN KEY ("modifier_id") REFERENCES "modifiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_addons" ADD CONSTRAINT "order_item_addons_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_addons" ADD CONSTRAINT "order_item_addons_addon_id_fkey" FOREIGN KEY ("addon_id") REFERENCES "addons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_desk_id_fkey" FOREIGN KEY ("desk_id") REFERENCES "desks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_applied_discount_id_fkey" FOREIGN KEY ("applied_discount_id") REFERENCES "discounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_product_category_id_fkey" FOREIGN KEY ("product_category_id") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_tax_id_fkey" FOREIGN KEY ("tax_id") REFERENCES "taxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_shop_theme_id_fkey" FOREIGN KEY ("shop_theme_id") REFERENCES "shop_theme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "permission_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_coupon_user_restrictions" ADD CONSTRAINT "_coupon_user_restrictions_A_fkey" FOREIGN KEY ("A") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_coupon_user_restrictions" ADD CONSTRAINT "_coupon_user_restrictions_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_coupon_product_restrictions" ADD CONSTRAINT "_coupon_product_restrictions_A_fkey" FOREIGN KEY ("A") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_coupon_product_restrictions" ADD CONSTRAINT "_coupon_product_restrictions_B_fkey" FOREIGN KEY ("B") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
