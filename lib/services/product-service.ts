import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { ProductCatalog, Category } from '@/types/database'
import { unitConversionServiceClient } from './unit-conversion-service'

export interface CreateProductData {
  productName: string
  categoryId?: string
  preferredMeasurement: string
  measurementType: 'weight' | 'volume' | 'count'
  description?: string
}

export interface UpdateProductData {
  productName?: string
  categoryId?: string | null
  preferredMeasurement?: string
  measurementType?: 'weight' | 'volume' | 'count'
  description?: string
  isActive?: boolean
}

export interface ProductWithCategory extends ProductCatalog {
  category?: Category
}

export interface ProductSearchParams {
  search?: string
  categoryId?: string
  measurementType?: 'weight' | 'volume' | 'count'
  isActive?: boolean
  limit?: number
  offset?: number
}

/**
 * Client-side product catalog functions
 */
export const productServiceClient = {
  /**
   * Search products with filters
   */
  async searchProducts(params: ProductSearchParams = {}): Promise<{
    products: ProductWithCategory[]
    count: number
  }> {
    const supabase = createClient()
    
    let query = supabase
      .from('product_catalog')
      .select(`
        *,
        category:categories(*)
      `, { count: 'exact' })
    
    // Apply filters
    if (params.search) {
      query = query.ilike('product_name', `%${params.search}%`)
    }
    
    if (params.categoryId) {
      query = query.eq('category_id', params.categoryId)
    }
    
    if (params.measurementType) {
      query = query.eq('measurement_type', params.measurementType)
    }
    
    if (params.isActive !== undefined) {
      query = query.eq('is_active', params.isActive)
    }
    
    // Apply pagination
    if (params.limit) {
      query = query.limit(params.limit)
    }
    
    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 50) - 1)
    }
    
    // Order by name
    query = query.order('product_name')
    
    const { data, error, count } = await query
    
    if (error) throw new Error(error.message)
    
    return {
      products: data as ProductWithCategory[],
      count: count || 0
    }
  },

  /**
   * Get single product by ID
   */
  async getProduct(productId: string): Promise<ProductWithCategory | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('product_catalog')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('catalog_product_id', productId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message)
    }

    return data as ProductWithCategory
  },

  /**
   * Get all products (for dropdowns, etc)
   */
  async getAllProducts(activeOnly: boolean = true): Promise<ProductCatalog[]> {
    const supabase = createClient()
    
    let query = supabase
      .from('product_catalog')
      .select('*')
      .order('product_name')
    
    if (activeOnly) {
      query = query.eq('is_active', true)
    }
    
    const { data, error } = await query
    
    if (error) throw new Error(error.message)
    return data || []
  },

  /**
   * Get products by category
   */
  async getProductsByCategory(categoryId: string): Promise<ProductWithCategory[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('product_catalog')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('product_name')

    if (error) throw new Error(error.message)
    return data as ProductWithCategory[]
  },

  /**
   * Validate product name uniqueness
   */
  async isProductNameUnique(productName: string, excludeId?: string): Promise<boolean> {
    const supabase = createClient()
    
    let query = supabase
      .from('product_catalog')
      .select('catalog_product_id')
      .ilike('product_name', productName)
    
    if (excludeId) {
      query = query.neq('catalog_product_id', excludeId)
    }
    
    const { data, error } = await query
    
    if (error) throw new Error(error.message)
    return !data || data.length === 0
  },

  /**
   * Validate measurement unit
   */
  async validateMeasurementUnit(unit: string, measurementType: string): Promise<boolean> {
    const actualType = await unitConversionServiceClient.getMeasurementType(unit)
    return actualType === measurementType
  }
}

/**
 * Server-side product catalog functions
 */
export const productServiceServer = {
  /**
   * Create new product
   */
  async createProduct(data: CreateProductData): Promise<ProductCatalog> {
    const supabase = await createServerClient()
    
    // Validate measurement unit matches type
    const isValid = await productServiceClient.validateMeasurementUnit(
      data.preferredMeasurement,
      data.measurementType
    )
    
    if (!isValid) {
      throw new Error(`Unit ${data.preferredMeasurement} is not valid for ${data.measurementType}`)
    }
    
    // Check name uniqueness
    const isUnique = await productServiceClient.isProductNameUnique(data.productName)
    if (!isUnique) {
      throw new Error('Product name already exists')
    }
    
    const { data: product, error } = await supabase
      .from('product_catalog')
      .insert({
        product_name: data.productName,
        category_id: data.categoryId,
        preferred_measurement: data.preferredMeasurement,
        measurement_type: data.measurementType,
        description: data.description,
        is_active: true
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return product
  },

  /**
   * Update product
   */
  async updateProduct(productId: string, updates: UpdateProductData): Promise<ProductCatalog> {
    const supabase = await createServerClient()
    
    // If changing measurement, validate it
    if (updates.preferredMeasurement && updates.measurementType) {
      const isValid = await productServiceClient.validateMeasurementUnit(
        updates.preferredMeasurement,
        updates.measurementType
      )
      
      if (!isValid) {
        throw new Error(`Unit ${updates.preferredMeasurement} is not valid for ${updates.measurementType}`)
      }
    }
    
    // If changing name, check uniqueness
    if (updates.productName) {
      const isUnique = await productServiceClient.isProductNameUnique(
        updates.productName,
        productId
      )
      if (!isUnique) {
        throw new Error('Product name already exists')
      }
    }
    
    const { data, error } = await supabase
      .from('product_catalog')
      .update({
        product_name: updates.productName,
        category_id: updates.categoryId,
        preferred_measurement: updates.preferredMeasurement,
        measurement_type: updates.measurementType,
        description: updates.description,
        is_active: updates.isActive,
        updated_at: new Date().toISOString()
      })
      .eq('catalog_product_id', productId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  /**
   * Deactivate product (soft delete)
   */
  async deactivateProduct(productId: string): Promise<void> {
    const supabase = await createServerClient()
    
    const { error } = await supabase
      .from('product_catalog')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('catalog_product_id', productId)

    if (error) throw new Error(error.message)
  },

  /**
   * Bulk import products
   */
  async bulkImportProducts(products: CreateProductData[]): Promise<{
    imported: number
    failed: { product: CreateProductData; error: string }[]
  }> {
    const supabase = await createServerClient()
    const results = {
      imported: 0,
      failed: [] as { product: CreateProductData; error: string }[]
    }
    
    // Process products one by one to handle validation
    for (const product of products) {
      try {
        // Validate measurement
        const isValid = await productServiceClient.validateMeasurementUnit(
          product.preferredMeasurement,
          product.measurementType
        )
        
        if (!isValid) {
          results.failed.push({
            product,
            error: `Invalid unit ${product.preferredMeasurement} for ${product.measurementType}`
          })
          continue
        }
        
        // Check uniqueness
        const isUnique = await productServiceClient.isProductNameUnique(product.productName)
        if (!isUnique) {
          results.failed.push({
            product,
            error: 'Product name already exists'
          })
          continue
        }
        
        // Insert product
        const { error } = await supabase
          .from('product_catalog')
          .insert({
            product_name: product.productName,
            category_id: product.categoryId,
            preferred_measurement: product.preferredMeasurement,
            measurement_type: product.measurementType,
            description: product.description,
            is_active: true
          })
        
        if (error) {
          results.failed.push({
            product,
            error: error.message
          })
        } else {
          results.imported++
        }
      } catch (err) {
        results.failed.push({
          product,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }
    
    return results
  }
}