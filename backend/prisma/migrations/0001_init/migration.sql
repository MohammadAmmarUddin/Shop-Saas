-- CreateTable
CREATE TABLE `stores` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `address` TEXT NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `postal_code` VARCHAR(20) NULL,
    `country` VARCHAR(100) NULL DEFAULT 'US',
    `logo` VARCHAR(255) NULL,
    `currency` VARCHAR(10) NULL DEFAULT 'USD',
    `timezone` VARCHAR(50) NULL DEFAULT 'UTC',
    `tax_rate` DECIMAL(5, 2) NULL DEFAULT 0.00,
    `tax_id` VARCHAR(50) NULL,
    `receipt_footer` TEXT NULL,
    `receipt_header` TEXT NULL,
    `default_language` VARCHAR(10) NULL DEFAULT 'en',
    `date_format` VARCHAR(20) NULL DEFAULT 'YYYY-MM-DD',
    `is_active` BOOLEAN NULL DEFAULT true,
    `status` ENUM('active', 'inactive', 'suspended', 'trial') NULL DEFAULT 'trial',
    `trial_ends_at` DATETIME(0) NULL,
    `subscription_ends_at` DATETIME(0) NULL,
    `max_products` INTEGER NULL DEFAULT 100,
    `max_staff` INTEGER NULL DEFAULT 2,
    `domain` VARCHAR(255) NULL,
    `subdomain` VARCHAR(100) NULL,
    `settings` JSON NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `stores_slug_key`(`slug`),
    UNIQUE INDEX `stores_email_key`(`email`),
    UNIQUE INDEX `stores_domain_key`(`domain`),
    UNIQUE INDEX `stores_subdomain_key`(`subdomain`),
    INDEX `idx_stores_email`(`email`),
    INDEX `idx_stores_status`(`status`),
    INDEX `idx_stores_subdomain`(`subdomain`),
    INDEX `idx_stores_slug`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `store_id` BIGINT UNSIGNED NULL,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `avatar` VARCHAR(255) NULL,
    `role` ENUM('super_admin', 'store_owner', 'manager', 'employee') NULL DEFAULT 'employee',
    `permissions` JSON NULL,
    `status` ENUM('active', 'inactive', 'suspended') NULL DEFAULT 'active',
    `email_verified_at` DATETIME(0) NULL,
    `last_login_at` DATETIME(0) NULL,
    `refresh_token` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_users_store`(`store_id`),
    INDEX `idx_users_email`(`email`),
    INDEX `idx_users_role`(`role`),
    UNIQUE INDEX `idx_users_store_email`(`store_id`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscription_plans` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `price_monthly` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `price_yearly` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `max_products` INTEGER NULL DEFAULT 100,
    `max_staff` INTEGER NULL DEFAULT 2,
    `max_stores` INTEGER NULL DEFAULT 1,
    `features` JSON NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `sort_order` INTEGER NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `subscription_plans_slug_key`(`slug`),
    INDEX `idx_plans_slug`(`slug`),
    INDEX `idx_plans_active`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscriptions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `store_id` BIGINT UNSIGNED NOT NULL,
    `plan_id` BIGINT UNSIGNED NOT NULL,
    `status` ENUM('active', 'inactive', 'past_due', 'cancelled', 'expired', 'trial') NULL DEFAULT 'trial',
    `billing_cycle` ENUM('monthly', 'yearly') NULL DEFAULT 'monthly',
    `started_at` DATETIME(0) NULL,
    `trial_ends_at` DATETIME(0) NULL,
    `current_period_ends_at` DATETIME(0) NULL,
    `cancelled_at` DATETIME(0) NULL,
    `payment_method` VARCHAR(50) NULL,
    `payment_details` JSON NULL,
    `auto_renew` BOOLEAN NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_sub_store`(`store_id`),
    INDEX `idx_sub_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `store_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `parent_id` BIGINT UNSIGNED NULL,
    `sort_order` INTEGER NULL DEFAULT 0,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_cat_store`(`store_id`),
    UNIQUE INDEX `idx_cat_store_slug`(`store_id`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `store_id` BIGINT UNSIGNED NOT NULL,
    `category_id` BIGINT UNSIGNED NULL,
    `name` VARCHAR(200) NOT NULL,
    `slug` VARCHAR(200) NOT NULL,
    `sku` VARCHAR(50) NULL,
    `barcode` VARCHAR(100) NULL,
    `barcode_type` ENUM('ean13', 'ean8', 'upca', 'upce', 'code128', 'code39', 'qrcode') NULL DEFAULT 'code128',
    `description` TEXT NULL,
    `purchase_price` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `selling_price` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `wholesale_price` DECIMAL(12, 2) NULL,
    `discount_price` DECIMAL(12, 2) NULL,
    `stock_quantity` DECIMAL(12, 3) NULL DEFAULT 0,
    `low_stock_threshold` DECIMAL(12, 3) NULL DEFAULT 10,
    `unit` VARCHAR(20) NULL DEFAULT 'pcs',
    `tax_percentage` DECIMAL(5, 2) NULL DEFAULT 0.00,
    `images` JSON NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `is_featured` BOOLEAN NULL DEFAULT false,
    `track_stock` BOOLEAN NULL DEFAULT true,
    `type` ENUM('good', 'service') NULL DEFAULT 'good',
    `expiry_date` DATE NULL,
    `manufacturer` VARCHAR(200) NULL,
    `batch_number` VARCHAR(50) NULL,
    `requires_prescription` BOOLEAN NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_prod_store`(`store_id`),
    INDEX `idx_prod_category`(`category_id`),
    INDEX `idx_prod_barcode`(`barcode`),
    INDEX `idx_prod_sku`(`sku`),
    INDEX `idx_prod_name`(`name`),
    INDEX `idx_prod_stock`(`stock_quantity`),
    INDEX `idx_prod_active`(`is_active`),
    UNIQUE INDEX `idx_prod_store_slug`(`store_id`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `store_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NULL,
    `phone` VARCHAR(20) NULL,
    `address` TEXT NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `postal_code` VARCHAR(20) NULL,
    `total_purchases` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `total_paid` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `balance` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `loyalty_points` INTEGER NULL DEFAULT 0,
    `notes` TEXT NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_cust_store`(`store_id`),
    INDEX `idx_cust_phone`(`phone`),
    INDEX `idx_cust_email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `suppliers` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `store_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `company` VARCHAR(200) NULL,
    `email` VARCHAR(100) NULL,
    `phone` VARCHAR(20) NULL,
    `address` TEXT NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `postal_code` VARCHAR(20) NULL,
    `total_purchases` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `total_paid` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `balance` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `notes` TEXT NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_supp_store`(`store_id`),
    INDEX `idx_supp_phone`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `store_id` BIGINT UNSIGNED NOT NULL,
    `invoice_number` VARCHAR(50) NOT NULL,
    `customer_id` BIGINT UNSIGNED NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `subtotal` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `discount_type` ENUM('percentage', 'fixed') NULL,
    `discount_value` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `discount_amount` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `tax_amount` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `shipping_cost` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `total_amount` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `paid_amount` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `due_amount` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `payment_status` ENUM('paid', 'partial', 'unpaid', 'refunded') NULL DEFAULT 'unpaid',
    `payment_method` ENUM('cash', 'card', 'mobile_payment', 'bank_transfer', 'credit', 'other') NULL DEFAULT 'cash',
    `status` ENUM('completed', 'pending', 'cancelled', 'refunded', 'on_hold') NULL DEFAULT 'completed',
    `notes` TEXT NULL,
    `prescription_id` VARCHAR(50) NULL,
    `is_pharmacy` BOOLEAN NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_sale_store`(`store_id`),
    INDEX `idx_sale_customer`(`customer_id`),
    INDEX `idx_sale_user`(`user_id`),
    INDEX `idx_sale_invoice`(`invoice_number`),
    INDEX `idx_sale_status`(`status`),
    INDEX `idx_sale_created`(`created_at`),
    INDEX `idx_sale_payment_status`(`payment_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sale_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `sale_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `quantity` DECIMAL(12, 3) NOT NULL DEFAULT 1,
    `unit_price` DECIMAL(12, 2) NOT NULL,
    `discount_percentage` DECIMAL(5, 2) NULL DEFAULT 0.00,
    `discount_amount` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `tax_percentage` DECIMAL(5, 2) NULL DEFAULT 0.00,
    `tax_amount` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `total` DECIMAL(12, 2) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_si_sale`(`sale_id`),
    INDEX `idx_si_product`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchases` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `store_id` BIGINT UNSIGNED NOT NULL,
    `purchase_number` VARCHAR(50) NOT NULL,
    `supplier_id` BIGINT UNSIGNED NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `subtotal` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `discount_amount` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `tax_amount` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `shipping_cost` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `total_amount` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `paid_amount` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `due_amount` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `payment_status` ENUM('paid', 'partial', 'unpaid', 'refunded') NULL DEFAULT 'unpaid',
    `status` ENUM('received', 'pending', 'cancelled', 'partial') NULL DEFAULT 'pending',
    `notes` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_purch_store`(`store_id`),
    INDEX `idx_purch_supplier`(`supplier_id`),
    INDEX `idx_purch_number`(`purchase_number`),
    INDEX `idx_purch_status`(`status`),
    INDEX `idx_purch_created`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `purchase_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `quantity` DECIMAL(12, 3) NOT NULL DEFAULT 1,
    `unit_cost` DECIMAL(12, 2) NOT NULL,
    `discount_amount` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `tax_percentage` DECIMAL(5, 2) NULL DEFAULT 0.00,
    `tax_amount` DECIMAL(12, 2) NULL DEFAULT 0.00,
    `total` DECIMAL(12, 2) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_pi_purchase`(`purchase_id`),
    INDEX `idx_pi_product`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `store_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `category` VARCHAR(100) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `description` TEXT NULL,
    `reference_number` VARCHAR(50) NULL,
    `expense_date` DATE NOT NULL,
    `payment_method` ENUM('cash', 'card', 'mobile', 'bank', 'other') NULL DEFAULT 'cash',
    `is_recurring` BOOLEAN NULL DEFAULT false,
    `recurring_frequency` ENUM('daily', 'weekly', 'monthly', 'yearly') NULL,
    `recurring_end_date` DATE NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_exp_store`(`store_id`),
    INDEX `idx_exp_category`(`category`),
    INDEX `idx_exp_date`(`expense_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `store_id` BIGINT UNSIGNED NOT NULL,
    `sale_id` BIGINT UNSIGNED NULL,
    `purchase_id` BIGINT UNSIGNED NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `payment_method` ENUM('cash', 'card', 'mobile_payment', 'bank_transfer', 'credit', 'other') NULL DEFAULT 'cash',
    `reference_number` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `payment_date` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_pay_store`(`store_id`),
    INDEX `idx_pay_sale`(`sale_id`),
    INDEX `idx_pay_purchase`(`purchase_id`),
    INDEX `idx_pay_date`(`payment_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `store_id` BIGINT UNSIGNED NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(50) NULL,
    `entity_id` BIGINT UNSIGNED NULL,
    `description` TEXT NULL,
    `metadata` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_al_store`(`store_id`),
    INDEX `idx_al_user`(`user_id`),
    INDEX `idx_al_action`(`action`),
    INDEX `idx_al_created`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `store_id` BIGINT UNSIGNED NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `type` VARCHAR(50) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `message` TEXT NULL,
    `data` JSON NULL,
    `is_read` BOOLEAN NULL DEFAULT false,
    `read_at` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_notif_store`(`store_id`),
    INDEX `idx_notif_user`(`user_id`),
    INDEX `idx_notif_read`(`is_read`),
    INDEX `idx_notif_created`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `backups` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `store_id` BIGINT UNSIGNED NULL,
    `filename` VARCHAR(255) NOT NULL,
    `filepath` VARCHAR(500) NOT NULL,
    `file_size` BIGINT NULL DEFAULT 0,
    `type` ENUM('full', 'store', 'manual', 'scheduled') NULL DEFAULT 'manual',
    `status` ENUM('pending', 'completed', 'failed') NULL DEFAULT 'pending',
    `notes` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_backup_store`(`store_id`),
    INDEX `idx_backup_created`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `fk_user_store` FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `fk_sub_store` FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `fk_sub_plan` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `fk_cat_store` FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `fk_prod_store` FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `fk_prod_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customers` ADD CONSTRAINT `fk_cust_store` FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `suppliers` ADD CONSTRAINT `fk_supp_store` FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `fk_sale_store` FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `fk_sale_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `fk_sale_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_items` ADD CONSTRAINT `fk_si_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_items` ADD CONSTRAINT `fk_si_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `fk_purch_store` FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `fk_purch_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `fk_purch_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_items` ADD CONSTRAINT `fk_pi_purchase` FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_items` ADD CONSTRAINT `fk_pi_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `fk_exp_store` FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `fk_exp_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `fk_pay_store` FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `fk_pay_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `fk_pay_purchase` FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `fk_al_store` FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `fk_al_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `fk_notif_store` FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `backups` ADD CONSTRAINT `fk_backup_store` FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

