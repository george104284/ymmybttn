import { invoke } from "@tauri-apps/api/core";

// Type definitions
export interface User {
  user_id: string;
  email: string;
  full_name: string;
  phone?: string;
  mobile?: string;
  preferred_contact_method?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface Restaurant {
  restaurant_id: string;
  restaurant_name: string;
  organization_id: string;
  address?: string;
  contact_info?: string;
  created_at: string;
  is_active: boolean;
}

export interface RestaurantProduct {
  restaurant_product_id: string;
  restaurant_id: string;
  catalog_product_id: string;
  custom_name?: string;
  par_level?: number;
  par_unit?: string;
  sort_order?: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface CurrentPrice {
  restaurant_id: string;
  catalog_product_id: string;
  distributor_id: string;
  case_price: number;
  total_preferred_units: number;
  unit_price: number;
  effective_date: string;
  distributor_name: string;
  product_name: string;
  is_winner: boolean;
}

// API wrapper functions
export const api = {
  // Test connection
  ping: async (): Promise<string> => {
    return await invoke<string>("ping");
  },

  // User operations
  getCurrentUser: async (): Promise<User | null> => {
    return await invoke<User | null>("get_current_user");
  },

  // Restaurant operations
  getRestaurants: async (): Promise<Restaurant[]> => {
    return await invoke<Restaurant[]>("get_restaurants");
  },

  // Product operations
  getRestaurantProducts: async (restaurantId: string): Promise<RestaurantProduct[]> => {
    return await invoke<RestaurantProduct[]>("get_restaurant_products", {
      restaurantId,
    });
  },

  // Price operations
  getCurrentPrices: async (restaurantId: string): Promise<CurrentPrice[]> => {
    return await invoke<CurrentPrice[]>("get_current_prices", {
      restaurantId,
    });
  },

  // Demo data
  initDemoData: async (): Promise<string> => {
    return await invoke<string>("init_demo_data");
  },
};

// Helper functions for data formatting
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};