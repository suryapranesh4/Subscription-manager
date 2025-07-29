const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Function to get supabase client (will be called after env is loaded)
const getSupabase = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Helper function to convert camelCase to snake_case for database
const toSnakeCase = (obj) => {
  const converted = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    converted[snakeKey] = value;
  }
  return converted;
};

// Helper function to convert snake_case to camelCase for frontend
const toCamelCase = (obj) => {
  const converted = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    converted[camelKey] = value;
  }
  return converted;
};

// Helper function to calculate next payment date
const calculateNextPaymentDate = (startDate, billingCycle, currentDate = new Date()) => {
  const start = new Date(startDate);
  const current = new Date(currentDate);
  
  switch (billingCycle) {
    case 'monthly':
      const nextMonth = new Date(current);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      // Handle month-end dates
      if (start.getDate() > nextMonth.getDate()) {
        nextMonth.setDate(0); // Last day of month
      } else {
        nextMonth.setDate(start.getDate());
      }
      return nextMonth.toISOString().split('T')[0];
      
    case 'yearly':
      const nextYear = new Date(current);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      nextYear.setMonth(start.getMonth());
      nextYear.setDate(start.getDate());
      return nextYear.toISOString().split('T')[0];
      
    case 'weekly':
      const nextWeek = new Date(current);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek.toISOString().split('T')[0];
      
    default:
      return current.toISOString().split('T')[0];
  }
};

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
  
  // Create an authenticated supabase client for this request
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

// GET /api/subscriptions/:userId - Get all user subscriptions
router.get('/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only access their own data
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { data, error } = await req.supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/subscriptions - Create new subscription
router.post('/', authenticateUser, async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Authenticated user:', req.user.id);
    
    // Map frontend fields to database fields
    const {
      serviceName,
      monthlyCost,
      billingCycle,
      startDate,
      category,
      logoUrl,
      userId
    } = req.body;
    
    const subscriptionData = {
      name: serviceName, // serviceName -> name
      description: null, // optional field
      cost: monthlyCost, // monthlyCost -> cost
      billing_cycle: billingCycle?.toLowerCase() || 'monthly', // normalize billing cycle
      start_date: startDate ? new Date(startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      logo_url: logoUrl,
      category,
      is_active: true,
      user_id: req.user.id
    };
    
    // Calculate next payment date
    subscriptionData.next_payment_date = calculateNextPaymentDate(
      subscriptionData.start_date,
      subscriptionData.billing_cycle
    );
    
    console.log('Final subscription data:', subscriptionData);
    
    // Use the authenticated Supabase client from the middleware
    const { data, error } = await req.supabase
      .from('subscriptions')
      .insert([subscriptionData])
      .select();
    
    if (error) {
      console.error('Supabase error:', error);
      return res.status(400).json({ error: error.message });
    }
    
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Subscription creation error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// PUT /api/subscriptions/:id - Update subscription
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updated_at: new Date().toISOString() };
    
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    if (data.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/subscriptions/:id - Delete subscription
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    const supabase = getSupabase();
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ message: 'Subscription deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/subscriptions/:id/toggle - Toggle active/inactive
router.post('/:id/toggle', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    const supabase = getSupabase();
    // Get current status
    const { data: current, error: fetchError } = await supabase
      .from('subscriptions')
      .select('is_active')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();
    
    if (fetchError) {
      return res.status(400).json({ error: fetchError.message });
    }
    
    // Toggle status
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ is_active: !current.is_active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/subscriptions/:userId/calendar/:year/:month - Get subscriptions for calendar view
router.get('/:userId/calendar/:year/:month', authenticateUser, async (req, res) => {
  try {
    const { userId, year, month } = req.params;
    
    // Ensure user can only access their own data
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .gte('next_payment_date', startDate)
      .lte('next_payment_date', endDate);
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
