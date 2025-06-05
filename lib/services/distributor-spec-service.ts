import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { DistributorProductSpec, Distributor, ProductCatalog } from '@/types/database'
import { unitConversionServiceClient } from './unit-conversion-service'

export interface CreateDistributorSpecData {
  catalogProductId: string
  distributorId: string
  distributorItemCode?: string
  casePacks: number
  packSize: number
  packUnitOfMeasure: string
}

export interface UpdateDistributorSpecData {
  distributorItemCode?: string
  casePacks?: number
  packSize?: number
  packUnitOfMeasure?: string
  isActive?: boolean
}

export interface DistributorSpecWithDetails extends DistributorProductSpec {
  product: ProductCatalog
  distributor: Distributor
}

export interface CalculateTotalUnitsParams {
  casePacks: number
  packSize: number
  packUnit: string
  preferredUnit: string
}

/**
 * Client-side distributor spec functions
 */
export const distributorSpecServiceClient = {
  /**
   * Get specs for a product across all distributors
   */
  async getProductSpecs(catalogProductId: string): Promise<DistributorSpecWithDetails[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('distributor_product_specs')
      .select(`
        *,
        product:product_catalog(*),
        distributor:distributors(*)
      `)
      .eq('catalog_product_id', catalogProductId)
      .eq('is_active', true)
      .order('distributor.distributor_name')
    
    if (error) throw new Error(error.message)
    return data as DistributorSpecWithDetails[]
  },

  /**
   * Get specs for a distributor
   */
  async getDistributorSpecs(distributorId: string): Promise<DistributorSpecWithDetails[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('distributor_product_specs')
      .select(`
        *,
        product:product_catalog(*),
        distributor:distributors(*)
      `)
      .eq('distributor_id', distributorId)
      .eq('is_active', true)
      .order('product.product_name')
    
    if (error) throw new Error(error.message)
    return data as DistributorSpecWithDetails[]
  },

  /**
   * Get single spec
   */
  async getSpec(specId: string): Promise<DistributorSpecWithDetails | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('distributor_product_specs')
      .select(`
        *,
        product:product_catalog(*),
        distributor:distributors(*)
      `)
      .eq('spec_id', specId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message)
    }
    
    return data as DistributorSpecWithDetails
  },

  /**
   * Calculate total preferred units
   */
  async calculateTotalPreferredUnits(params: CalculateTotalUnitsParams): Promise<number> {
    const result = await unitConversionServiceClient.calculateTotalPreferredUnits(
      params.casePacks,
      params.packSize,
      params.packUnit,
      params.preferredUnit
    )
    
    if (!result.success || result.value === undefined) {
      throw new Error(result.error || 'Failed to calculate units')
    }
    
    return result.value
  },

  /**
   * Search specs by item code
   */
  async searchByItemCode(itemCode: string, distributorId?: string): Promise<DistributorSpecWithDetails[]> {
    const supabase = createClient()
    
    let query = supabase
      .from('distributor_product_specs')
      .select(`
        *,
        product:product_catalog(*),
        distributor:distributors(*)
      `)
      .ilike('distributor_item_code', `%${itemCode}%`)
      .eq('is_active', true)
    
    if (distributorId) {
      query = query.eq('distributor_id', distributorId)
    }
    
    const { data, error } = await query
    
    if (error) throw new Error(error.message)
    return data as DistributorSpecWithDetails[]
  },

  /**
   * Check if spec exists
   */
  async specExists(catalogProductId: string, distributorId: string): Promise<boolean> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('distributor_product_specs')
      .select('spec_id')
      .eq('catalog_product_id', catalogProductId)
      .eq('distributor_id', distributorId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message)
    }
    
    return !!data
  }
}

/**
 * Server-side distributor spec functions
 */
