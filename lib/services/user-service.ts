import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { User, UserType, UserAssignment } from '@/types/database'

export interface CreateUserData {
  email: string
  fullName: string
  phone?: string
  mobile?: string
  preferredContactMethod?: 'email' | 'text' | 'phone'
  authUserId: string
}

export interface UpdateUserData {
  fullName?: string
  phone?: string
  mobile?: string
  preferredContactMethod?: 'email' | 'text' | 'phone'
  isActive?: boolean
}

export interface UserWithAssignments extends User {
  assignments: (UserAssignment & {
    user_type: UserType
    restaurant?: { restaurant_id: string; restaurant_name: string }
    distributor?: { distributor_id: string; distributor_name: string }
  })[]
}

/**
 * Client-side user management functions
 */
export const userServiceClient = {
  /**
   * Create or update user in our users table (called after Supabase Auth signup)
   */
  async syncUserFromAuth(authUser: any) {
    const supabase = createClient()
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .single()

    if (existingUser) {
      // Update last login
      const { data, error } = await supabase
        .from('users')
        .update({ 
          last_login: new Date().toISOString(),
          email: authUser.email // In case email was changed in auth
        })
        .eq('auth_user_id', authUser.id)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    } else {
      // Create new user record
      const userData: Partial<User> = {
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email,
        phone: authUser.user_metadata?.phone,
        mobile: authUser.user_metadata?.mobile,
        preferred_contact_method: authUser.user_metadata?.preferred_contact_method || 'email',
        auth_user_id: authUser.id,
        is_active: true,
        last_login: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    }
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<UserWithAssignments | null> {
    const supabase = createClient()
    
    // Get auth user first
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return null

    // Get user profile with assignments
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        assignments:user_assignments!inner(
          *,
          user_type:user_types(*),
          restaurant:restaurants(restaurant_id, restaurant_name),
          distributor:distributors(distributor_id, distributor_name)
        )
      `)
      .eq('auth_user_id', authUser.id)
      .eq('user_assignments.is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(error.message)
    }

    return user as UserWithAssignments
  },

  /**
   * Update current user profile
   */
  async updateCurrentUser(updates: UpdateUserData) {
    const supabase = createClient()
    
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('users')
      .update({
        full_name: updates.fullName,
        phone: updates.phone,
        mobile: updates.mobile,
        preferred_contact_method: updates.preferredContactMethod,
        is_active: updates.isActive,
        updated_at: new Date().toISOString()
      })
      .eq('auth_user_id', authUser.id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  /**
   * Get users for restaurants the current user has access to
   */
  async getRestaurantUsers(restaurantId: string) {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        assignments:user_assignments!inner(
          *,
          user_type:user_types(*)
        )
      `)
      .eq('user_assignments.restaurant_id', restaurantId)
      .eq('user_assignments.is_active', true)
      .eq('is_active', true)

    if (error) throw new Error(error.message)
    return data as UserWithAssignments[]
  },

  /**
   * Get all user types
   */
  async getUserTypes() {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('user_types')
      .select('*')
      .order('type_name')

    if (error) throw new Error(error.message)
    return data as UserType[]
  }
}

/**
 * Server-side user management functions
 */
export const userServiceServer = {
  /**
   * Create user (admin function)
   */
  async createUser(userData: CreateUserData): Promise<User> {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: userData.email,
        full_name: userData.fullName,
        phone: userData.phone,
        mobile: userData.mobile,
        preferred_contact_method: userData.preferredContactMethod || 'email',
        auth_user_id: userData.authUserId,
        is_active: true
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as User
  },

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserWithAssignments | null> {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        assignments:user_assignments(
          *,
          user_type:user_types(*),
          restaurant:restaurants(restaurant_id, restaurant_name),
          distributor:distributors(distributor_id, distributor_name)
        )
      `)
      .eq('user_id', userId)
      .eq('user_assignments.is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message)
    }

    return data as UserWithAssignments
  },

  /**
   * Update user (admin function)
   */
  async updateUser(userId: string, updates: UpdateUserData): Promise<User> {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as User
  },

  /**
   * Assign user to restaurant with role
   */
  async assignUserToRestaurant(
    userId: string, 
    restaurantId: string, 
    userTypeId: string,
    assignedBy: string,
    isPrimary: boolean = false,
    customPermissions?: Record<string, any>,
    notes?: string
  ): Promise<UserAssignment> {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('user_assignments')
      .insert({
        user_id: userId,
        restaurant_id: restaurantId,
        user_type_id: userTypeId,
        is_primary: isPrimary,
        custom_permissions: customPermissions,
        notes,
        assigned_by: assignedBy,
        is_active: true
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as UserAssignment
  },

  /**
   * Remove user assignment
   */
  async removeUserAssignment(assignmentId: string): Promise<void> {
    const supabase = await createServerClient()
    
    const { error } = await supabase
      .from('user_assignments')
      .update({ is_active: false })
      .eq('assignment_id', assignmentId)

    if (error) throw new Error(error.message)
  },

  /**
   * Get current user from server context
   */
  async getCurrentServerUser(): Promise<UserWithAssignments | null> {
    const supabase = await createServerClient()
    
    // Get auth user
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return null

    // Get user profile
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        assignments:user_assignments(
          *,
          user_type:user_types(*),
          restaurant:restaurants(restaurant_id, restaurant_name),
          distributor:distributors(distributor_id, distributor_name)
        )
      `)
      .eq('auth_user_id', authUser.id)
      .eq('user_assignments.is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message)
    }

    return data as UserWithAssignments
  }
}