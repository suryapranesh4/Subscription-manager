const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Function to get supabase client
const getSupabase = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }
  
  const supabase = getSupabase();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  const authenticatedSupabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
  
  req.user = user;
  req.supabase = authenticatedSupabase;
  next();
};

// Helper function to normalize costs to monthly
const normalizeToMonthly = (cost, billingCycle) => {
  switch (billingCycle?.toLowerCase()) {
    case 'yearly':
      return cost / 12;
    case 'weekly':
      return cost * 4.33; // Average weeks per month
    case 'monthly':
    default:
      return cost;
  }
};

// Helper function to format currency
const formatCurrency = (amount) => {
  return Math.round(amount * 100) / 100;
};

// GET /api/reports/:userId/export - Export subscription data
router.get('/:userId/export', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const format = req.query.format || 'json';
    
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get all subscriptions
    const { data: subscriptions, error: subsError } = await req.supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (subsError) {
      return res.status(400).json({ error: subsError.message });
    }
    
    // Get all payments
    const { data: payments, error: paymentsError } = await req.supabase
      .from('subscription_payments')
      .select(`
        *,
        subscriptions!inner(name, category)
      `)
      .order('payment_date', { ascending: false });
    
    // Calculate analytics
    const activeSubscriptions = subscriptions.filter(sub => sub.is_active);
    const totalMonthly = activeSubscriptions.reduce((sum, sub) => 
      sum + normalizeToMonthly(sub.cost, sub.billing_cycle), 0);
    
    const exportData = {
      exportInfo: {
        userId,
        exportDate: new Date().toISOString(),
        format,
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: activeSubscriptions.length,
        totalMonthlySpending: formatCurrency(totalMonthly)
      },
      subscriptions: subscriptions.map(sub => ({
        ...sub,
        monthlyCost: formatCurrency(normalizeToMonthly(sub.cost, sub.billing_cycle)),
        yearlyCost: formatCurrency(normalizeToMonthly(sub.cost, sub.billing_cycle) * 12)
      })),
      payments: paymentsError ? [] : payments,
      summary: {
        categories: {},
        billingCycles: {},
        monthlySpending: totalMonthly
      }
    };
    
    // Calculate category breakdown
    activeSubscriptions.forEach(sub => {
      const category = sub.category || 'Uncategorized';
      const monthlyCost = normalizeToMonthly(sub.cost, sub.billing_cycle);
      
      if (!exportData.summary.categories[category]) {
        exportData.summary.categories[category] = {
          count: 0,
          monthlyTotal: 0,
          subscriptions: []
        };
      }
      
      exportData.summary.categories[category].count += 1;
      exportData.summary.categories[category].monthlyTotal += monthlyCost;
      exportData.summary.categories[category].subscriptions.push(sub.name);
    });
    
    // Calculate billing cycle breakdown
    activeSubscriptions.forEach(sub => {
      const cycle = sub.billing_cycle || 'monthly';
      exportData.summary.billingCycles[cycle] = (exportData.summary.billingCycles[cycle] || 0) + 1;
    });
    
    // Format currency in summary
    Object.keys(exportData.summary.categories).forEach(category => {
      exportData.summary.categories[category].monthlyTotal = 
        formatCurrency(exportData.summary.categories[category].monthlyTotal);
    });
    
    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = [
        'Name', 'Category', 'Cost', 'Billing Cycle', 'Monthly Cost', 
        'Next Payment', 'Status', 'Start Date', 'Created At'
      ];
      
      const csvRows = subscriptions.map(sub => [
        sub.name,
        sub.category || 'Uncategorized',
        sub.cost,
        sub.billing_cycle,
        formatCurrency(normalizeToMonthly(sub.cost, sub.billing_cycle)),
        sub.next_payment_date,
        sub.is_active ? 'Active' : 'Inactive',
        sub.start_date,
        sub.created_at
      ]);
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="subscriptions-${userId}-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csvContent);
    }
    
    // Default JSON format
    res.setHeader('Content-Type', 'application/json');
    if (req.query.download === 'true') {
      res.setHeader('Content-Disposition', `attachment; filename="subscriptions-${userId}-${new Date().toISOString().split('T')[0]}.json"`);
    }
    
    res.json(exportData);
    
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Server error during export' });
  }
});

