-- CreateTable
CREATE TABLE `manual_payments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `store_id` BIGINT UNSIGNED NOT NULL,
    `subscription_id` BIGINT UNSIGNED NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `payment_method` VARCHAR(50) NOT NULL,
    `transaction_id` VARCHAR(100) NULL,
    `sender_identifier` VARCHAR(50) NULL,
    `notes` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `admin_notes` TEXT NULL,
    `approved_at` DATETIME(0) NULL,
    `approved_by` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `idx_mp_store`(`store_id`),
    INDEX `idx_mp_subscription`(`subscription_id`),
    INDEX `idx_mp_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `manual_payments` ADD CONSTRAINT `fk_mp_store` FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `manual_payments` ADD CONSTRAINT `fk_mp_subscription` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `manual_payments` ADD CONSTRAINT `fk_mp_approved` FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
