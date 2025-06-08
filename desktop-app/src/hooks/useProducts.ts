import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface Product {
  catalog_product_id: string;
  product_name: string;
  category_id: string | null;
  preferred_measurement: string;
  measurement_type: 'weight' | 'volume' | 'count';
  description: string | null;
  is_active: boolean;
  last_modified: string | null;
  synced_at: string | null;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await invoke<Product[]>('get_all_products');
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchProducts();

    // Listen for product updates
    const unlisten = listen('products-updated', () => {
      console.log('Products updated, refreshing...');
      fetchProducts();
    });

    // Cleanup
    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts
  };
}