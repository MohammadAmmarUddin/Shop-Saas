require("dotenv").config();
const bcrypt = require("bcryptjs");
const prisma = require("../prisma");
const logger = require("./logger");

async function seed() {
  try {
    await prisma.$connect();
    logger.info("Database connected");

    const planCount = await prisma.subscriptionPlan.count();
    if (planCount === 0) {
      await prisma.subscriptionPlan.createMany({
        data: [
          {
            name: "Free",
            slug: "free",
            description: "For small stores just getting started",
            price_monthly: 0,
            price_yearly: 0,
            max_products: 100,
            max_staff: 2,
            features: JSON.stringify([
              "Basic reporting",
              "Product management",
              "Sales management",
              "Customer management",
            ]),
            is_active: true,
            sort_order: 0,
          },
          {
            name: "Basic",
            slug: "basic",
            description: "For growing businesses",
            price_monthly: 29.99,
            price_yearly: 299.99,
            max_products: 1000,
            max_staff: 10,
            features: JSON.stringify([
              "Advanced reporting",
              "Inventory management",
              "Supplier management",
              "Purchase management",
              "Expense tracking",
              "Email notifications",
            ]),
            is_active: true,
            sort_order: 1,
          },
          {
            name: "Pro",
            slug: "pro",
            description: "For established businesses with advanced needs",
            price_monthly: 79.99,
            price_yearly: 799.99,
            max_products: 10000,
            max_staff: 50,
            features: JSON.stringify([
              "All Basic features",
              "Pharmacy management",
              "Prescription handling",
              "Barcode printing",
              "Multi-warehouse",
              "API access",
              "Priority support",
              "Custom reports",
            ]),
            is_active: true,
            sort_order: 2,
          },
        ],
      });
      logger.info("Subscription plans seeded");
    } else {
      logger.info("Subscription plans already exist, skipping");
    }

    const adminExists = await prisma.user.findFirst({
      where: { email: "admin@shopmanager.com" },
    });
    if (!adminExists) {
      const password = await bcrypt.hash("admin123456", 12);

      const adminStore = await prisma.store.create({
        data: {
          name: "ShopManager Admin",
          slug: "shopmanager-admin",
          email: "admin@shopmanager.com",
          status: "active",
          max_products: 999999,
          max_staff: 999,
        },
      });

      await prisma.user.create({
        data: {
          store_id: adminStore.id,
          name: "Super Admin",
          email: "admin@shopmanager.com",
          password,
          role: "super_admin",
          status: "active",
        },
      });

      const freePlan = await prisma.subscriptionPlan.findFirst({
        where: { slug: "free" },
      });
      if (freePlan) {
        await prisma.subscription.create({
          data: {
            store_id: adminStore.id,
            plan_id: freePlan.id,
            status: "active",
            start_date: new Date(),
          },
        });
      }

      logger.info(
        "Admin user seeded (email: admin@shopmanager.com, password: admin123456)",
      );
    } else {
      logger.info("Admin user already exists, skipping");
    }

    const gatewayCount = await prisma.paymentGateway.count();
    if (gatewayCount === 0) {
      await prisma.paymentGateway.createMany({
        data: [
          {
            slug: 'bkash',
            name: 'bKash',
            type: 'mobile_banking',
            instructions: 'Send payment to the bKash number below, then submit your transaction ID.',
            config: { number: '01XXXXXXXXX', account_type: 'Merchant' },
            is_active: true,
            sort_order: 0,
          },
          {
            slug: 'bank',
            name: 'Bank Transfer',
            type: 'bank',
            instructions: 'Transfer the amount to the bank account below, then submit the transaction reference.',
            config: {
              account_name: 'ShopManager Inc.',
              account_number: 'XXXX-XXXX-XXXX',
              bank_name: 'Example Bank',
              routing_number: 'XXXXXXXXX',
            },
            is_active: true,
            sort_order: 1,
          },
        ],
      });
      logger.info('Payment gateways seeded');
    } else {
      logger.info('Payment gateways already exist, skipping');
    }

    await prisma.$disconnect();
    logger.info("Seeding completed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("Seeding failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seed();