// GET /api/analytics/:userId/comparison - Period comparison
router.get('/:userId/comparison', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const period = req.query.period || 'month'; // month, quarter, year
    
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const now = new Date();
    let currentPeriodStart, currentPeriodEnd, previousPeriodStart, previousPeriodEnd;
    
    switch (period) {
      case 'month':
        currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        currentPeriodStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
        currentPeriodEnd = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
        previousPeriodStart = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
        previousPeriodEnd = new Date(now.getFullYear(), currentQuarter * 3, 0);
        break;
      case 'year':
        currentPeriodStart = new Date(now.getFullYear(), 0, 1);
        currentPeriodEnd = new Date(now.getFullYear(), 11, 31);
        previousPeriodStart = new Date(now.getFullYear() - 1, 0, 1);
        previousPeriodEnd = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        return res.status(400).json({ error: 'Invalid period. Use month, quarter, or year.' });
    }
    
    // Get current period data
    const { data: currentSubscriptions, error: currentError } = await req.supabase
      .from('subscriptions')
      .select('*')
      .gte('created_at', currentPeriodStart.toISOString())
      .lte('created_at', currentPeriodEnd.toISOString());
    
    if (currentError) {
      return res.status(400).json({ error: currentError.message });
    }
    
    // Get previous period data
    const { data: previousSubscriptions, error: previousError } = await req.supabase
      .from('subscriptions')
      .select('*')
      .gte('created_at', previousPeriodStart.toISOString())
      .lte('created_at', previousPeriodEnd.toISOString());
    
    if (previousError) {
      return res.status(400).json({ error: previousError.message });
    }
    
    // Calculate current period metrics
    const currentActiveSubscriptions = currentSubscriptions.filter(sub => sub.is_active);
    const currentTotalMonthly = currentActiveSubscriptions.reduce((sum, sub) => 
      sum + normalizeToMonthly(sub.cost, sub.billing_cycle), 0);
    
    // Calculate previous period metrics
    const previousActiveSubscriptions = previousSubscriptions.filter(sub => sub.is_active);
    const previousTotalMonthly = previousActiveSubscriptions.reduce((sum, sub) => 
      sum + normalizeToMonthly(sub.cost, sub.billing_cycle), 0);
    
    // Calculate changes
    const subscriptionCountChange = currentActiveSubscriptions.length - previousActiveSubscriptions.length;
    const monthlySpendingChange = currentTotalMonthly - previousTotalMonthly;
    const monthlySpendingChangePercent = previousTotalMonthly > 0 
      ? ((monthlySpendingChange / previousTotalMonthly) * 100) 
      : 0;
    
    // Category comparison
    const currentCategories = {};
    const previousCategories = {};
    
    currentActiveSubscriptions.forEach(sub => {
      const category = sub.category || 'Uncategorized';
      const monthlyCost = normalizeToMonthly(sub.cost, sub.billing_cycle);
      currentCategories[category] = (currentCategories[category] || 0) + monthlyCost;
    });
    
    previousActiveSubscriptions.forEach(sub => {
      const category = sub.category || 'Uncategorized';
      const monthlyCost = normalizeToMonthly(sub.cost, sub.billing_cycle);
      previousCategories[category] = (previousCategories[category] || 0) + monthlyCost;
    });
    
    // Compare categories
    const categoryComparison = [];
    const allCategories = new Set([...Object.keys(currentCategories), ...Object.keys(previousCategories)]);
    
    allCategories.forEach(category => {
      const currentAmount = currentCategories[category] || 0;
      const previousAmount = previousCategories[category] || 0;
      const change = currentAmount - previousAmount;
      const changePercent = previousAmount > 0 ? ((change / previousAmount) * 100) : 0;
      
      categoryComparison.push({
        category,
        current: formatCurrency(currentAmount),
        previous: formatCurrency(previousAmount),
        change: formatCurrency(change),
        changePercent: formatCurrency(changePercent)
      });
    });
    
    const comparison = {
      period,
      currentPeriod: {
        start: currentPeriodStart.toISOString().split('T')[0],
        end: currentPeriodEnd.toISOString().split('T')[0],
        subscriptionCount: currentActiveSubscriptions.length,
        monthlySpending: formatCurrency(currentTotalMonthly),
        newSubscriptions: currentSubscriptions.length
      },
      previousPeriod: {
        start: previousPeriodStart.toISOString().split('T')[0],
        end: previousPeriodEnd.toISOString().split('T')[0],
        subscriptionCount: previousActiveSubscriptions.length,
        monthlySpending: formatCurrency(previousTotalMonthly),
        newSubscriptions: previousSubscriptions.length
      },
      changes: {
        subscriptionCount: subscriptionCountChange,
        monthlySpending: formatCurrency(monthlySpendingChange),
        monthlySpendingPercent: formatCurrency(monthlySpendingChangePercent),
        trend: monthlySpendingChange > 0 ? 'increasing' : monthlySpendingChange < 0 ? 'decreasing' : 'stable'
      },
      categoryComparison: categoryComparison.sort((a, b) => b.current - a.current),
      insights: []
    };
    
    // Generate insights
    if (Math.abs(monthlySpendingChangePercent) > 20) {
      comparison.insights.push({
        type: monthlySpendingChange > 0 ? 'warning' : 'positive',
        message: `Monthly spending ${monthlySpendingChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(monthlySpendingChangePercent).toFixed(1)}% compared to the previous ${period}.`
      });
    }
    
    if (subscriptionCountChange > 0) {
      comparison.insights.push({
        type: 'info',
        message: `You added ${subscriptionCountChange} new subscription${subscriptionCountChange > 1 ? 's' : ''} this ${period}.`
      });
    }
    
    const topGrowthCategory = categoryComparison
      .filter(cat => cat.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)[0];
    
    if (topGrowthCategory && topGrowthCategory.changePercent > 50) {
      comparison.insights.push({
        type: 'warning',
        message: `${topGrowthCategory.category} spending increased by ${topGrowthCategory.changePercent.toFixed(1)}% this ${period}.`
      });
    }
    
    comparison.generatedAt = new Date().toISOString();
    res.json(comparison);
    
  } catch (err) {
    console.error('Comparison error:', err);
    res.status(500).json({ error: 'Server error during comparison' });
  }
});

module.exports = router;
