// Core Reference Types
export interface UnitConversion {
  from_unit: string
  to_unit: string
  conversion_factor: number
}

export interface MeasurementType {
  unit: string
  measurement_type: 'weight' | 'volume' | 'count'
}

// Organization and User Types
export interface Organization {
  organization_id: string
  organization_name: string
  primary_contact_id?: string
  billing_email?: string
  created_at: string
}

export interface User {
  user_id: string
  email: string
  full_name: string
  phone?: string
  mobile?: string
  preferred_contact_method?: 'email' | 'text' | 'phone'
  is_active: boolean
  created_at: string
  updated_at: string
  last_login?: string
  auth_user_id?: string
}

export interface UserType {
  user_type_id: string
  type_name: 'owner' | 'gm' | 'manager' | 'chef' | 'distributor_sales' | 'viewer'
  description?: string
  base_permissions?: Record<string, any>
  created_at: string
}

export interface UserAssignment {
  assignment_id: string
  user_id: string
  user_type_id: string
  restaurant_id?: string
  distributor_id?: string
  custom_permissions?: Record<string, any>
  is_primary: boolean
  notes?: string
  assigned_at: string
  assigned_by?: string
  is_active: boolean
}

export interface Permission {
  permission_id: string
  permission_name: string
  permission_category?: string
  description?: string
}

// Restaurant and Distributor Types
export interface Restaurant {
  restaurant_id: string
  restaurant_name: string
  organization_id?: string
  address?: Record<string, any>
  contact_info?: Record<string, any>
  created_at: string
  is_active: boolean
}

export interface Distributor {
  distributor_id: string
  distributor_name: string
  distributor_code?: string
  contact_info?: Record<string, any>
  api_credentials?: Record<string, any>
  created_at: string
  is_active: boolean
}

export interface RestaurantDistributor {
  restaurant_id: string
  distributor_id: string
  account_number?: string
  delivery_days?: string[]
  is_active: boolean
}

export interface DistributorSalesContact {
  contact_id: string
  restaurant_id: string
  distributor_id: string
  contact_name: string
  email?: string
  phone?: string
  mobile?: string
  is_primary: boolean
  preferred_contact_method?: 'email' | 'text' | 'phone'
  notes?: string
  created_at: string
  is_active: boolean
}

// Product Catalog Types
export interface Category {
  category_id: string
  category_name: string
  parent_category_id?: string
  sort_order?: number
  temperature_zone?: string
  created_at: string
}

