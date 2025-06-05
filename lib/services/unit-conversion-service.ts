import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { UnitConversion, MeasurementType } from '@/types/database'

export interface ConversionResult {
  success: boolean
  value?: number
  error?: string
}

/**
 * Client-side unit conversion functions
 */
export const unitConversionServiceClient = {
  /**
   * Get all unit conversions
   */
  async getAllConversions(): Promise<UnitConversion[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('unit_conversions')
      .select('*')

    if (error) throw new Error(error.message)
    return data || []
  },

  /**
   * Get all measurement types
   */
  async getMeasurementTypes(): Promise<MeasurementType[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('measurement_types')
      .select('*')
      .order('unit')

    if (error) throw new Error(error.message)
    return data || []
  },

  /**
   * Get measurement type for a unit
   */
  async getMeasurementType(unit: string): Promise<string | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('measurement_types')
      .select('measurement_type')
      .eq('unit', unit)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message)
    }

    return data?.measurement_type || null
  },

  /**
   * Convert between units
   */
  async convert(value: number, fromUnit: string, toUnit: string): Promise<ConversionResult> {
    if (fromUnit === toUnit) {
      return { success: true, value }
    }

    const supabase = createClient()
    
    // Get measurement types for validation
    const [fromType, toType] = await Promise.all([
      this.getMeasurementType(fromUnit),
      this.getMeasurementType(toUnit)
    ])

    if (!fromType || !toType) {
      return { 
        success: false, 
        error: `Unknown unit: ${!fromType ? fromUnit : toUnit}` 
      }
    }

    if (fromType !== toType) {
      return { 
        success: false, 
        error: `Cannot convert between ${fromType} and ${toType}` 
      }
    }

    // Try direct conversion
    const { data: directConversion } = await supabase
      .from('unit_conversions')
      .select('conversion_factor')
      .eq('from_unit', fromUnit)
      .eq('to_unit', toUnit)
      .single()

    if (directConversion) {
      return { 
        success: true, 
        value: value * directConversion.conversion_factor 
      }
    }

    // Try reverse conversion
    const { data: reverseConversion } = await supabase
      .from('unit_conversions')
      .select('conversion_factor')
      .eq('from_unit', toUnit)
      .eq('to_unit', fromUnit)
      .single()

    if (reverseConversion) {
      return { 
        success: true, 
        value: value / reverseConversion.conversion_factor 
      }
    }

    // Try two-step conversion through a common unit
    // This is a simplified approach - in production you might want a more sophisticated path-finding algorithm
    const { data: fromConversions } = await supabase
      .from('unit_conversions')
      .select('to_unit, conversion_factor')
      .eq('from_unit', fromUnit)

    const { data: toConversions } = await supabase
      .from('unit_conversions')
      .select('from_unit, conversion_factor')
      .eq('to_unit', toUnit)

    if (fromConversions && toConversions) {
      // Find common intermediate unit
      for (const fc of fromConversions) {
        const tc = toConversions.find(t => t.from_unit === fc.to_unit)
        if (tc) {
          const result = value * fc.conversion_factor * tc.conversion_factor
          return { success: true, value: result }
        }
      }
    }

    return { 
      success: false, 
      error: `No conversion path found from ${fromUnit} to ${toUnit}` 
    }
  },

  /**
   * Calculate total preferred units for distributor specs
   */
  calculateTotalPreferredUnits(
    casePacks: number,
    packSize: number,
    packUnit: string,
    preferredUnit: string
  ): Promise<ConversionResult> {
    const totalPackUnits = casePacks * packSize
    return this.convert(totalPackUnits, packUnit, preferredUnit)
  },

  /**
   * Get units by measurement type
   */
  async getUnitsByType(measurementType: 'weight' | 'volume' | 'count'): Promise<string[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('measurement_types')
      .select('unit')
      .eq('measurement_type', measurementType)
      .order('unit')

    if (error) throw new Error(error.message)
    return data?.map(d => d.unit) || []
  },

  /**
   * Validate if units are compatible for conversion
   */
  async areUnitsCompatible(unit1: string, unit2: string): Promise<boolean> {
    const [type1, type2] = await Promise.all([
      this.getMeasurementType(unit1),
      this.getMeasurementType(unit2)
    ])

    return type1 !== null && type1 === type2
  }
}

/**
 * Server-side unit conversion functions (mostly same as client)
 */
export const unitConversionServiceServer = {
  /**
   * Add custom unit conversion (admin function)
   */
  async addConversion(fromUnit: string, toUnit: string, conversionFactor: number): Promise<void> {
    const supabase = await createServerClient()
    
    // Add both directions
    const { error } = await supabase
      .from('unit_conversions')
      .insert([
        { from_unit: fromUnit, to_unit: toUnit, conversion_factor: conversionFactor },
        { from_unit: toUnit, to_unit: fromUnit, conversion_factor: 1 / conversionFactor }
      ])

    if (error) throw new Error(error.message)
  },

  /**
   * Add new measurement unit (admin function)
   */
  async addMeasurementUnit(unit: string, measurementType: 'weight' | 'volume' | 'count'): Promise<void> {
    const supabase = await createServerClient()
    
    const { error } = await supabase
      .from('measurement_types')
      .insert({ unit, measurement_type: measurementType })

    if (error) throw new Error(error.message)
    
    // Also add identity conversion
    await supabase
      .from('unit_conversions')
      .insert({ from_unit: unit, to_unit: unit, conversion_factor: 1 })
  }
}