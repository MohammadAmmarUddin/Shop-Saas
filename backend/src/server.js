require('dotenv').config();
BigInt.prototype.toJSON = function () { return this.toString(); };
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const prismaModule = require('./lib/prisma');
const prisma = prismaModule;
const { connectWithRetry, disconnect } = prismaModule;
const logger = require('./config/logger');
const { setIO } = require('./config/socket');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const storeRoutes = require('./routes/stores');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const customerRoutes = require('./routes/customers');
const supplierRoutes = require('./routes/suppliers');
const saleRoutes = require('./routes/sales');
const purchaseRoutes = require('./routes/purchases');
const expenseRoutes = require('./routes/expenses');
const paymentRoutes = require('./routes/payments');
const reportRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');
const subscriptionRoutes = require('./routes/subscriptions');
const backupRoutes = require('./routes/backup');
const notificationRoutes = require('./routes/notifications');
const tenantRoutes = require('./routes/tenants');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN, methods: ['GET', 'POST'] },
});
setIO(io);

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  socket.on('join_store', (storeId) => {
    socket.join(`store:${storeId}`);
  });
  socket.on('join_user', (userId) => {
    socket.join(`user:${userId}`);
  });
  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/tenants', tenantRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
let serverInstance = null;
let shuttingDown = false;

async function start() {
  try {
    logger.info('Connecting to database...');
    await connectWithRetry();
    logger.info('Database connected successfully');
    console.log('✓ Database connected successfully');

    await ensureDefaultSubscriptionPlan();
    logger.info('Default subscription plan ensured');

    serverInstance = server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`✓ Backend running at http://localhost:${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    console.error('✗ Failed to start server:', error.message);
    process.exit(1);
  }
}

async function ensureDefaultSubscriptionPlan() {
  const freePlan = await prisma.subscriptionPlan.findFirst({ where: { slug: 'free' } });
  if (!freePlan) {
    await prisma.subscriptionPlan.create({
      data: {
        name: 'Free',
        slug: 'free',
        description: 'Free plan for trial users',
        price_monthly: 0,
        price_yearly: 0,
        max_products: 100,
        max_staff: 2,
        is_active: true,
        sort_order: 0,
      },
    });
    logger.info('Created default "free" subscription plan');
  }
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info(`${signal} received. Shutting down gracefully...`);

  const closeServer = serverInstance
    ? new Promise((resolve) => serverInstance.close(resolve))
    : Promise.resolve();

  try {
    await Promise.race([
      closeServer,
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]);
  } catch (error) {
    logger.warn({ message: 'Server close encountered an error', error: error.message });
  }

  try {
    await disconnect();
  } catch (error) {
    logger.warn({ message: 'Prisma disconnect encountered an error', error: error.message });
  }

  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();

module.exports = { app, io };
