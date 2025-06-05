import { NavLink } from "react-router-dom";

export function Sidebar() {
  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: "🏠" },
    { path: "/prices", label: "Prices", icon: "💰" },
    { path: "/import", label: "Import", icon: "📁" },
    { path: "/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white">
      <div className="p-4">
        <h1 className="text-2xl font-bold">ymmybttn</h1>
        <p className="text-sm text-gray-400 mt-1">Restaurant Inventory</p>
      </div>
      
      <nav className="mt-8">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gray-800 text-white border-l-4 border-blue-500"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <span className="mr-3 text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-400">Local Mode</p>
          <p className="text-sm font-medium mt-1">Not Synced</p>
          <button className="mt-3 w-full px-3 py-1 bg-blue-600 text-xs rounded hover:bg-blue-700">
            Sync Now
          </button>
        </div>
      </div>
    </div>
  );
}