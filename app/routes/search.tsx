import { useLoaderData, useSearchParams } from "@remix-run/react";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { db } from "~/utils/db.server";

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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 