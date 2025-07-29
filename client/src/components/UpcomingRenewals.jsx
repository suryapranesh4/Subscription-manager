import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { subscriptionService } from '../lib/subscription-service';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';

// Helper function to get subscription initials
const getSubscriptionInitials = (serviceName) => {
  if (!serviceName || typeof serviceName !== 'string') {
    return 'SS';
  }
  
  return serviceName
    .split(' ')
    .map(word => word && word[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'SS';
};

// Helper function to get urgency badge
const getUrgencyBadge = (daysUntilRenewal) => {
  if (daysUntilRenewal <= 0) {
    return { variant: 'destructive', text: 'Due Today', color: 'bg-red-100 text-red-800 border-red-200' };
  } else if (daysUntilRenewal <= 3) {
    return { variant: 'destructive', text: `${daysUntilRenewal} days`, color: 'bg-red-100 text-red-800 border-red-200' };
  } else if (daysUntilRenewal <= 7) {
    return { variant: 'default', text: `${daysUntilRenewal} days`, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
  } else {
    return { variant: 'secondary', text: `${daysUntilRenewal} days`, color: 'bg-green-100 text-green-800 border-green-200' };
  }
};

export const UpcomingRenewals = () => {
  const { user } = useAuth();
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUpcomingRenewals();
    }
  }, [user]);

  const loadUpcomingRenewals = async () => {
    setLoading(true);
    try {
      const subscriptions = await subscriptionService.getSubscriptions(user.id);
      
      // Filter and sort by upcoming renewals (next 30 days)
      const today = new Date();
      const upcomingRenewals = subscriptions
        .filter(sub => sub.is_active && sub.next_payment_date)
        .map(sub => ({
          ...sub,
          nextPaymentDate: parseISO(sub.next_payment_date),
          daysUntilRenewal: differenceInDays(parseISO(sub.next_payment_date), today)
        }))
        .filter(sub => sub.daysUntilRenewal <= 30 && sub.daysUntilRenewal >= 0)
        .sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal)
        .slice(0, 5); // Show top 5 upcoming renewals

      setRenewals(upcomingRenewals);
    } catch (error) {
      console.error('Failed to load upcoming renewals:', error);
    } finally {
      setLoading(false);
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
            <Clock className="w-5 h-5" />
            <span>Upcoming Renewals</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-slate-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-16 h-6 bg-slate-200 rounded"></div>
                </div>
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
          <Clock className="w-5 h-5 text-blue-600" />
          <span>Upcoming Renewals</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renewals.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-slate-600 text-sm">No upcoming renewals in the next 30 days</p>
          </div>
        ) : (
          <div className="space-y-3">
            {renewals.map((renewal) => {
              const urgencyBadge = getUrgencyBadge(renewal.daysUntilRenewal);
              
              return (
                <div key={renewal.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    {/* Logo or Initials */}
                    <div className="flex-shrink-0">
                      {renewal.logo_url ? (
                        <img
                          src={renewal.logo_url}
                          alt={`${renewal.service_name} logo`}
                          className="w-8 h-8 rounded object-cover border"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`
                          w-8 h-8 rounded bg-slate-100 border flex items-center justify-center text-xs font-semibold text-slate-600
                          ${renewal.logo_url ? 'hidden' : 'flex'}
                        `}
                      >
                        {getSubscriptionInitials(renewal.service_name)}
                      </div>
                    </div>
                    
                    {/* Service Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {renewal.service_name}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <span>{formatCurrency(renewal.cost)}</span>
                        <span>•</span>
                        <span>{format(renewal.nextPaymentDate, 'MMM d')}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Urgency Badge */}
                  <div className="flex items-center space-x-2">
                    {renewal.daysUntilRenewal <= 3 && (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                    <Badge className={urgencyBadge.color}>
                      {urgencyBadge.text}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
