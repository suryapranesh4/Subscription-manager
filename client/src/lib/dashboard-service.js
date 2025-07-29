import { subscriptionService } from './subscription-service';

export const dashboardService = {
  // Calculate dashboard metrics from subscriptions
  async getDashboardMetrics(userId) {
    try {
      const subscriptions = await subscriptionService.getSubscriptions(userId);
      
      // Calculate active subscriptions count
      const activeSubscriptions = subscriptions.filter(sub => sub.is_active).length;
      
      // Calculate monthly cost (sum of all active monthly subscriptions)
      const monthlyCost = subscriptions
        .filter(sub => sub.is_active)
        .reduce((total, sub) => {
          let monthlyAmount = 0;
          
          switch (sub.billing_cycle) {
            case 'monthly':
              monthlyAmount = parseFloat(sub.cost);
              break;
            case 'yearly':
              monthlyAmount = parseFloat(sub.cost) / 12;
              break;
            case 'weekly':
              monthlyAmount = parseFloat(sub.cost) * 4.33; // average weeks per month
              break;
            default:
              monthlyAmount = 0;
          }
          
          return total + monthlyAmount;
        }, 0);
      
      // Calculate this month's spending (subscriptions with next payment date in current month)
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      const thisMonthSpending = subscriptions
        .filter(sub => {
          if (!sub.is_active || !sub.next_payment_date) return false;
          
          const nextPaymentDate = new Date(sub.next_payment_date);
          return nextPaymentDate.getMonth() + 1 === currentMonth && 
                 nextPaymentDate.getFullYear() === currentYear;
        })
        .reduce((total, sub) => total + parseFloat(sub.cost), 0);
      
      return {
        activeSubscriptions,
        monthlyCost: monthlyCost.toFixed(2),
        thisMonthSpending: thisMonthSpending.toFixed(2)
      };
    } catch (error) {
      console.error('Error calculating dashboard metrics:', error);
      // Return default values on error
      return {
        activeSubscriptions: 0,
        monthlyCost: '0.00',
        thisMonthSpending: '0.00'
      };
    }
  }
};
