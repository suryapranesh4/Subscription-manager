const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Function to get supabase client (will be called after env is loaded)
const getSupabase = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Helper function to calculate next billing date
const calculateNextBillingDate = (startDate, billingCycle, customDays = null) => {
  const start = new Date(startDate);
  const today = new Date();
  
  switch (billingCycle) {
    case 'monthly':
      let nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      // Handle month-end dates (e.g., Jan 31 -> Feb 28/29)
      const targetDay = start.getDate();
      const daysInNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
      
      if (targetDay > daysInNextMonth) {
        nextMonth.setDate(daysInNextMonth); // Last day of month
      } else {
        nextMonth.setDate(targetDay);
      }
      
      return nextMonth.toISOString().split('T')[0];
      
    case 'yearly':
      let nextYear = new Date(today);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      nextYear.setMonth(start.getMonth());
      nextYear.setDate(start.getDate());
      
      // Handle leap year edge case for Feb 29
      if (start.getMonth() === 1 && start.getDate() === 29) {
        const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        if (!isLeapYear(nextYear.getFullYear())) {
          nextYear.setDate(28); // Feb 28 in non-leap year
        }
      }
      
      return nextYear.toISOString().split('T')[0];
      
    case 'weekly':
      let nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek.toISOString().split('T')[0];
      
    case 'custom':
      if (!customDays) {
        throw new Error('Custom days required for custom billing cycle');
      }
      let nextCustom = new Date(today);
      nextCustom.setDate(nextCustom.getDate() + parseInt(customDays));
      return nextCustom.toISOString().split('T')[0];
      
    default:
      throw new Error('Invalid billing cycle');
  }
};

// POST /api/billing/calculate-next-date - Calculate next billing date
router.post('/calculate-next-date', (req, res) => {
  try {
    const { startDate, billingCycle, customDays } = req.body;
    
    if (!startDate || !billingCycle) {
      return res.status(400).json({ 
        error: 'Start date and billing cycle are required' 
      });
    }
    
    const validCycles = ['monthly', 'yearly', 'weekly', 'custom'];
    if (!validCycles.includes(billingCycle)) {
      return res.status(400).json({ 
        error: 'Invalid billing cycle. Must be one of: ' + validCycles.join(', ') 
      });
    }
    
    if (billingCycle === 'custom' && !customDays) {
      return res.status(400).json({ 
        error: 'Custom days required for custom billing cycle' 
      });
    }
    
    const nextDate = calculateNextBillingDate(startDate, billingCycle, customDays);
    
    res.json({
      startDate,
      billingCycle,
      customDays: customDays || null,
      nextPaymentDate: nextDate,
      calculatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/billing/preview/:startDate/:billingCycle - Preview next 12 billing dates
router.get('/preview/:startDate/:billingCycle', (req, res) => {
  try {
    const { startDate, billingCycle } = req.params;
    const { customDays } = req.query;
    
    const validCycles = ['monthly', 'yearly', 'weekly', 'custom'];
    if (!validCycles.includes(billingCycle)) {
      return res.status(400).json({ 
        error: 'Invalid billing cycle. Must be one of: ' + validCycles.join(', ') 
      });
    }
    
    const dates = [];
    let currentDate = new Date(startDate);
    
    for (let i = 0; i < 12; i++) {
      switch (billingCycle) {
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'custom':
          if (!customDays) {
            return res.status(400).json({ error: 'Custom days required' });
          }
          currentDate.setDate(currentDate.getDate() + parseInt(customDays));
          break;
      }
      
      dates.push(currentDate.toISOString().split('T')[0]);
    }
    
    res.json({
      startDate,
      billingCycle,
      customDays: customDays || null,
      upcomingPayments: dates
    });
    
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
