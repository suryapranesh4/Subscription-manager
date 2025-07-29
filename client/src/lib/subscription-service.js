import { supabase } from './supabase';

const API_BASE_URL = 'http://localhost:3001/api';

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Helper function to get auth headers for FormData
const getAuthHeadersForFormData = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  return {
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const subscriptionService = {
  // Get all subscriptions for a user
  async getSubscriptions(userId) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/subscriptions/${userId}`, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }
  },

  // Get subscriptions for calendar view
  async getSubscriptionsForCalendar(userId, year, month) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/subscriptions/${userId}/calendar/${year}/${month}`, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch calendar subscriptions');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching calendar subscriptions:', error);
      throw error;
    }
  },

  // Create a new subscription
  async createSubscription(subscriptionData) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/subscriptions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(subscriptionData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  },

  // Update a subscription
  async updateSubscription(id, subscriptionData) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/subscriptions/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(subscriptionData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update subscription');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  },

  // Delete a subscription
  async deleteSubscription(id) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/subscriptions/${id}`, {
        method: 'DELETE',
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete subscription');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting subscription:', error);
      throw error;
    }
  },

  // Toggle subscription activation status
  async toggleSubscription(id) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/subscriptions/${id}/toggle`, {
        method: 'POST',
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle subscription');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error toggling subscription:', error);
      throw error;
    }
  },

  // Upload logo
  async uploadLogo(file) {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const headers = await getAuthHeadersForFormData();
      
      const response = await fetch(`${API_BASE_URL}/upload/logo`, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload logo');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  },

  // Delete logo
  async deleteLogo(fileName) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/upload/logo/${fileName}`, {
        method: 'DELETE',
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete logo');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting logo:', error);
      throw error;
    }
  },

  // Get user logos
  async getUserLogos() {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/upload/logos`, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user logos');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching user logos:', error);
      throw error;
    }
  }
};
