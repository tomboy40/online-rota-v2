import { Link, useLocation, useFetcher } from "@remix-run/react";
import { Menu } from "@headlessui/react";
import { 
  EllipsisVerticalIcon, 
  StarIcon, 
  InformationCircleIcon,
  PencilIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import type { Calendar } from "~/utils/favorites";
import { removeFavorite } from "~/utils/favorites";
import EditCalendarDialog from './EditCalendarDialog';
import LoadingSpinner from './LoadingSpinner';
import { useState, useEffect } from "react";

interface CalendarLinkProps {
  calendar: Calendar;
  onRefreshCalendar?: () => void;
}

export default function CalendarLink({ calendar, onRefreshCalendar }: CalendarLinkProps) {
  const location = useLocation();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const fetcher = useFetcher();
  
  const isRefreshing = fetcher.state === "submitting" || 
    (fetcher.state === "loading" && fetcher.formMethod === "POST");

  // Determine current view from URL
  const getCurrentView = () => {
    const path = location.pathname;
    if (path.includes("/calendar/day")) return "day";
    if (path.includes("/calendar/month")) return "month";
    if (path.includes("/calendar/week")) return "week";
    // Get the current view from the URL if we're already on a calendar page
    if (path.includes("/calendar/")) {
      return path.split("/calendar/")[1];
    }
    return "week"; // default to week view instead of day
  };

  const handleRemoveFavorite = () => {
    removeFavorite(calendar.id);
  };

  const handleRefreshCache = () => {
    fetcher.submit(
      { calendarId: calendar.id },
      { method: "post", action: "/calendar/refresh-cache" }
    );
  };

  // Add useEffect to watch fetcher state
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success && onRefreshCalendar) {
      onRefreshCalendar();
    }
  }, [fetcher.state, fetcher.data, onRefreshCalendar]);

  return (
    <>
      <div className="group flex items-center justify-between px-6 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-lg relative">
        {isRefreshing && <LoadingSpinner fullScreen={false} />}
        <Link
          to={`/calendar/${getCurrentView()}?calendarId=${calendar.id}`}
          state={{ calendarName: calendar.name }}
          prefetch="intent"
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
                  onClick={handleRefreshCache}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex w-full items-center px-4 py-2 text-sm text-gray-700 text-left`}
                >
                  <ArrowPathIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                  Refresh
                </button>
              )}
            </Menu.Item>            
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => setIsEditDialogOpen(true)}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex w-full items-center px-4 py-2 text-sm text-gray-700 text-left`}
                >
                  <PencilIcon className="mr-3 h-5 w-5 text-gray-400" aria-hidden="true" />
                  Edit
                </button>
              )}
            </Menu.Item>
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
                  View application
                </Link>
              )}
            </Menu.Item>
          </Menu.Items>
        </Menu>
      </div>

      <EditCalendarDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        calendar={calendar}
      />
    </>
  );
}