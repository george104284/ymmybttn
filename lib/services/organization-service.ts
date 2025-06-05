import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { Organization, Restaurant, User } from '@/types/database'

export interface CreateOrganizationData {
  organizationName: string
  billingEmail?: string
  primaryContactId: string
}

export interface UpdateOrganizationData {
  organizationName?: string
  billingEmail?: string
  primaryContactId?: string
}

export interface CreateRestaurantData {
  restaurantName: string
  organizationId: string
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  contactInfo?: {
    phone?: string
    email?: string
    website?: string
  }
}

export interface OrganizationWithRestaurants extends Organization {
  restaurants: Restaurant[]
  primary_contact?: User
}

/**
 * Client-side organization management functions
 */
export const organizationServiceClient = {
  /**
   * Get organizations the current user has access to
   */
  async getUserOrganizations(): Promise<OrganizationWithRestaurants[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        restaurants(*),
        primary_contact:users(user_id, full_name, email)
      `)
      .order('organization_name')

    if (error) throw new Error(error.message)
    return data as OrganizationWithRestaurants[]
  },

  /**
   * Get restaurants for organizations the user has access to
   */
  async getUserRestaurants(): Promise<Restaurant[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('is_active', true)
      .order('restaurant_name')

    if (error) throw new Error(error.message)
    return data as Restaurant[]
  },

  /**
   * Get specific organization by ID
   */
  async getOrganization(organizationId: string): Promise<OrganizationWithRestaurants | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        restaurants(*),
        primary_contact:users(user_id, full_name, email)
      `)
      .eq('organization_id', organizationId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message)
    }

    return data as OrganizationWithRestaurants
  }
}

/**
 * Server-side organization management functions
 */
export const organizationServiceServer = {
  /**
   * Create new organization
   */
  async createOrganization(data: CreateOrganizationData): Promise<Organization> {
    const supabase = await createServerClient()
    
    const { data: organization, error } = await supabase
      .from('organizations')
      .insert({
        organization_name: data.organizationName,
        billing_email: data.billingEmail,
        primary_contact_id: data.primaryContactId
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return organization as Organization
  },

  /**
   * Update organization
   */
  async updateOrganization(organizationId: string, updates: UpdateOrganizationData): Promise<Organization> {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as Organization
  },

  /**
   * Create new restaurant under organization
   */
  async createRestaurant(data: CreateRestaurantData): Promise<Restaurant> {
    const supabase = await createServerClient()
    
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .insert({
        restaurant_name: data.restaurantName,
        organization_id: data.organizationId,
        address: data.address,
        contact_info: data.contactInfo,
        is_active: true
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return restaurant as Restaurant
  },

  /**
   * Update restaurant
   */
  async updateRestaurant(restaurantId: string, updates: Partial<CreateRestaurantData>): Promise<Restaurant> {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('restaurants')
      .update({
        restaurant_name: updates.restaurantName,
        address: updates.address,
        contact_info: updates.contactInfo
      })
      .eq('restaurant_id', restaurantId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as Restaurant
  },

  /**
   * Deactivate restaurant
   */
  async deactivateRestaurant(restaurantId: string): Promise<void> {
    const supabase = await createServerClient()
    
    const { error } = await supabase
      .from('restaurants')
      .update({ is_active: false })
      .eq('restaurant_id', restaurantId)

    if (error) throw new Error(error.message)
  },

  /**
   * Get organization with restaurants by ID
   */
  async getOrganizationById(organizationId: string): Promise<OrganizationWithRestaurants | null> {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        restaurants(*),
        primary_contact:users(user_id, full_name, email)
      `)
      .eq('organization_id', organizationId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message)
    }

    return data as OrganizationWithRestaurants
  },

  /**
   * Check if user can manage organization
   */
  async canUserManageOrganization(userId: string, organizationId: string): Promise<boolean> {
    const supabase = await createServerClient()
    
    // Check if user is primary contact
    const { data: org } = await supabase
      .from('organizations')
      .select('primary_contact_id')
      .eq('organization_id', organizationId)
      .single()

    if (org?.primary_contact_id === userId) {
      return true
    }

    // Check if user has owner role in any restaurant in this organization
    const { data: assignments } = await supabase
      .from('user_assignments')
      .select(`
        *,
        restaurant:restaurants!inner(organization_id),
        user_type:user_types!inner(type_name)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('restaurants.organization_id', organizationId)
      .eq('user_types.type_name', 'owner')

    return assignments && assignments.length > 0
  }
}