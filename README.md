# ShopManager - Multi-Tenant SaaS Grocery & Pharmacy Management System

A complete, production-ready SaaS-based point-of-sale (POS) and inventory management system for grocery stores and pharmacies. Built with Node.js, MySQL, React, and Tailwind CSS.

## Features

### POS & Sales
- Point of Sale system with barcode scanning
- Invoice and receipt generation with PDF/print support
- Multiple payment methods (cash, card, mobile, bank, credit)
- Customer management with loyalty points and due tracking
- Discount management (percentage and fixed)

### Inventory Management
- Product catalog with categories and subcategories
- Barcode generation and scanning (EAN13, EAN8, UPC-A, Code128, Code39, QR)
- Stock tracking with low-stock alerts
- Batch number and expiry date tracking (pharmacy)
- Prescription management for pharmaceutical products

### Purchases & Suppliers
- Purchase order management
- Supplier management with balance tracking
- Automatic stock updates on purchase receipt

### Financial Management
- Expense tracking with categories
- Payment management
- Profit/Loss analysis
- Daily, weekly, monthly, yearly reports

### SaaS Features
- Multi-tenant architecture (shared database, tenant isolation)
- Subscription plans with feature limitations
- Free trial system
- Tenant-specific branding (logo, colors)
- Centralized super admin dashboard
- Subdomain support

### Administration
- Role-based access control (Super Admin, Store Owner, Manager, Employee)
- Employee management with granular permissions
- System-wide analytics
- Backup and restore system
- Activity logging
- Real-time notifications

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MySQL 8.0
- **ORM**: Sequelize
- **Auth**: JWT with refresh tokens
- **Other**: Socket.IO, PDFKit, Sharp, Winston

### Frontend
- **Framework**: React 18
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Charts**: Chart.js with react-chartjs-2
- **State**: React Context API
- **HTTP**: Axios

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx
- **Database**: MySQL 8.0

## Project Structure

```
shopmanager/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, logger, socket config
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── models/          # Sequelize models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helper functions
│   │   └── validators/      # Joi validation schemas
│   ├── uploads/
│   └── logs/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React context providers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Route pages
│   │   ├── services/        # API service layer
│   │   └── utils/           # Utilities & constants
│   └── package.json
├── database/
│   └── schema.sql           # Database schema
├── docker/
│   ├── docker-compose.yml   # Docker services
│   ├── Dockerfile.backend   # Backend container
│   ├── Dockerfile.frontend  # Frontend container
│   └── nginx.conf           # Nginx configuration
└── docs/
    └── api.md               # API documentation
```

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0
- npm or yarn

### Installation

1. **Clone the repository**
2. **Set up the database**
   ```bash
   mysql -u root -p < database/schema.sql
   ```

3. **Backend setup**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   npm install
   npm run seed
   npm run dev
   ```

4. **Frontend setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:5000/api
   - Default admin: admin@shopmanager.com / admin123

### Docker Setup
```bash
docker-compose -f docker/docker-compose.yml up -d
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| NODE_ENV | Environment | production |
| PORT | API port | 5000 |
| DB_HOST | MySQL host | localhost |
| DB_PORT | MySQL port | 3306 |
| DB_NAME | Database name | shopmanager |
| DB_USER | Database user | root |
| DB_PASSWORD | Database password | - |
| JWT_SECRET | JWT signing secret | - |
| JWT_REFRESH_SECRET | Refresh token secret | - |
| CORS_ORIGIN | Allowed CORS origin | http://localhost:3000 |

## Subscription Plans

| Plan | Price/mo | Products | Staff | Features |
|---|---|---|---|---|
| Free | $0 | 100 | 2 | POS, Reports, Inventory |
| Starter | $19.99 | 1,000 | 5 | + Barcode, Backup |
| Professional | $49.99 | 5,000 | 15 | + Multi-store, API |
| Enterprise | $99.99 | Unlimited | Unlimited | + Custom domain, All features |

## API Documentation

See [docs/api.md](docs/api.md) for full API documentation.

## Cost Optimization

This system is designed to run on low-cost VPS servers ($5-10/month):

- **Database**: Shared MySQL with connection pooling and query optimization
- **Caching**: Efficient database indexing reduces query times
- **Assets**: On-demand image resizing, CDN-ready
- **Background Jobs**: Cron-based scheduled tasks
- **Containerization**: Lightweight Alpine-based containers
- **SSL**: Free Let's Encrypt via certbot

### Recommended Hosting
- **DigitalOcean**: $6/month basic droplet
- **Linode**: $5/month Nanode
- **Hetzner**: $4.49/month CX22
- **AWS**: t3a.nano (~$4/month)

## License

MIT
# Shop-Saas
