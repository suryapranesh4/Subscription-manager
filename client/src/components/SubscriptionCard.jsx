import React from 'react';
import { Edit, Trash2, Calendar, DollarSign, Power, PowerOff } from 'lucide-react';
import { format } from 'date-fns';
import { subscriptionService } from '../lib/subscription-service';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

const getCategoryColor = (category) => {
  const colors = {
    Entertainment: 'bg-purple-100 text-purple-800 border-purple-200',
    Productivity: 'bg-blue-100 text-blue-800 border-blue-200', 
    Health: 'bg-green-100 text-green-800 border-green-200',
    Finance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Education: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    Other: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return colors[category] || colors.Other;
};

const getBillingCycleColor = (cycle) => {
  const colors = {
    Monthly: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Yearly: 'bg-orange-100 text-orange-800 border-orange-200',
    Custom: 'bg-slate-100 text-slate-800 border-slate-200',
  };
  return colors[cycle] || colors.Custom;
};

const getServiceInitials = (serviceName) => {
  if (!serviceName || typeof serviceName !== 'string') {
    return 'SS'; // Default initials for "Subscription Service"
  }
  
  return serviceName
    .split(' ')
    .map(word => word && word[0]) // Handle empty words
    .filter(Boolean) // Remove falsy values
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'SS'; // Fallback if no valid initials
};

export function SubscriptionCard({ subscription, onEdit, onDelete, onToggle }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const calculateYearlyCost = (cost, billingCycle) => {
    switch (billingCycle) {
      case 'yearly':
        return parseFloat(cost);
      case 'monthly':
        return parseFloat(cost) * 12;
      case 'weekly':
        return parseFloat(cost) * 52;
      default:
        return parseFloat(cost) * 12;
    }
  };

  const handleToggle = async () => {
    try {
      await subscriptionService.toggleSubscription(subscription.id);
      if (onToggle) {
        onToggle();
      }
    } catch (error) {
      console.error('Failed to toggle subscription:', error);
    }
  };

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {/* Logo or Initials */}
            <div className="flex-shrink-0">
              {subscription.logo_url ? (
                <img
                  src={subscription.logo_url}
                  alt={`${subscription.service_name} logo`}
                  className="w-12 h-12 rounded-lg object-cover border"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-slate-100 border flex items-center justify-center">
                  <span className="text-sm font-semibold text-slate-600">
                    {getServiceInitials(subscription.service_name)}
                  </span>
                </div>
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-lg truncate">
                  {subscription.service_name}
                </CardTitle>
                {/* Status Badge */}
                <Badge 
                  variant={subscription.is_active ? "default" : "secondary"}
                  className={subscription.is_active ? 
                    "bg-green-100 text-green-800 border-green-200" : 
                    "bg-gray-100 text-gray-800 border-gray-200"
                  }
                >
                  {subscription.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <CardDescription className="flex items-center space-x-2 text-sm">
                <DollarSign className="w-4 h-4" />
                <span>{formatCurrency(subscription.cost)}</span>
                <span className="text-slate-400">•</span>
                <span className="capitalize">{subscription.billing_cycle}</span>
              </CardDescription>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${subscription.is_active ? 
                'text-orange-600 hover:text-orange-700 hover:bg-orange-50' :
                'text-green-600 hover:text-green-700 hover:bg-green-50'
              }`}
              onClick={handleToggle}
              title={subscription.is_active ? 'Deactivate' : 'Activate'}
            >
              {subscription.is_active ? 
                <PowerOff className="h-4 w-4" /> : 
                <Power className="h-4 w-4" />
              }
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(subscription)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete(subscription)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Category and Billing Cycle Badges */}
          <div className="flex items-center space-x-2">
            <Badge 
              variant="secondary" 
              className={getCategoryColor(subscription.category)}
            >
              {subscription.category}
            </Badge>
            <Badge 
              variant="outline"
              className={getBillingCycleColor(subscription.billing_cycle)}
            >
              <span className="capitalize">{subscription.billing_cycle}</span>
            </Badge>
          </div>

          {/* Cost Information */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 font-medium">Cost</p>
              <p className="text-slate-900 font-semibold">
                {formatCurrency(subscription.cost)}
              </p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Yearly Est.</p>
              <p className="text-slate-900 font-semibold">
                {formatCurrency(calculateYearlyCost(subscription.cost, subscription.billing_cycle))}
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 font-medium">Start Date</p>
              <p className="text-slate-900 flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {format(new Date(subscription.start_date), 'MMM dd, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-slate-500 font-medium">Next Payment</p>
              <p className="text-slate-900 flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {subscription.next_payment_date ? 
                  format(new Date(subscription.next_payment_date), 'MMM dd, yyyy') :
                  'N/A'
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