export interface ProductCatalog {
  catalog_product_id: string
  product_name: string
  category_id?: string
  preferred_measurement: string
  measurement_type: 'weight' | 'volume' | 'count'
  description?: string
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface RestaurantProduct {
  restaurant_product_id: string
  restaurant_id: string
  catalog_product_id: string
  custom_name?: string
  par_level?: number
  par_unit?: string
  sort_order?: number
  is_visible: boolean
  created_at: string
  updated_at: string
}

export interface DistributorProductSpec {
  spec_id: string
  catalog_product_id: string
  distributor_id: string
  distributor_item_code?: string
  case_packs: number
  pack_size: number
  pack_unit_of_measure: string
  total_preferred_units: number
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface ProductPreference {
  restaurant_id: string
  catalog_product_id: string
  preferred_distributor_id: string
  always_use_preferred: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface SubstitutionGroup {
  group_id: string
  restaurant_id: string
  group_name: string
  measurement_type: 'weight' | 'volume' | 'count'
  created_at: string
  is_active: boolean
}

export interface SubstitutionGroupMember {
  group_id: string
  catalog_product_id: string
  created_at: string
}

// Storage Location Types
export interface StorageRoom {
  room_id: string
  restaurant_id: string
  room_name: string
  room_type?: 'freezer' | 'refrigerator' | 'dry_storage'
  temperature_range?: string
  sort_order?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RoomLocation {
  location_id: string
  room_id: string
  location_name: string
  location_type?: 'wall' | 'shelf' | 'freezer' | 'rack' | 'bin'
  parent_location_id?: string
  sort_order?: number
  capacity_info?: Record<string, any>
  created_at: string
}

export interface ProductLocation {
  location_id: string
  restaurant_id: string
  catalog_product_id: string
  room_id: string
  room_location_id?: string
  location_notes?: string
  quantity_typically_stored?: string
  created_at: string
  updated_at: string
}

// Price and Event Types
export interface PriceEvent {
  event_id: string
  restaurant_id: string
  catalog_product_id: string
  distributor_id: string
  case_price: number
  total_preferred_units: number
  unit_price: number
  effective_date: string
  source_type: 'csv_import' | 'manual_entry' | 'invoice_scan' | 'api'
  source_document_id?: string
  source_file_hash?: string
  created_at: string
}

export interface CurrentPrice {
  restaurant_id: string
  catalog_product_id: string
  distributor_id: string
  case_price: number
  total_preferred_units: number
  unit_price: number
  effective_date: string
  source_type: string
}

export interface InvoiceScan {
  invoice_id: string
  restaurant_id: string
  distributor_id: string
  invoice_number?: string
  invoice_date?: string
  scan_file_url?: string
  ocr_data?: Record<string, any>
  processing_status?: string
  created_at: string
  processed_at?: string
}

// Order Types
export interface Order {
  order_id: string
  restaurant_id: string
  order_date: string
  processing_mode?: 'local' | 'cloud'
  total_amount?: number
  created_at: string
  submitted_at?: string
  status?: 'draft' | 'submitted' | 'completed' | 'cancelled'
}

export interface OrderItem {
  order_item_id: string
  order_id: string
  catalog_product_id: string
  selected_distributor_id: string
  quantity?: number
  case_price?: number
  total_preferred_units?: number
  unit_price?: number
  extended_price?: number
  price_effective_date?: string
  was_substitution: boolean
  original_product_id?: string
}

export interface OrderExport {
  export_id: string
  order_id: string
  distributor_id: string
  export_format?: 'csv' | 'email' | 'text'
  export_file_url?: string
  email_sent_to?: string
  text_sent_to?: string
  export_status?: 'pending' | 'sent' | 'failed'
  created_at: string
  sent_at?: string
  error_message?: string
}

export interface OrderExportConfig {
  config_id: string
  restaurant_id: string
  distributor_id: string
  export_format: 'csv' | 'email' | 'text'
  csv_column_mapping?: Record<string, string>
  email_template?: string
  delivery_method?: 'download' | 'email' | 'text'
  auto_send: boolean
  send_to_contact_id?: string
  created_at: string
  updated_at: string
}

// Subscription Types
export interface SubscriptionPlan {
  plan_id: string
  plan_name: string
  max_restaurants: number
  max_users?: number
  price_monthly: number
  price_annual?: number
  features?: Record<string, any>
  is_active: boolean
  created_at: string
}

export interface Subscription {
  subscription_id: string
  organization_id: string
  plan_id: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  stripe_subscription_id?: string
  created_at: string
  updated_at: string
}

export interface SubscriptionUsage {
  usage_id: string
  subscription_id: string
  usage_type: 'restaurants_count' | 'users_count'
  usage_value: number
  recorded_at: string
}

// View Types
export interface SubscriptionStatus {
  organization_id: string
  subscription_id: string
  status: string
  current_period_end: string
  plan_name: string
  max_restaurants: number
  max_users?: number
  features?: Record<string, any>
  current_restaurants: number
  current_users: number
  can_add_restaurant: boolean
  can_add_user: boolean
}

export interface OrderItemByDistributor {
  order_id: string
  restaurant_id: string
  selected_distributor_id: string
  product_name: string
  custom_name?: string
  display_name: string
  distributor_item_code?: string
  case_quantity?: number
  location_info: string
  case_price?: number
  extended_price?: number
}