export const distributorSpecServiceServer = {
  /**
   * Create distributor spec
   */
  async createSpec(data: CreateDistributorSpecData): Promise<DistributorProductSpec> {
    const supabase = await createServerClient()
    
    // Check if spec already exists
    const exists = await distributorSpecServiceClient.specExists(
      data.catalogProductId,
      data.distributorId
    )
    
    if (exists) {
      throw new Error('Spec already exists for this product and distributor')
    }
    
    // Get product details for validation
    const { data: product } = await supabase
      .from('product_catalog')
      .select('preferred_measurement')
      .eq('catalog_product_id', data.catalogProductId)
      .single()
    
    if (!product) {
      throw new Error('Product not found')
    }
    
    // Calculate total preferred units
    const totalPreferredUnits = await distributorSpecServiceClient.calculateTotalPreferredUnits({
      casePacks: data.casePacks,
      packSize: data.packSize,
      packUnit: data.packUnitOfMeasure,
      preferredUnit: product.preferred_measurement
    })
    
    const { data: spec, error } = await supabase
      .from('distributor_product_specs')
      .insert({
        catalog_product_id: data.catalogProductId,
        distributor_id: data.distributorId,
        distributor_item_code: data.distributorItemCode,
        case_packs: data.casePacks,
        pack_size: data.packSize,
        pack_unit_of_measure: data.packUnitOfMeasure,
        total_preferred_units: totalPreferredUnits,
        is_active: true
      })
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return spec
  },

  /**
   * Update distributor spec
   */
  async updateSpec(specId: string, updates: UpdateDistributorSpecData): Promise<DistributorProductSpec> {
    const supabase = await createServerClient()
    
    // Get current spec and product info
    const { data: currentSpec } = await supabase
      .from('distributor_product_specs')
      .select(`
        *,
        product:product_catalog(preferred_measurement)
      `)
      .eq('spec_id', specId)
      .single()
    
    if (!currentSpec) {
      throw new Error('Spec not found')
    }
    
    // If pack details are changing, recalculate total units
    let totalPreferredUnits = currentSpec.total_preferred_units
    
    if (updates.casePacks !== undefined || 
        updates.packSize !== undefined || 
        updates.packUnitOfMeasure !== undefined) {
      
      totalPreferredUnits = await distributorSpecServiceClient.calculateTotalPreferredUnits({
        casePacks: updates.casePacks ?? currentSpec.case_packs,
        packSize: updates.packSize ?? currentSpec.pack_size,
        packUnit: updates.packUnitOfMeasure ?? currentSpec.pack_unit_of_measure,
        preferredUnit: currentSpec.product.preferred_measurement
      })
    }
    
    const { data, error } = await supabase
      .from('distributor_product_specs')
      .update({
        distributor_item_code: updates.distributorItemCode,
        case_packs: updates.casePacks,
        pack_size: updates.packSize,
        pack_unit_of_measure: updates.packUnitOfMeasure,
        total_preferred_units: totalPreferredUnits,
        is_active: updates.isActive,
        updated_at: new Date().toISOString()
      })
      .eq('spec_id', specId)
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return data
  },

  /**
   * Deactivate spec
   */
  async deactivateSpec(specId: string): Promise<void> {
    const supabase = await createServerClient()
    
    const { error } = await supabase
      .from('distributor_product_specs')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('spec_id', specId)
    
    if (error) throw new Error(error.message)
  },

  /**
   * Bulk import specs
   */
  async bulkImportSpecs(specs: CreateDistributorSpecData[]): Promise<{
    imported: number
    failed: { spec: CreateDistributorSpecData; error: string }[]
  }> {
    const results = {
      imported: 0,
      failed: [] as { spec: CreateDistributorSpecData; error: string }[]
    }
    
    // Process specs one by one
    for (const spec of specs) {
      try {
        await this.createSpec(spec)
        results.imported++
      } catch (err) {
        results.failed.push({
          spec,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }
    
    return results
  },

  /**
   * Copy specs between distributors
   */
  async copySpecs(
    fromDistributorId: string,
    toDistributorId: string,
    productIds?: string[]
  ): Promise<number> {
    const supabase = await createServerClient()
    
    // Get specs to copy
    let query = supabase
      .from('distributor_product_specs')
      .select('*')
      .eq('distributor_id', fromDistributorId)
      .eq('is_active', true)
    
    if (productIds && productIds.length > 0) {
      query = query.in('catalog_product_id', productIds)
    }
    
    const { data: specs } = await query
    
    if (!specs || specs.length === 0) {
      return 0
    }
    
    // Copy each spec
    let copied = 0
    for (const spec of specs) {
      try {
        const exists = await distributorSpecServiceClient.specExists(
          spec.catalog_product_id,
          toDistributorId
        )
        
        if (!exists) {
          await supabase
            .from('distributor_product_specs')
            .insert({
              catalog_product_id: spec.catalog_product_id,
              distributor_id: toDistributorId,
              distributor_item_code: spec.distributor_item_code,
              case_packs: spec.case_packs,
              pack_size: spec.pack_size,
              pack_unit_of_measure: spec.pack_unit_of_measure,
              total_preferred_units: spec.total_preferred_units,
              is_active: true
            })
          
          copied++
        }
      } catch (err) {
        // Continue on error
        console.error('Failed to copy spec:', err)
      }
    }
    
    return copied
  }
}