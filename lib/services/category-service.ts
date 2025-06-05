import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { Category } from '@/types/database'

export interface CreateCategoryData {
  categoryName: string
  parentCategoryId?: string
  sortOrder?: number
  temperatureZone?: string
}

export interface UpdateCategoryData {
  categoryName?: string
  parentCategoryId?: string | null
  sortOrder?: number
  temperatureZone?: string
}

export interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[]
  parent?: Category
}

/**
 * Client-side category management functions
 */
export const categoryServiceClient = {
  /**
   * Get all categories in hierarchical structure
   */
  async getCategoriesHierarchy(): Promise<CategoryWithChildren[]> {
    const supabase = createClient()
    
    // First get all categories
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('category_name', { ascending: true })

    if (error) throw new Error(error.message)
    
    // Build hierarchy
    const categoryMap = new Map<string, CategoryWithChildren>()
    const rootCategories: CategoryWithChildren[] = []
    
    // First pass: create all category objects
    categories?.forEach(cat => {
      categoryMap.set(cat.category_id, { ...cat, children: [] })
    })
    
    // Second pass: build hierarchy
    categories?.forEach(cat => {
      const category = categoryMap.get(cat.category_id)!
      
      if (cat.parent_category_id) {
        const parent = categoryMap.get(cat.parent_category_id)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(category)
          category.parent = parent
        }
      } else {
        rootCategories.push(category)
      }
    })
    
    return rootCategories
  },

  /**
   * Get all categories as flat list
   */
  async getAllCategories(): Promise<Category[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('category_name', { ascending: true })

    if (error) throw new Error(error.message)
    return data || []
  },

  /**
   * Get single category by ID
   */
  async getCategory(categoryId: string): Promise<Category | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('category_id', categoryId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message)
    }

    return data
  },

  /**
   * Get categories by temperature zone
   */
  async getCategoriesByZone(temperatureZone: string): Promise<Category[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('temperature_zone', temperatureZone)
      .order('sort_order', { ascending: true })

    if (error) throw new Error(error.message)
    return data || []
  }
}

/**
 * Server-side category management functions
 */
export const categoryServiceServer = {
  /**
   * Create new category
   */
  async createCategory(data: CreateCategoryData): Promise<Category> {
    const supabase = await createServerClient()
    
    // Get max sort order if not provided
    let sortOrder = data.sortOrder
    if (sortOrder === undefined) {
      const { data: maxSort } = await supabase
        .from('categories')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()
      
      sortOrder = (maxSort?.sort_order || 0) + 1
    }
    
    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        category_name: data.categoryName,
        parent_category_id: data.parentCategoryId,
        sort_order: sortOrder,
        temperature_zone: data.temperatureZone
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return category
  },

  /**
   * Update category
   */
  async updateCategory(categoryId: string, updates: UpdateCategoryData): Promise<Category> {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('categories')
      .update({
        category_name: updates.categoryName,
        parent_category_id: updates.parentCategoryId,
        sort_order: updates.sortOrder,
        temperature_zone: updates.temperatureZone
      })
      .eq('category_id', categoryId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  /**
   * Delete category
   * Note: This will fail if products are assigned to this category
   */
  async deleteCategory(categoryId: string): Promise<void> {
    const supabase = await createServerClient()
    
    // Check if category has children
    const { data: children } = await supabase
      .from('categories')
      .select('category_id')
      .eq('parent_category_id', categoryId)
      .limit(1)
    
    if (children && children.length > 0) {
      throw new Error('Cannot delete category with child categories')
    }
    
    // Check if products use this category
    const { data: products } = await supabase
      .from('product_catalog')
      .select('catalog_product_id')
      .eq('category_id', categoryId)
      .limit(1)
    
    if (products && products.length > 0) {
      throw new Error('Cannot delete category with assigned products')
    }
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('category_id', categoryId)

    if (error) throw new Error(error.message)
  },

  /**
   * Reorder categories
   */
  async reorderCategories(categoryOrders: { categoryId: string; sortOrder: number }[]): Promise<void> {
    const supabase = await createServerClient()
    
    // Update each category's sort order
    const promises = categoryOrders.map(({ categoryId, sortOrder }) =>
      supabase
        .from('categories')
        .update({ sort_order: sortOrder })
        .eq('category_id', categoryId)
    )
    
    const results = await Promise.all(promises)
    
    // Check for errors
    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      throw new Error(`Failed to reorder categories: ${errors[0].error?.message}`)
    }
  }
}