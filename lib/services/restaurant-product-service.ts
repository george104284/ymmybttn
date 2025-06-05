import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { RestaurantProduct, ProductCatalog, Category } from '@/types/database'

export interface CreateRestaurantProductData {
  restaurantId: string
  catalogProductId: string
  customName?: string
  parLevel?: number
  parUnit?: string
  sortOrder?: number
  isVisible?: boolean
}

export interface UpdateRestaurantProductData {
  customName?: string | null
  parLevel?: number | null
  parUnit?: string | null
  sortOrder?: number
  isVisible?: boolean
}

export interface RestaurantProductWithDetails extends RestaurantProduct {
  product: ProductCatalog & {
    category?: Category
  }
}

export interface BulkAssignData {
  restaurantId: string
  productIds: string[]
  defaultParLevel?: number
  defaultParUnit?: string
}

/**
 * Client-side restaurant product functions
 */
export const restaurantProductServiceClient = {
  /**
   * Get products assigned to a restaurant
   */
  async getRestaurantProducts(
    restaurantId: string,
    visibleOnly: boolean = true
  ): Promise<RestaurantProductWithDetails[]> {
    const supabase = createClient()
    
    let query = supabase
      .from('restaurant_products')
      .select(`
        *,
        product:product_catalog!inner(
          *,
          category:categories(*)
        )
      `)
      .eq('restaurant_id', restaurantId)
    
    if (visibleOnly) {
      query = query.eq('is_visible', true)
    }
    
    query = query.order('sort_order', { ascending: true })
    
    const { data, error } = await query
    
    if (error) throw new Error(error.message)
    return data as RestaurantProductWithDetails[]
  },

  /**
   * Get unassigned products for a restaurant
   */
  async getUnassignedProducts(restaurantId: string): Promise<ProductCatalog[]> {
    const supabase = createClient()
    
    // First get all assigned product IDs
    const { data: assigned } = await supabase
      .from('restaurant_products')
      .select('catalog_product_id')
      .eq('restaurant_id', restaurantId)
    
    const assignedIds = assigned?.map(a => a.catalog_product_id) || []
    
    // Get all active products not in assigned list
    let query = supabase
      .from('product_catalog')
      .select('*')
      .eq('is_active', true)
      .order('product_name')
    
    if (assignedIds.length > 0) {
      query = query.not('catalog_product_id', 'in', `(${assignedIds.join(',')})`)
    }
    
    const { data, error } = await query
    
    if (error) throw new Error(error.message)
    return data || []
  },

  /**
   * Get restaurant product by ID
   */
  async getRestaurantProduct(
    restaurantId: string,
    catalogProductId: string
  ): Promise<RestaurantProductWithDetails | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('restaurant_products')
      .select(`
        *,
        product:product_catalog(
          *,
          category:categories(*)
        )
      `)
      .eq('restaurant_id', restaurantId)
      .eq('catalog_product_id', catalogProductId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message)
    }

    return data as RestaurantProductWithDetails
  },

  /**
   * Search restaurant products
   */
  async searchRestaurantProducts(
    restaurantId: string,
    search: string,
    categoryId?: string
  ): Promise<RestaurantProductWithDetails[]> {
    const supabase = createClient()
    
    let query = supabase
      .from('restaurant_products')
      .select(`
        *,
        product:product_catalog!inner(
          *,
          category:categories(*)
        )
      `)
      .eq('restaurant_id', restaurantId)
      .eq('is_visible', true)
    
    // Search in both product name and custom name
    if (search) {
      query = query.or(
        `custom_name.ilike.%${search}%,product.product_name.ilike.%${search}%`
      )
    }
    
    if (categoryId) {
      query = query.eq('product.category_id', categoryId)
    }
    
    const { data, error } = await query.order('sort_order')
    
    if (error) throw new Error(error.message)
    return data as RestaurantProductWithDetails[]
  }
}

/**
 * Server-side restaurant product functions
 */
