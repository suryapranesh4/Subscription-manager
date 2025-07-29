import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, X } from 'lucide-react';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { DatePicker } from './ui/date-picker';
import { subscriptionService } from '../lib/subscription-service';

const subscriptionSchema = z.object({
  serviceName: z.string().min(1, 'Service name is required'),
  monthlyCost: z.number().min(0, 'Cost must be a positive number'),
  billingCycle: z.enum(['Monthly', 'Yearly', 'Custom']),
  startDate: z.date(),
  category: z.enum(['Entertainment', 'Productivity', 'Health', 'Finance', 'Education', 'Other']),
});

const CATEGORIES = [
  'Entertainment',
  'Productivity', 
  'Health',
  'Finance',
  'Education',
  'Other'
];

const BILLING_CYCLES = [
  'Monthly',
  'Yearly',
  'Custom'
];

export function SubscriptionForm({ subscription, onSubmit, onCancel, userId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(subscription?.logoUrl || null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const form = useForm({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      serviceName: subscription?.serviceName || '',
      monthlyCost: subscription?.monthlyCost || 0,
      billingCycle: subscription?.billingCycle || 'Monthly',
      startDate: subscription?.startDate ? new Date(subscription.startDate) : new Date(),
      category: subscription?.category || 'Entertainment',
    },
  });

  const handleLogoUpload = async (file) => {
    if (!file) return null;
    
    try {
      const result = await subscriptionService.uploadLogo(file);
      return result.logoUrl;
    } catch (error) {
      console.error('Logo upload failed:', error);
      return null;
    }
  };

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      let logoUrl = subscription?.logoUrl || null;
      
      if (logoFile) {
        logoUrl = await handleLogoUpload(logoFile);
      }
      
      const subscriptionData = {
        ...data,
        userId,
        logoUrl,
      };
      
      await onSubmit(subscriptionData);
    } catch (error) {
      console.error('Form submission failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="serviceName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Name</FormLabel>
              <FormControl>
                <Input placeholder="Netflix, Spotify, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="monthlyCost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Cost</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="9.99"
                    className="pl-8"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="billingCycle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Billing Cycle</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select billing cycle" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BILLING_CYCLES.map((cycle) => (
                    <SelectItem key={cycle} value={cycle}>
                      {cycle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <DatePicker
                  selected={field.value}
                  onSelect={field.onChange}
                  placeholder="Pick start date"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Label>Logo (Optional)</Label>
          <div
            className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
              dragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-slate-300 hover:border-slate-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            {logoPreview ? (
              <div className="space-y-2">
                <div className="flex justify-center">
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-16 h-16 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-1 -right-1 h-5 w-5"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLogo();
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-slate-600">
                  Click to change or drag a new image
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-center">
                  <div className="rounded-full bg-slate-100 p-3">
                    <Upload className="h-6 w-6 text-slate-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Drop an image here, or click to select
                  </p>
                  <p className="text-xs text-slate-500">
                    PNG, JPG, WebP up to 10MB
                  </p>
                </div>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : subscription ? 'Update' : 'Create'} Subscription
          </Button>
        </div>
      </form>
    </Form>
  );
}
