import React, { useState, useEffect } from 'react';
import { PieChart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscriptionService } from '../lib/subscription-service';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

// Category color mapping
const getCategoryConfig = (category) => {
  const configs = {
    Entertainment: { 
      color: '#8B5CF6', 
      bgColor: 'bg-purple-100', 
      textColor: 'text-purple-800',
      borderColor: 'border-purple-200'
    },
    Productivity: { 
      color: '#3B82F6', 
      bgColor: 'bg-blue-100', 
      textColor: 'text-blue-800',
      borderColor: 'border-blue-200'
    },
    Health: { 
      color: '#10B981', 
      bgColor: 'bg-green-100', 
      textColor: 'text-green-800',
      borderColor: 'border-green-200'
    },
    Finance: { 
      color: '#F59E0B', 
      bgColor: 'bg-yellow-100', 
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-200'
    },
    Education: { 
      color: '#6366F1', 
      bgColor: 'bg-indigo-100', 
      textColor: 'text-indigo-800',
      borderColor: 'border-indigo-200'
    },
    Other: { 
      color: '#6B7280', 
      bgColor: 'bg-gray-100', 
      textColor: 'text-gray-800',
      borderColor: 'border-gray-200'
    },
  };
  return configs[category] || configs.Other;
};

export const CategoryBreakdownTable = () => {
  const { user } = useAuth();
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    if (user) {
      loadCategoryData();
    }
  }, [user]);

  const loadCategoryData = async () => {
    setLoading(true);
    try {
      const subscriptions = await subscriptionService.getSubscriptions(user.id);
      const activeSubscriptions = subscriptions.filter(sub => sub.is_active);
      
      // Group by category
      const categoryMap = {};
      let total = 0;

      activeSubscriptions.forEach(sub => {
        const category = sub.category || 'Other';
        const monthlyCost = calculateMonthlyCost(sub.cost, sub.billing_cycle);
        
        if (!categoryMap[category]) {
          categoryMap[category] = {
            category,
            serviceCount: 0,
            totalCost: 0,
            services: []
          };
        }
        
        categoryMap[category].serviceCount += 1;
        categoryMap[category].totalCost += monthlyCost;
        categoryMap[category].services.push(sub.service_name);
        total += monthlyCost;
      });

      // Convert to array and calculate percentages
      const categoryArray = Object.values(categoryMap).map(cat => ({
        ...cat,
        percentage: total > 0 ? (cat.totalCost / total) * 100 : 0
      })).sort((a, b) => b.totalCost - a.totalCost);

      setCategoryData(categoryArray);
      setTotalCost(total);
    } catch (error) {
      console.error('Failed to load category data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyCost = (cost, billingCycle) => {
    const numericCost = parseFloat(cost) || 0;
    switch (billingCycle?.toLowerCase()) {
      case 'weekly':
        return numericCost * 4.33; // Average weeks per month
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="w-5 h-5" />
            <span>Category Breakdown</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/6"></div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <PieChart className="w-5 h-5 text-blue-600" />
          <span>Category Breakdown</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {categoryData.length === 0 ? (
          <div className="text-center py-6">
            <PieChart className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-slate-600 text-sm">No active subscriptions to categorize</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Services</TableHead>
                  <TableHead className="text-center">Monthly Cost</TableHead>
                  <TableHead className="text-center">Percentage</TableHead>
                  <TableHead>Distribution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryData.map((category) => {
                  const config = getCategoryConfig(category.category);
                  
                  return (
                    <TableRow key={category.category} className="hover:bg-slate-50">
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: config.color }}
                          ></div>
                          <span className="font-medium">{category.category}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-xs">
                          {category.serviceCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {formatCurrency(category.totalCost)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-medium">
                          {category.percentage.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${category.percentage}%`,
                                backgroundColor: config.color
                              }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500 min-w-[40px]">
                            {category.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {/* Total Row */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-900">Total Monthly Cost:</span>
                <span className="font-bold text-lg text-slate-900">
                  {formatCurrency(totalCost)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
