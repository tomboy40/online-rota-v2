import { Link, useLocation } from "@remix-run/react";

export default function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-sm mb-8">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-gray-900">
            Calendar App
          </Link>
          
          <div className="flex gap-4">
            <Link
              to="/search-calendar"
              className={`px-4 py-2 rounded-md transition-colors ${
                isActive("/search-calendar")
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              Search
            </Link>
            <Link
              to="/add-calendar"
              className={`px-4 py-2 rounded-md transition-colors ${
                isActive("/add-calendar")
                  ? "bg-blue-500 text-white"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              Add Calendar
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 