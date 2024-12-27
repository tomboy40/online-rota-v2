import { useLoaderData, useSearchParams } from "@remix-run/react";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { useState, useEffect } from "react";
import { addFavorite, removeFavorite, isFavorite, type Calendar } from "~/utils/favorites";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.toLowerCase() || "";

  if (!query) {
    return json({ calendars: [] });
  }

  const calendars = await db.calendar.findMany({
    where: {
      OR: [
        { id: { contains: query } },
        { name: { contains: query } }
      ]
    }
  });

  return json({ calendars });
}

export default function Search() {
  const { calendars } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Initialize favorites state
    const favoritesState: { [key: string]: boolean } = {};
    calendars.forEach((calendar) => {
      favoritesState[calendar.id] = isFavorite(calendar.id);
    });
    setFavorites(favoritesState);
  }, [calendars]);

  const toggleFavorite = (calendar: Calendar) => {
    const newState = !favorites[calendar.id];
    setFavorites(prev => ({ ...prev, [calendar.id]: newState }));
    
    if (newState) {
      addFavorite(calendar);
    } else {
      removeFavorite(calendar.id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search Results */}
      <div className="flex-1 overflow-auto">
        {query && calendars.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            No results found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {calendars.map((calendar) => (
              <div key={calendar.id} className="flex items-center py-3 px-4 hover:bg-gray-50">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{calendar.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">ID: {calendar.id}</p>
                </div>
                <button
                  onClick={() => toggleFavorite(calendar)}
                  className="ml-4 p-1 rounded-full hover:bg-gray-100"
                  aria-label={favorites[calendar.id] ? "Remove from favorites" : "Add to favorites"}
                >
                  <svg
                    className={`h-6 w-6 ${favorites[calendar.id] ? 'text-yellow-400 fill-current' : 'text-gray-400'}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    fill="none"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 