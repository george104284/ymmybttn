'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { productServiceClient, productServiceServer } from '@/lib/services/product-service'
import { categoryServiceClient } from '@/lib/services/category-service'
import { unitConversionServiceClient } from '@/lib/services/unit-conversion-service'
import { Category, ProductCatalog } from '@/types/database'

interface Props {
  params: {
    productId: string
  }
}

export default function EditProductPage({ params }: Props) {
  const [product, setProduct] = useState<ProductCatalog | null>(null)
  const [formData, setFormData] = useState({
    productName: '',
    categoryId: '',
    measurementType: 'weight' as 'weight' | 'volume' | 'count',
    preferredMeasurement: '',
    description: '',
    isActive: true
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [availableUnits, setAvailableUnits] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  const router = useRouter()

  useEffect(() => {
    loadProduct()
    loadCategories()
  }, [params.productId])

  useEffect(() => {
    if (formData.measurementType) {
      loadUnits()
    }
  }, [formData.measurementType])

  const loadProduct = async () => {
    try {
      const prod = await productServiceClient.getProduct(params.productId)
      if (!prod) {
        setError('Product not found')
        return
      }
      
      setProduct(prod)
      setFormData({
        productName: prod.product_name,
        categoryId: prod.category_id || '',
        measurementType: prod.measurement_type,
        preferredMeasurement: prod.preferred_measurement,
        description: prod.description || '',
        isActive: prod.is_active
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const cats = await categoryServiceClient.getAllCategories()
      setCategories(cats)
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  const loadUnits = async () => {
    try {
      const units = await unitConversionServiceClient.getUnitsByType(formData.measurementType)
      setAvailableUnits(units)
    } catch (err) {
      console.error('Failed to load units:', err)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    
    setFormData(prev => ({ ...prev, [name]: val }))
    // Clear validation error for this field
    setValidationErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.productName.trim()) {
      errors.productName = 'Product name is required'
    }
    
    if (!formData.preferredMeasurement) {
      errors.preferredMeasurement = 'Preferred measurement unit is required'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setSaving(true)
    setError('')

    try {
      await productServiceServer.updateProduct(params.productId, {
        productName: formData.productName.trim(),
        categoryId: formData.categoryId || null,
        measurementType: formData.measurementType,
        preferredMeasurement: formData.preferredMeasurement,
        description: formData.description.trim() || undefined,
        isActive: formData.isActive
      })
      
      router.push('/dashboard/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to deactivate this product?')) {
      return
    }
    
    setSaving(true)
    setError('')

    try {
      await productServiceServer.deactivateProduct(params.productId)
      router.push('/dashboard/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate product')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">Loading product...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Product not found</p>
        <Link href="/dashboard/products" className="text-blue-600 hover:text-blue-800">
          Back to products
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Edit Product</h3>
        <p className="mt-1 text-sm text-gray-600">
          Update product information in the global catalog
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="productName" className="block text-sm font-medium text-gray-700">
            Product Name *
          </label>
          <input
            type="text"
            id="productName"
            name="productName"
            value={formData.productName}
            onChange={handleInputChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.productName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., Tomatoes - Roma"
          />
          {validationErrors.productName && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.productName}</p>
          )}
        </div>

        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">No Category</option>
            {categories.map(cat => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.category_name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="measurementType" className="block text-sm font-medium text-gray-700">
              Measurement Type *
            </label>
            <select
              id="measurementType"
              name="measurementType"
              value={formData.measurementType}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="weight">Weight</option>
              <option value="volume">Volume</option>
              <option value="count">Count</option>
            </select>
          </div>

          <div>
            <label htmlFor="preferredMeasurement" className="block text-sm font-medium text-gray-700">
              Preferred Unit *
            </label>
            <select
              id="preferredMeasurement"
              name="preferredMeasurement"
              value={formData.preferredMeasurement}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.preferredMeasurement ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select Unit</option>
              {availableUnits.map(unit => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
            {validationErrors.preferredMeasurement && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.preferredMeasurement}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Optional product description"
          />
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Product is active</span>
          </label>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleDeactivate}
            disabled={saving || !formData.isActive}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Deactivate Product
          </button>
          
          <div className="flex space-x-3">
            <Link
              href="/dashboard/products"
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}