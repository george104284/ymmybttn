import { useState, useEffect } from "react";
import { api, User } from "../lib/api";

export function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await api.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error("Failed to load user:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "profile"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab("sync")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "sync"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Sync Settings
            </button>
            <button
              onClick={() => setActiveTab("preferences")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "preferences"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Preferences
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "profile" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Profile Information</h2>
              {user ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{user.full_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{user.phone || "Not set"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mobile</label>
                    <p className="mt-1 text-sm text-gray-900">{user.mobile || "Not set"}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No user profile found.</p>
              )}
            </div>
          )}

          {activeTab === "sync" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Sync Settings</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  Automatic sync happens every Monday at 12:01 AM. Price data from the current
                  week will be uploaded to the cloud for historical tracking and analytics.
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Last Sync</h3>
                  <p className="text-sm text-gray-600">Never synced</p>
                </div>
                <div>
                  <h3 className="font-medium">Next Scheduled Sync</h3>
                  <p className="text-sm text-gray-600">Monday 12:01 AM</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Sync Now
                </button>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Application Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Dark Mode</h3>
                    <p className="text-sm text-gray-600">Use dark theme for the application</p>
                  </div>
                  <button className="relative inline-flex items-center h-6 rounded-full w-11 bg-gray-200">
                    <span className="sr-only">Enable dark mode</span>
                    <span className="translate-x-1 inline-block w-4 h-4 transform bg-white rounded-full" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Auto-start</h3>
                    <p className="text-sm text-gray-600">Launch ymmybttn when computer starts</p>
                  </div>
                  <button className="relative inline-flex items-center h-6 rounded-full w-11 bg-gray-200">
                    <span className="sr-only">Enable auto-start</span>
                    <span className="translate-x-1 inline-block w-4 h-4 transform bg-white rounded-full" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Notifications</h3>
                    <p className="text-sm text-gray-600">Show desktop notifications for important events</p>
                  </div>
                  <button className="relative inline-flex items-center h-6 rounded-full w-11 bg-blue-600">
                    <span className="sr-only">Enable notifications</span>
                    <span className="translate-x-6 inline-block w-4 h-4 transform bg-white rounded-full" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}