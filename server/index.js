const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Import routes
const subscriptionRoutes = require('./routes/subscriptions');
const billingRoutes = require('./routes/billing');
const uploadRoutes = require('./routes/upload');
const analyticsRoutes = require('./routes/analytics');
const reportsRoutes = require('./routes/reports');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({ 
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Subscription Management API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      subscriptions: '/api/subscriptions',
      billing: '/api/billing',
      upload: '/api/upload',
      analytics: '/api/analytics',
      reports: '/api/reports'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    routes: [
      'GET /',
      'GET /api/health',
      // Subscriptions
      'GET /api/subscriptions/:userId',
      'POST /api/subscriptions',
      'PUT /api/subscriptions/:id',
      'DELETE /api/subscriptions/:id',
      'POST /api/subscriptions/:id/toggle',
      'GET /api/subscriptions/:userId/calendar/:year/:month',
      // Billing
      'POST /api/billing/calculate-next-date',
      'GET /api/billing/preview/:startDate/:billingCycle',
      // Upload
      'POST /api/upload/logo',
      'DELETE /api/upload/logo/:fileName',
      'GET /api/upload/logos',
      // Analytics
      'GET /api/analytics/:userId/summary',
      'GET /api/analytics/:userId/categories',
      'GET /api/analytics/:userId/trends',
      'GET /api/analytics/:userId/upcoming',
      'GET /api/analytics/:userId/expensive',
      'GET /api/analytics/:userId/insights',
      // Reports
      'GET /api/reports/:userId/export',
      'GET /api/analytics/:userId/comparison'
    ]
  });
});

// API Routes
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The route ${req.method} ${req.originalUrl} does not exist`
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`🚀 Subscription Management API is running on http://localhost:${port}`);
  console.log(`📊 Health check available at http://localhost:${port}/api/health`);
  console.log(`🔗 CORS enabled for: ${process.env.FRONTEND_URL}`);
});
