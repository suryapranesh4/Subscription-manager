import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscriptionService } from '../lib/subscription-service';
import { SubscriptionForm } from './SubscriptionForm';
import { SubscriptionCard } from './SubscriptionCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Plus, CreditCard } from 'lucide-react';

export function SubscriptionManager({ onSubscriptionChange }) {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState(null);

  useEffect(() => {
    if (user) {
      loadSubscriptions();
    } else {
      setSubscriptions([]);
      setLoading(false);
    }
  }, [user]);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await subscriptionService.getSubscriptions(user.id);
      setSubscriptions(data);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (subscriptionData) => {
    try {
      if (currentSubscription) {
        await subscriptionService.updateSubscription(currentSubscription.id, subscriptionData);
      } else {
        await subscriptionService.createSubscription(subscriptionData);
      }
      setDialogOpen(false);
      await loadSubscriptions();
      if (onSubscriptionChange) {
        onSubscriptionChange();
      }
    } catch (error) {
      console.error('Failed to save subscription:', error);
    }
  };

  const handleDelete = async () => {
    try {
      if (subscriptionToDelete) {
        await subscriptionService.deleteSubscription(subscriptionToDelete.id);
        setAlertDialogOpen(false);
        await loadSubscriptions();
        if (onSubscriptionChange) {
          onSubscriptionChange();
        }
      }
    } catch (error) {
      console.error('Failed to delete subscription:', error);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Subscription Manager</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Subscription</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{currentSubscription ? 'Edit Subscription' : 'Add Subscription'}</DialogTitle>
            </DialogHeader>
            <SubscriptionForm
              subscription={currentSubscription}
              userId={user.id}
              onSubmit={handleCreateOrUpdate}
              onCancel={() => {
                setDialogOpen(false);
                setCurrentSubscription(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      {subscriptions.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              No subscriptions yet
            </CardTitle>
            <CardDescription className="text-gray-600 max-w-md mx-auto">
              Start tracking your subscriptions to get insights into your spending and never miss a payment again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setCurrentSubscription(null)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Subscription
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onEdit={(subscription) => {
                setCurrentSubscription(subscription);
                setDialogOpen(true);
              }}
              onDelete={(subscription) => {
                setSubscriptionToDelete(subscription);
                setAlertDialogOpen(true);
              }}
              onToggle={async () => {
                await loadSubscriptions();
                if (onSubscriptionChange) {
                  onSubscriptionChange();
                }
              }}
            />
          ))}
        </div>
      )}
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this subscription? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end space-x-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 text-white" 
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

