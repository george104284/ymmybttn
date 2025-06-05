import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface Restaurant {
  restaurant_id: string;
  restaurant_name: string;
  organization_id: string;
}

interface Product {
  catalog_product_id: string;
  product_name: string;
  preferred_measurement: string;
  measurement_type: string;
}

interface Distributor {
  distributor_id: string;
  distributor_name: string;
  distributor_code?: string;
}

export function Dashboard() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load all data in parallel
      const [restaurantsData, productsData, distributorsData] = await Promise.all([
        invoke<Restaurant[]>("get_restaurants"),
        invoke<Product[]>("get_products"),
        invoke<Distributor[]>("get_distributors"),
      ]);

      setRestaurants(restaurantsData);
      setProducts(productsData);
      setDistributors(distributorsData);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error loading data</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Restaurants
          </h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {restaurants.length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Products
          </h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {products.length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Distributors
          </h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {distributors.length}
          </p>
        </div>
      </div>

      {/* Restaurants List */}
      {restaurants.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium">Your Restaurants</h2>
          </div>
          <ul className="divide-y divide-gray-200">
            {restaurants.map((restaurant) => (
              <li key={restaurant.restaurant_id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {restaurant.restaurant_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      ID: {restaurant.restaurant_id}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Products List */}
      {products.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium">Products Catalog</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Measurement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.catalog_product_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.preferred_measurement}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.measurement_type}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Get Started</h3>
        <p className="text-blue-700 mb-4">
          Your demo data is ready! You can now:
        </p>
        <ul className="list-disc list-inside text-blue-700 space-y-1">
          <li>View current prices in the Prices tab</li>
          <li>Import CSV files with distributor pricing</li>
          <li>Configure your settings and preferences</li>
        </ul>
      </div>
    </div>
  );
}
