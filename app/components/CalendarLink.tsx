import { Link, useLocation } from "@remix-run/react";
import { Menu } from "@headlessui/react";
import type { Calendar } from "~/utils/favorites";
import { removeFavorite } from "~/utils/favorites";

interface CalendarLinkProps {
  calendar: Calendar;
}

export default function CalendarLink({ calendar }: CalendarLinkProps) {
  const location = useLocation();
  
  // Determine current view from URL
  const getCurrentView = () => {
    const path = location.pathname;
    if (path.includes("/calendar/day")) return "day";
    if (path.includes("/calendar/month")) return "month";
    if (path.includes("/calendar/week")) return "week";
    return "day"; // default to day view
  };

  const handleRemoveFavorite = () => {
    removeFavorite(calendar.id);
  };

  return (
    <div className="group flex items-center justify-between px-6 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
      <Link
        to={`/calendar/${getCurrentView()}?calendarId=${calendar.id}`}
        state={{ calendarName: calendar.name }}
        prefetch="none"
        className="flex-grow"
      >
        <span>{calendar.name}</span>
      </Link>

      <Menu as="div" className="relative">
        <Menu.Button className="flex items-center justify-center h-8 w-8 rounded-full text-gray-400 hover:text-gray-600">
          <svg
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </Menu.Button>

        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={handleRemoveFavorite}
                className={`${
                  active ? 'bg-gray-100' : ''
                } flex w-full items-center px-4 py-2 text-sm text-gray-700 text-left`}
              >
                <svg className="mr-3 h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 6L6 18" className="text-red-500" />
                </svg>
                Remove from Quick access
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <Link
                to={`/app-details?calendarId=${calendar.id}`}
                className={`${
                  active ? 'bg-gray-100' : ''
                } flex w-full items-center px-4 py-2 text-sm text-gray-700 text-left`}
              >
                <svg className="mr-3 h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                View app details
              </Link>
            )}
          </Menu.Item>
        </Menu.Items>
      </Menu>
    </div>
  );
}