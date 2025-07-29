import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { TrendingUp } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

// Hardcoded test data
const testData = [
  { name: 'Netflix', cost: 19.99 },
  { name: 'Spotify', cost: 9.99 },
  { name: 'Adobe CC', cost: 52.99 },
  { name: 'GitHub Pro', cost: 4.00 },
  { name: 'AWS', cost: 89.50 }
];

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

export const TopSubscriptionsBarChartTest = () => {
  console.log('Rendering TopSubscriptionsBarChartTest with data:', testData);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <span>Top Subscriptions (Test)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={testData} 
              layout="horizontal" 
              margin={{ top: 20, right: 60, left: 80, bottom: 20 }}
            >
              <XAxis 
                type="number" 
                stroke="#6B7280" 
                fontSize={12}
                tick={{ fill: '#6B7280' }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <YAxis 
                type="category"
                dataKey="name" 
                stroke="#6B7280" 
                fontSize={12}
                tick={{ fill: '#6B7280' }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
              <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                {testData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
