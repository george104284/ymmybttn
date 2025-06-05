import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Prices } from "./pages/Prices";
import { Import } from "./pages/Import";
import { Settings } from "./pages/Settings";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Test the connection to the backend
    const testConnection = async () => {
      try {
        const response = await invoke<string>("ping");
        console.log("Backend connection successful:", response);
        
        // Initialize demo data if needed
        const result = await invoke<string>("init_demo_data");
        console.log("Demo data result:", result);
        
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to connect to backend:", err);
        // Show more detail about the error
        if (typeof err === 'string') {
          setError(err);
        } else if (err instanceof Error) {
          setError(err.message);
        } else if (err && typeof err === 'object' && 'message' in err) {
          setError(String(err.message));
        } else {
          setError(JSON.stringify(err));
        }
        setIsLoading(false);
      }
    };

    testConnection();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-red-600">
            <h2 className="text-xl font-bold mb-2">Database Connection Error</h2>
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-sm">{error}</p>
            </div>
            <div className="text-gray-600 text-sm">
              <p className="mb-2">This usually means:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>The app cannot create its data directory</li>
                <li>Permission issues with the file system</li>
                <li>The database file is locked by another process</li>
              </ul>
              <p className="mt-4">Check the terminal for more details.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="prices" element={<Prices />} />
          <Route path="import" element={<Import />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;