export const restaurantProductServiceServer = {
  /**
   * Assign product to restaurant
   */
  async assignProduct(data: CreateRestaurantProductData): Promise<RestaurantProduct> {
    const supabase = await createServerClient()
    
    // Get max sort order if not provided
    let sortOrder = data.sortOrder
    if (sortOrder === undefined) {
      const { data: maxSort } = await supabase
        .from('restaurant_products')
        .select('sort_order')
        .eq('restaurant_id', data.restaurantId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()
      
      sortOrder = (maxSort?.sort_order || 0) + 1
    }
    
    const { data: product, error } = await supabase
      .from('restaurant_products')
      .insert({
        restaurant_id: data.restaurantId,
        catalog_product_id: data.catalogProductId,
        custom_name: data.customName,
        par_level: data.parLevel,
        par_unit: data.parUnit,
        sort_order: sortOrder,
        is_visible: data.isVisible ?? true
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Product is already assigned to this restaurant')
      }
      throw new Error(error.message)
    }
    
    return product
  },

  /**
   * Update restaurant product
   */
  async updateRestaurantProduct(
    restaurantProductId: string,
    updates: UpdateRestaurantProductData
  ): Promise<RestaurantProduct> {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('restaurant_products')
      .update({
        custom_name: updates.customName,
        par_level: updates.parLevel,
        par_unit: updates.parUnit,
        sort_order: updates.sortOrder,
        is_visible: updates.isVisible,
        updated_at: new Date().toISOString()
      })
      .eq('restaurant_product_id', restaurantProductId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  /**
   * Remove product from restaurant
   */
  async removeProduct(restaurantId: string, catalogProductId: string): Promise<void> {
    const supabase = await createServerClient()
    
    const { error } = await supabase
      .from('restaurant_products')
      .delete()
      .eq('restaurant_id', restaurantId)
      .eq('catalog_product_id', catalogProductId)

    if (error) throw new Error(error.message)
  },

  /**
   * Bulk assign products to restaurant
   */
  async bulkAssignProducts(data: BulkAssignData): Promise<{
    assigned: number
    failed: string[]
  }> {
    const supabase = await createServerClient()
    const results = { assigned: 0, failed: [] as string[] }
    
    // Get current max sort order
    const { data: maxSort } = await supabase
      .from('restaurant_products')
      .select('sort_order')
      .eq('restaurant_id', data.restaurantId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()
    
    let currentSortOrder = (maxSort?.sort_order || 0) + 1
    
    // Process each product
    for (const productId of data.productIds) {
      const { error } = await supabase
        .from('restaurant_products')
        .insert({
          restaurant_id: data.restaurantId,
          catalog_product_id: productId,
          par_level: data.defaultParLevel,
          par_unit: data.defaultParUnit,
          sort_order: currentSortOrder++,
          is_visible: true
        })
      
      if (error) {
        results.failed.push(productId)
      } else {
        results.assigned++
      }
    }
    
    return results
  },

  /**
   * Toggle product visibility
   */
  async toggleVisibility(
    restaurantId: string,
    catalogProductId: string
  ): Promise<boolean> {
    const supabase = await createServerClient()
    
    // Get current visibility
    const { data: current } = await supabase
      .from('restaurant_products')
      .select('is_visible')
      .eq('restaurant_id', restaurantId)
      .eq('catalog_product_id', catalogProductId)
      .single()
    
    if (!current) throw new Error('Product not found')
    
    // Toggle it
    const newVisibility = !current.is_visible
    const { error } = await supabase
      .from('restaurant_products')
      .update({ 
        is_visible: newVisibility,
        updated_at: new Date().toISOString()
      })
      .eq('restaurant_id', restaurantId)
      .eq('catalog_product_id', catalogProductId)
    
    if (error) throw new Error(error.message)
    return newVisibility
  },

  /**
   * Reorder products
   */
  async reorderProducts(
    restaurantId: string,
    productOrders: { catalogProductId: string; sortOrder: number }[]
  ): Promise<void> {
    const supabase = await createServerClient()
    
    // Update each product's sort order
    const promises = productOrders.map(({ catalogProductId, sortOrder }) =>
      supabase
        .from('restaurant_products')
        .update({ 
          sort_order: sortOrder,
          updated_at: new Date().toISOString()
        })
        .eq('restaurant_id', restaurantId)
        .eq('catalog_product_id', catalogProductId)
    )
    
    const results = await Promise.all(promises)
    
    // Check for errors
    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      throw new Error(`Failed to reorder products: ${errors[0].error?.message}`)
    }
  }
}