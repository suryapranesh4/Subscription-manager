import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../ui/table";
import { Badge } from "../ui/badge";
import { ChevronLeft, ChevronRight, Calendar, Edit, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";

const CalendarView = ({ userId }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [calendarDays, setCalendarDays] = useState([]);

  // Mock subscription data - replace with actual API call
  const mockSubscriptions = [
    {
      id: 1,
      serviceName: "Netflix",
      cost: 15.99,
      currency: "USD",
      billingCycle: "Monthly",
      startDate: "2024-01-15",
      category: "Entertainment",
      logoUrl: "https://example.com/netflix-logo.png",
      paymentHistory: [
        { date: "2024-01-15", amount: 15.99, status: "Paid" },
        { date: "2024-02-15", amount: 15.99, status: "Paid" },
        { date: "2024-03-15", amount: 15.99, status: "Pending" }
      ]
    },
    {
      id: 2,
      serviceName: "Adobe Creative Cloud",
      cost: 52.99,
      currency: "USD",
      billingCycle: "Monthly",
      startDate: "2024-01-10",
      category: "Software",
      logoUrl: "https://example.com/adobe-logo.png",
      paymentHistory: [
        { date: "2024-01-10", amount: 52.99, status: "Paid" },
        { date: "2024-02-10", amount: 52.99, status: "Paid" }
      ]
    }
  ];

  useEffect(() => {
    // Simulate fetching user's subscriptions
    setSubscriptions(mockSubscriptions);
    generateCalendarDays();
  }, [currentMonth]);

  const handlePrevMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push({
        date: date,
        isCurrentMonth: date.getMonth() === month,
        subscriptions: getSubscriptionsForDate(date)
      });
    }
    setCalendarDays(days);
  };

  const getSubscriptionsForDate = (date) => {
    return subscriptions.filter(sub => {
      const subDate = new Date(sub.startDate);
      const dayOfMonth = subDate.getDate();
      return date.getDate() === dayOfMonth && date >= subDate;
    });
  };

  const handleDayClick = (daySubscriptions) => {
    if (daySubscriptions.length > 0) {
      setSelectedSubscription(daySubscriptions[0]);
    }
  };

  const renderLogo = (logoUrl, serviceName) => {
    return (
      <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt={`${serviceName} logo`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <span className="text-xs font-semibold text-gray-600" style={{display: logoUrl ? 'none' : 'flex'}}>
          {serviceName.substring(0, 2).toUpperCase()}
        </span>
      </div>
    );
  };

  const CalendarDay = ({ day }) => {
    const isToday = day.date.toDateString() === new Date().toDateString();
    const hasSubscriptions = day.subscriptions.length > 0;
    
    return (
      <div 
        className={cn(
          "min-h-[80px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors",
          !day.isCurrentMonth && "text-gray-400 bg-gray-50",
          isToday && "bg-blue-50 border-blue-200",
          hasSubscriptions && "bg-green-50"
        )}
        onClick={() => handleDayClick(day.subscriptions)}
      >
        <div className="flex justify-between items-start">
          <span className={cn("text-sm font-medium", isToday && "text-blue-600")}>
            {day.date.getDate()}
          </span>
          {day.subscriptions.length > 1 && (
            <Badge variant="secondary" className="text-xs">
              {day.subscriptions.length}
            </Badge>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          {day.subscriptions.slice(0, 2).map((sub, index) => (
            <div key={index} className="flex items-center">
              {renderLogo(sub.logoUrl, sub.serviceName)}
            </div>
          ))}
          {day.subscriptions.length > 2 && (
            <div className="text-xs text-gray-500">+{day.subscriptions.length - 2}</div>
          )}
        </div>
      </div>
    );
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="calendar-view p-6 max-w-7xl mx-auto">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h1>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Today
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card className="calendar-grid">
        <CardContent className="p-0">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center font-medium text-gray-500 bg-gray-50">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => (
              <CalendarDay key={index} day={day} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Details Modal */}
      <Dialog open={!!selectedSubscription} onOpenChange={() => setSelectedSubscription(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              {selectedSubscription && renderLogo(selectedSubscription.logoUrl, selectedSubscription.serviceName)}
              <span>{selectedSubscription?.serviceName}</span>
            </DialogTitle>
            <DialogDescription>
              {selectedSubscription?.category} • {formatCurrency(selectedSubscription?.cost, selectedSubscription?.currency)} / {selectedSubscription?.billingCycle}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Subscription Details</h3>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Start Date:</span>
                  <span>{selectedSubscription?.startDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Billing Cycle:</span>
                  <span>{selectedSubscription?.billingCycle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Cost:</span>
                  <span className="font-semibold">
                    {selectedSubscription && formatCurrency(selectedSubscription.cost, selectedSubscription.currency)}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Payment History</h3>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSubscription?.paymentHistory.map((payment, index) => (
                      <TableRow key={index}>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell>{formatCurrency(payment.amount, selectedSubscription.currency)}</TableCell>
                        <TableCell>
                          <Badge variant={payment.status === 'Paid' ? 'default' : 'secondary'}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSubscription(null)}>
              Close
            </Button>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

export default CalendarView;

