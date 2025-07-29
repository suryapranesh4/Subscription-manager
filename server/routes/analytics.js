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

// Helper function to normalize costs to yearly
const normalizeToYearly = (cost, billingCycle) => {
  switch (billingCycle?.toLowerCase()) {
    case 'monthly':
      return cost * 12;
    case 'weekly':
      return cost * 52; // 52 weeks per year
    case 'yearly':
    default:
      return cost;
  }
};

// Helper function to format currency
const formatCurrency = (amount) => {
  return Math.round(amount * 100) / 100; // Round to 2 decimal places
};

// GET /api/analytics/:userId/summary - Dashboard summary
router.get('/:userId/summary', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { data: subscriptions, error } = await req.supabase
      .from('subscriptions')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    const totalSubscriptions = subscriptions.length;
    let totalMonthly = 0;
    let totalYearly = 0;
    
    subscriptions.forEach(sub => {
      totalMonthly += normalizeToMonthly(sub.cost, sub.billing_cycle);
      totalYearly += normalizeToYearly(sub.cost, sub.billing_cycle);
    });
    
    // Calculate average cost per subscription
    const avgMonthlyCost = totalSubscriptions > 0 ? totalMonthly / totalSubscriptions : 0;
    
    res.json({
      totalSubscriptions,
      totalMonthly: formatCurrency(totalMonthly),
      totalYearly: formatCurrency(totalYearly),
      avgMonthlyCost: formatCurrency(avgMonthlyCost),
      generatedAt: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('Analytics summary error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/analytics/:userId/categories - Category breakdown
router.get('/:userId/categories', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { data: subscriptions, error } = await req.supabase
      .from('subscriptions')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    const categorySpending = {};
    
    subscriptions.forEach(sub => {
      const category = sub.category || 'Uncategorized';
      const monthlyCost = normalizeToMonthly(sub.cost, sub.billing_cycle);
      
      if (!categorySpending[category]) {
        categorySpending[category] = {
          name: category,
          monthly: 0,
          yearly: 0,
          count: 0,
          subscriptions: []
        };
      }
      
      categorySpending[category].monthly += monthlyCost;
      categorySpending[category].yearly += normalizeToYearly(sub.cost, sub.billing_cycle);
      categorySpending[category].count += 1;
      categorySpending[category].subscriptions.push({
        id: sub.id,
        name: sub.name,
        cost: sub.cost,
        billing_cycle: sub.billing_cycle,
        logo_url: sub.logo_url
      });
    });
    
    // Convert to array and format for charts
    const categoryData = Object.values(categorySpending).map(cat => ({
      ...cat,
      monthly: formatCurrency(cat.monthly),
      yearly: formatCurrency(cat.yearly)
    })).sort((a, b) => b.monthly - a.monthly);
    
    res.json({
      categories: categoryData,
      totalCategories: categoryData.length,
      generatedAt: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('Categories analytics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/analytics/:userId/trends - Monthly spending trends
router.get('/:userId/trends', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const months = parseInt(req.query.months) || 6;
    
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get subscription payments for trend analysis
    const { data: payments, error: paymentsError } = await req.supabase
      .from('subscription_payments')
      .select(`
        *,
        subscriptions!inner(
          name,
          category,
          logo_url,
          billing_cycle
        )
      `)
      .gte('payment_date', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('payment_date', { ascending: true });
    
    if (paymentsError) {
      // If no payments, calculate trends based on current subscriptions and their next payment dates
      const { data: subscriptions, error } = await req.supabase
        .from('subscriptions')
        .select('*')
        .eq('is_active', true);
        
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      
      // Generate projected trends
      const trends = [];
      const now = new Date();
      
      for (let i = months - 1; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = monthDate.toISOString().slice(0, 7); // YYYY-MM format
        
        let monthlyTotal = 0;
        subscriptions.forEach(sub => {
          monthlyTotal += normalizeToMonthly(sub.cost, sub.billing_cycle);
        });
        
        trends.push({
          month: monthKey,
          monthName: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          total: formatCurrency(monthlyTotal),
          subscriptionCount: subscriptions.length,
          projected: true
        });
      }
      
      return res.json({
        trends,
        totalMonths: months,
        generatedAt: new Date().toISOString()
      });
    }
    
    // Process actual payment data
    const monthlyData = {};
    
    payments.forEach(payment => {
      const monthKey = payment.payment_date.slice(0, 7); // YYYY-MM
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          total: 0,
          subscriptionCount: 0,
          payments: []
        };
      }
      
      monthlyData[monthKey].total += payment.amount;
      monthlyData[monthKey].subscriptionCount += 1;
      monthlyData[monthKey].payments.push({
        subscription: payment.subscriptions.name,
        amount: payment.amount,
        category: payment.subscriptions.category,
        logo_url: payment.subscriptions.logo_url
      });
    });
    
    // Convert to array and sort by month
    const trends = Object.values(monthlyData)
      .map(month => ({
        ...month,
        monthName: new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        total: formatCurrency(month.total),
        projected: false
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
    
    res.json({
      trends,
      totalMonths: trends.length,
      generatedAt: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('Trends analytics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/analytics/:userId/upcoming - Upcoming renewals
router.get('/:userId/upcoming', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const days = parseInt(req.query.days) || 30;
    
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    
    const { data: subscriptions, error } = await req.supabase
      .from('subscriptions')
      .select('*')
      .eq('is_active', true)
      .lte('next_payment_date', endDate.toISOString().split('T')[0])
      .order('next_payment_date', { ascending: true });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    const upcomingRenewals = subscriptions.map(sub => ({
      id: sub.id,
      name: sub.name,
      cost: sub.cost,
      billing_cycle: sub.billing_cycle,
      next_payment_date: sub.next_payment_date,
      category: sub.category,
      logo_url: sub.logo_url,
      daysUntilRenewal: Math.ceil((new Date(sub.next_payment_date) - new Date()) / (1000 * 60 * 60 * 24))
    }));
    
    const totalUpcomingCost = upcomingRenewals.reduce((sum, sub) => sum + sub.cost, 0);
    
    res.json({
      upcomingRenewals,
      totalUpcomingCost: formatCurrency(totalUpcomingCost),
      count: upcomingRenewals.length,
      generatedAt: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('Upcoming renewals error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/analytics/:userId/expensive - Most expensive subscriptions
router.get('/:userId/expensive', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { data: subscriptions, error } = await req.supabase
      .from('subscriptions')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    // Calculate monthly cost for each subscription and sort
    const expensiveSubscriptions = subscriptions
      .map(sub => ({
        ...sub,
        monthlyCost: normalizeToMonthly(sub.cost, sub.billing_cycle),
        yearlyCost: normalizeToYearly(sub.cost, sub.billing_cycle)
      }))
      .sort((a, b) => b.monthlyCost - a.monthlyCost)
      .slice(0, limit)
      .map(sub => ({
        id: sub.id,
        name: sub.name,
        cost: sub.cost,
        billing_cycle: sub.billing_cycle,
        monthlyCost: formatCurrency(sub.monthlyCost),
        yearlyCost: formatCurrency(sub.yearlyCost),
        category: sub.category,
        logo_url: sub.logo_url,
        next_payment_date: sub.next_payment_date
      }));
    
    res.json({
      expensiveSubscriptions,
      count: expensiveSubscriptions.length,
      generatedAt: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('Expensive subscriptions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/analytics/:userId/insights - Generated insights
router.get('/:userId/insights', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { data: subscriptions, error } = await req.supabase
      .from('subscriptions')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    const insights = [];
    
    if (subscriptions.length === 0) {
      insights.push({
        type: 'info',
        title: 'No Active Subscriptions',
        message: 'You currently have no active subscriptions to analyze.',
        action: 'Start by adding your first subscription!'
      });
      
      return res.json({ insights, generatedAt: new Date().toISOString() });
    }
    
    // Calculate total monthly spending
    const totalMonthly = subscriptions.reduce((sum, sub) => 
      sum + normalizeToMonthly(sub.cost, sub.billing_cycle), 0);
    
    // High spending warning
    if (totalMonthly > 200) {
      insights.push({
        type: 'warning',
        title: 'High Monthly Spending',
        message: `You're spending $${formatCurrency(totalMonthly)} per month on subscriptions.`,
        action: 'Consider reviewing and canceling unused subscriptions.'
      });
    }
    
    // Category analysis
    const categorySpending = {};
    subscriptions.forEach(sub => {
      const category = sub.category || 'Uncategorized';
      const monthlyCost = normalizeToMonthly(sub.cost, sub.billing_cycle);
      categorySpending[category] = (categorySpending[category] || 0) + monthlyCost;
    });
    
    const topCategory = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topCategory && topCategory[1] > totalMonthly * 0.4) {
      insights.push({
        type: 'info',
        title: 'Category Dominance',
        message: `${topCategory[0]} accounts for ${Math.round((topCategory[1] / totalMonthly) * 100)}% of your spending.`,
        action: 'Consider diversifying or reducing spending in this category.'
      });
    }
    
    // Upcoming renewals warning
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const upcomingRenewals = subscriptions.filter(sub => 
      new Date(sub.next_payment_date) <= nextWeek
    );
    
    if (upcomingRenewals.length > 0) {
      const upcomingCost = upcomingRenewals.reduce((sum, sub) => sum + sub.cost, 0);
      insights.push({
        type: 'reminder',
        title: 'Upcoming Renewals',
        message: `You have ${upcomingRenewals.length} subscription(s) renewing in the next 7 days for $${formatCurrency(upcomingCost)}.`,
        action: 'Review these subscriptions before they renew.'
      });
    }
    
    // Savings opportunity
    const expensiveSubscriptions = subscriptions
      .filter(sub => normalizeToMonthly(sub.cost, sub.billing_cycle) > 20)
      .length;
    
    if (expensiveSubscriptions > 0) {
      insights.push({
        type: 'suggestion',
        title: 'Potential Savings',
        message: `You have ${expensiveSubscriptions} subscription(s) costing more than $20/month.`,
        action: 'Review these for potential downgrades or cancellations.'
      });
    }
    
    // Annual vs monthly billing suggestion
    const monthlyBilled = subscriptions.filter(sub => sub.billing_cycle === 'monthly').length;
    if (monthlyBilled > 2) {
      insights.push({
        type: 'tip',
        title: 'Annual Billing Savings',
        message: `You have ${monthlyBilled} monthly subscriptions that might offer annual discounts.`,
        action: 'Check if switching to annual billing can save money.'
      });
    }
    
    res.json({
      insights,
      totalInsights: insights.length,
      generatedAt: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('Insights generation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
