import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  DollarSign,
  Edit,
  Trash2,
  Clock,
  CreditCard,
  Building
} from 'lucide-react';
import { format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  parseISO
} from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { subscriptionService } from '../lib/subscription-service';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

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

// Helper function to calculate next payment dates based on billing cycle
const calculateNextPaymentDates = (subscription, monthStart, monthEnd) => {
  const paymentDates = [];
  const startDate = parseISO(subscription.start_date);
  let currentDate = new Date(startDate);

  // If subscription has a next_payment_date, use that as the primary reference
  if (subscription.next_payment_date) {
    const nextPaymentDate = parseISO(subscription.next_payment_date);
    if (nextPaymentDate >= monthStart && nextPaymentDate <= monthEnd) {
      paymentDates.push(new Date(nextPaymentDate));
    }
    return paymentDates;
  }

  // Calculate billing cycle interval
  const addInterval = (date, cycle) => {
    const newDate = new Date(date);
    switch (cycle.toLowerCase()) {
      case 'weekly':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'monthly':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'quarterly':
        newDate.setMonth(newDate.getMonth() + 3);
        break;
      case 'biannually':
        newDate.setMonth(newDate.getMonth() + 6);
        break;
      case 'yearly':
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
      default:
        newDate.setMonth(newDate.getMonth() + 1);
    }
    return newDate;
  };

  // Generate payment dates for the current month view
  let iterations = 0;
  while (currentDate <= monthEnd && iterations < 50) {
    if (currentDate >= monthStart && currentDate <= monthEnd) {
      paymentDates.push(new Date(currentDate));
    }
    currentDate = addInterval(currentDate, subscription.billing_cycle);
    iterations++;
  }

  return paymentDates;
};

