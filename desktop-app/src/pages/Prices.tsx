import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useProducts } from "../hooks/useProducts";
import { SyncStatus } from "../components/SyncStatus";

interface Restaurant {
  restaurant_id: string;
  restaurant_name: string;
}

interface LocalCurrentPrice {
  price_id: string;
  restaurant_id: string;
  catalog_product_id: string;
  distributor_id: string;
  case_price: number;
  total_preferred_units: number;
  unit_price: number;
  effective_date: string;
  source_type: string;
}


interface Distributor {
  distributor_id: string;
  distributor_name: string;
}

export function Prices() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("");
  const [prices, setPrices] = useState<LocalCurrentPrice[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use the products hook for real-time synced products
  const { products, loading: productsLoading, error: productsError } = useProducts();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedRestaurant) {
      loadPrices(selectedRestaurant);
    }
  }, [selectedRestaurant]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [restaurantsData, distributorsData] = await Promise.all([
        invoke<Restaurant[]>("get_restaurants"),
        invoke<Distributor[]>("get_distributors"),
      ]);

      setRestaurants(restaurantsData);
      setDistributors(distributorsData);

      // Auto-select first restaurant
      if (restaurantsData.length > 0) {
        setSelectedRestaurant(restaurantsData[0].restaurant_id);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPrices = async (restaurantId: string) => {
    try {
      const pricesData = await invoke<LocalCurrentPrice[]>("get_current_prices", {
        restaurantId,
      });
      setPrices(pricesData);
    } catch (err) {
      console.error("Failed to load prices:", err);
      setError(err instanceof Error ? err.message : "Failed to load prices");
    }
  };

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.catalog_product_id === productId);
    return product?.product_name || "Unknown Product";
  };

  const getProductUnit = (productId: string) => {
    const product = products.find((p) => p.catalog_product_id === productId);
    return product?.preferred_measurement || "";
  };

  const getDistributorName = (distributorId: string) => {
    const distributor = distributors.find((d) => d.distributor_id === distributorId);
    return distributor?.distributor_name || "Unknown Distributor";
  };

  // Group prices by product and find winner
  const groupedPrices = prices.reduce((acc, price) => {
    const key = price.catalog_product_id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(price);
    return acc;
  }, {} as Record<string, LocalCurrentPrice[]>);

  // Find winner for each product (lowest unit price)
  const winners = Object.entries(groupedPrices).reduce((acc, [productId, productPrices]) => {
    const winner = productPrices.reduce((min, price) => 
      price.unit_price < min.unit_price ? price : min
    );
    acc[productId] = winner.distributor_id;
    return acc;
  }, {} as Record<string, string>);

  if (isLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading prices...</div>
      </div>
    );
  }

  if (error || productsError) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error</p>
          <p className="text-sm">{error || productsError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Current Prices</h1>
          <div className="mt-2">
            <SyncStatus />
          </div>
        </div>
        {restaurants.length > 0 && (
          <select
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {restaurants.map((restaurant) => (
              <option key={restaurant.restaurant_id} value={restaurant.restaurant_id}>
                {restaurant.restaurant_name}
              </option>
            ))}
          </select>
        )}
      </div>

      {Object.entries(groupedPrices).map(([productId, productPrices]) => (
        <div key={productId} className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium">{getProductName(productId)}</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productPrices.map((price) => {
                const isWinner = winners[productId] === price.distributor_id;
                return (
                  <div
                    key={price.price_id}
                    className={`border rounded-lg p-4 ${
                      isWinner
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {getDistributorName(price.distributor_id)}
                        </h3>
                        <div className="mt-2 space-y-1">
                          <p className="text-2xl font-bold text-gray-900">
                            ${price.case_price.toFixed(2)}
                            <span className="text-sm font-normal text-gray-500">/case</span>
                          </p>
                          <p className="text-sm text-gray-600">
                            ${price.unit_price.toFixed(2)}/{getProductUnit(productId)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {price.total_preferred_units} {getProductUnit(productId)}/case
                          </p>
                        </div>
                      </div>
                      {isWinner && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Best Price
                        </span>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Effective: {new Date(price.effective_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Source: {price.source_type.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {prices.length === 0 && (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-500">No prices found for this restaurant.</p>
            <p className="text-sm text-gray-400 mt-2">
              Import a CSV file to add pricing data.
            </p>
          </div>

          {products.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium">Available Products ({products.length})</h2>
                <p className="text-sm text-gray-500 mt-1">These products are synced from the web catalog</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <div key={product.catalog_product_id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900">{product.product_name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Measurement: {product.preferred_measurement} ({product.measurement_type})
                      </p>
                      {product.description && (
                        <p className="text-sm text-gray-500 mt-2">{product.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
