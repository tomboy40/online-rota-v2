import { Link, useLocation } from "@remix-run/react";
import { Menu } from "@headlessui/react";
import { 
  EllipsisVerticalIcon, 
  StarIcon, 
  InformationCircleIcon 
} from '@heroicons/react/24/outline';
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
          <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
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
                <StarIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
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
                <InformationCircleIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                View app details
              </Link>
            )}
          </Menu.Item>
        </Menu.Items>
      </Menu>
    </div>
  );
}