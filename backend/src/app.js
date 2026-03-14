const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');

const authRouter = require('./modules/auth/auth.routes');
const usersRouter = require('./modules/users/users.routes');
const categoriesRouter = require('./modules/catalog/categories.routes');
const productsRouter = require('./modules/catalog/products.routes');
const warehousesRouter = require('./modules/warehouses/warehouses.routes');
const stockRouter = require('./modules/warehouses/stock.routes');
const movementsRouter = require('./modules/movements/movements.routes');
const suppliersRouter = require('./modules/suppliers/suppliers.routes');
const purchaseOrdersRouter = require('./modules/purchase-orders/purchase-orders.routes');
const grnRouter = require('./modules/grn/grn.routes');
const pickListsRouter = require('./modules/pick-lists/pick-lists.routes');
const stockCountsRouter = require('./modules/stock-counts/stock-counts.routes');
const dashboardRouter = require('./modules/dashboard/dashboard.routes');
const reportsRouter = require('./modules/reports/reports.routes');
const auditRouter = require('./modules/audit/audit.routes');
const integrationsRouter = require('./modules/integrations/integrations.routes');

const { authMiddleware } = require('./middleware/auth');

const app = express();

app.use(express.json());
app.use(cors({ origin: config.cors.origins, credentials: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many requests', code: 'RATE_LIMIT' },
});
app.use('/api/v1/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 })); // stricter for auth
app.use(limiter);

app.get('/', (req, res) => {
  const accept = req.get('accept') || '';
  if (accept.includes('application/json')) {
    return res.json({
      name: 'IMS Backend',
      description: 'Inventory Management System API',
      version: '1.0',
      docs: { health: '/health', api: '/api/v1', login: 'POST /api/v1/auth/login' },
    });
  }
  res.type('html').send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IMS Backend</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; max-width: 560px; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; line-height: 1.5; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #444; margin: 0.5rem 0; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
    ul { margin: 1rem 0; padding-left: 1.25rem; }
    code { background: #f0f0f0; padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>IMS Backend</h1>
  <p>Inventory Management System API — centralized, real-time, role-based.</p>
  <ul>
    <li><a href="/health">Health check</a> — <code>GET /health</code></li>
    <li>API base — <code>/api/v1</code> (auth, products, stock, GRN, pick lists, dashboard, reports, etc.)</li>
    <li>Login — <code>POST /api/v1/auth/login</code> with <code>{"email":"manager@ims.test","password":"password123"}</code></li>
  </ul>
  <p>Use Postman, curl, or a frontend app to call the API. All protected routes require <code>Authorization: Bearer &lt;token&gt;</code>.</p>
</body>
</html>`);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', authMiddleware, usersRouter);
app.use('/api/v1/categories', authMiddleware, categoriesRouter);
app.use('/api/v1/products', authMiddleware, productsRouter);
app.use('/api/v1/warehouses', authMiddleware, warehousesRouter);
app.use('/api/v1/stock', authMiddleware, stockRouter);
app.use('/api/v1/movements', authMiddleware, movementsRouter);
app.use('/api/v1/suppliers', authMiddleware, suppliersRouter);
app.use('/api/v1/purchase-orders', authMiddleware, purchaseOrdersRouter);
app.use('/api/v1/grn', authMiddleware, grnRouter);
app.use('/api/v1/pick-lists', authMiddleware, pickListsRouter);
app.use('/api/v1/stock-counts', authMiddleware, stockCountsRouter);
app.use('/api/v1/dashboard', authMiddleware, dashboardRouter);
app.use('/api/v1/reports', authMiddleware, reportsRouter);
app.use('/api/v1/audit-logs', authMiddleware, auditRouter);
app.use('/api/v1/integrations', authMiddleware, integrationsRouter);

app.use(errorHandler);

module.exports = app;
