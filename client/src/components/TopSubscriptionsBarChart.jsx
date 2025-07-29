import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { subscriptionService } from '../lib/subscription-service';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { TrendingUp } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
        <p className="text-sm font-medium text-slate-900">
          {payload[0].payload.name}: ${payload[0].value.toFixed(2)}/month
        </p>
      </div>
    );
  }
  return null;
};

export const TopSubscriptionsBarChart = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTopSubscriptions();
    }
  }, [user]);

  const loadTopSubscriptions = async () => {
    setLoading(true);
    try {
      console.log('Loading subscriptions for user:', user.id);
      const subscriptions = await subscriptionService.getSubscriptions(user.id);
      console.log('All subscriptions:', subscriptions);
      
      const activeSubscriptions = subscriptions.filter(sub => sub.is_active);
      console.log('Active subscriptions:', activeSubscriptions);
      
      const calculateMonthlyCost = (cost, billingCycle) => {
        const numericCost = parseFloat(cost) || 0;
        switch (billingCycle?.toLowerCase()) {
          case 'weekly':
            return numericCost * 4.33;
          case 'monthly':
            return numericCost;
          case 'quarterly':
            return numericCost / 3;
          case 'biannually':
            return numericCost / 6;
          case 'yearly':
            return numericCost / 12;
          default:
            return numericCost;
        }
      };

      const topSubscriptions = activeSubscriptions
        .map((sub) => {
          const monthlyCost = calculateMonthlyCost(sub.cost, sub.billing_cycle);
          return {
            name: sub.service_name || 'Unknown Service',
            cost: monthlyCost
          };
        })
        .filter(sub => sub.cost > 0) // Filter out zero-cost subscriptions
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 5);

      console.log('Top subscriptions data:', topSubscriptions);
      setData(topSubscriptions);
    } catch (error) {
      console.error('Failed to load top subscriptions:', error);
      // Set empty data on error
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Top Subscriptions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-8 bg-slate-200 rounded flex-1"></div>
                  <div className="h-8 w-16 bg-slate-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <span>Top Subscriptions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {data.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-slate-600 text-sm">No active subscriptions to display</p>
          </div>
        ) : (
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={data} 
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <XAxis 
                  dataKey="name" 
                  stroke="#6B7280" 
                  fontSize={12}
                  tick={{ fill: '#6B7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#6B7280" 
                  fontSize={12}
                  tick={{ fill: '#6B7280' }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