export function CalendarView() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Load subscriptions
  useEffect(() => {
    if (user) {
      loadSubscriptions();
    }
  }, [user]);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await subscriptionService.getSubscriptions(user.id);
      setSubscriptions(data.filter(sub => sub.is_active)); // Only show active subscriptions
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get calendar days for current month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Get subscriptions for a specific date
  const getSubscriptionsForDate = (date) => {
    const subscriptionsForDate = [];
    
    subscriptions.forEach(subscription => {
      const paymentDates = calculateNextPaymentDates(subscription, monthStart, monthEnd);
      if (paymentDates.some(paymentDate => isSameDay(paymentDate, date))) {
        subscriptionsForDate.push(subscription);
      }
    });

    return subscriptionsForDate;
  };

  // Navigation handlers
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle date selection
  const handleDateSelect = (date) => {
    setCurrentDate(date);
    setDatePickerOpen(false);
  };

  // Handle day click
  const handleDayClick = (date, daySubscriptions) => {
    if (daySubscriptions.length === 1) {
      setSelectedSubscription(daySubscriptions[0]);
      setSelectedDate(date);
      setDialogOpen(true);
    } else if (daySubscriptions.length > 1) {
      // Show multiple subscriptions for this date
      setSelectedDate(date);
      setDialogOpen(true);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-slate-400" />
          <p className="text-slate-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-slate-900">
            Subscription Calendar
          </h1>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {subscriptions.length} Active Subscriptions
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={goToToday}
            className="text-sm"
          >
            Today
          </Button>
          
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="text-sm">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {format(currentDate, 'MMMM yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPreviousMonth}
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </Button>

        <h2 className="text-xl font-semibold text-slate-900">
          {format(currentDate, 'MMMM yyyy')}
        </h2>

        <Button
          variant="outline"
          size="sm"
          onClick={goToNextMonth}
          className="flex items-center space-x-2"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          {/* Calendar Header - Days of Week */}
          <div className="grid grid-cols-7 border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-medium text-slate-600 bg-slate-50 border-r last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, dayIndex) => {
              const daySubscriptions = getSubscriptionsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`
                    min-h-[120px] p-2 border-r border-b last:border-r-0 
                    ${isCurrentMonth ? 'bg-white' : 'bg-slate-50'}
                    ${daySubscriptions.length > 0 ? 'cursor-pointer hover:bg-slate-50' : ''}
                    transition-colors duration-150
                  `}
                  onClick={() => daySubscriptions.length > 0 && handleDayClick(day, daySubscriptions)}
                >
                  {/* Date Number */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`
                        text-sm font-medium
                        ${isCurrentMonth ? 'text-slate-900' : 'text-slate-400'}
                        ${isCurrentDay ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs' : ''}
                      `}
                    >
                      {format(day, 'd')}
                    </span>
                    
                    {daySubscriptions.length > 0 && (
                      <Badge variant="secondary" className="text-xs h-5 px-1.5">
                        {daySubscriptions.length}
                      </Badge>
                    )}
                  </div>

                  {/* Subscription Logos/Initials */}
                  <div className="space-y-1">
                    {daySubscriptions.slice(0, 3).map((subscription, index) => (
                      <div
                        key={`${subscription.id}-${index}`}
                        className="flex items-center space-x-2 p-1 rounded bg-white border text-xs"
                      >
                        {subscription.logo_url ? (
                          <img
                            src={subscription.logo_url}
                            alt={subscription.service_name}
                            className="w-4 h-4 rounded object-cover flex-shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className={`
                            w-4 h-4 rounded bg-slate-200 flex items-center justify-center text-[10px] font-medium flex-shrink-0
                            ${subscription.logo_url ? 'hidden' : 'flex'}
                          `}
                        >
                          {getSubscriptionInitials(subscription.service_name)}
                        </div>
                        <span className="truncate text-slate-700 font-medium">
                          {subscription.service_name}
                        </span>
                        <span className="text-slate-500 ml-auto">
                          {formatCurrency(subscription.cost)}
                        </span>
                      </div>
                    ))}
                    
                    {daySubscriptions.length > 3 && (
                      <div className="text-xs text-slate-500 text-center py-1">
                        +{daySubscriptions.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Details Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5" />
              <span>
                {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Subscription Details'}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {selectedDate && (
              <>
                {getSubscriptionsForDate(selectedDate).map((subscription) => (
                  <Card key={subscription.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {subscription.logo_url ? (
                            <img
                              src={subscription.logo_url}
                              alt={subscription.service_name}
                              className="w-12 h-12 rounded-lg object-cover border"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-100 border flex items-center justify-center">
                              <span className="text-sm font-semibold text-slate-600">
                                {getSubscriptionInitials(subscription.service_name)}
                              </span>
                            </div>
                          )}
                          <div>
                            <CardTitle className="text-lg">
                              {subscription.service_name}
                            </CardTitle>
                            <CardDescription className="flex items-center space-x-2">
                              <DollarSign className="w-4 h-4" />
                              <span>{formatCurrency(subscription.cost)}</span>
                              <span className="text-slate-400">•</span>
                              <span className="capitalize">{subscription.billing_cycle}</span>
                            </CardDescription>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <p className="text-sm font-medium text-slate-500">Category</p>
                          <p className="text-sm text-slate-900">{subscription.category}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500">Status</p>
                          <Badge variant={subscription.is_active ? "default" : "secondary"}>
                            {subscription.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500">Start Date</p>
                          <p className="text-sm text-slate-900">
                            {format(parseISO(subscription.start_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500">Next Payment</p>
                          <p className="text-sm text-slate-900">
                            {subscription.next_payment_date
                              ? format(parseISO(subscription.next_payment_date), 'MMM d, yyyy')
                              : format(selectedDate, 'MMM d, yyyy')
                            }
                          </p>
                        </div>
                      </div>

                      {/* Payment History Table */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 mb-3 flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          Recent Payment History
                        </h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Method</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {/* Mock payment history - replace with actual data */}
                            <TableRow>
                              <TableCell>{format(selectedDate, 'MMM d, yyyy')}</TableCell>
                              <TableCell>{formatCurrency(subscription.cost)}</TableCell>
                              <TableCell>
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  Paid
                                </Badge>
                              </TableCell>
                              <TableCell className="flex items-center">
                                <CreditCard className="w-4 h-4 mr-2" />
                                Card
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
