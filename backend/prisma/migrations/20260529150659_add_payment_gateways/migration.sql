-- CreateTable
CREATE TABLE `payment_gateways` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `instructions` TEXT NULL,
    `config` JSON NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `sort_order` INTEGER NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `payment_gateways_slug_key`(`slug`),
    INDEX `idx_pg_active`(`is_active`),
    INDEX `idx_pg_slug`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
