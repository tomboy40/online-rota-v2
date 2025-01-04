import { Link, useLocation, useFetcher } from "@remix-run/react";
import { Menu, Switch } from "@headlessui/react";
import { 
  EllipsisVerticalIcon, 
  StarIcon, 
  InformationCircleIcon,
  PencilIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import type { Calendar } from "~/utils/favorites";
import { removeFavorite, updateCalendarColor, updateCalendarVisibility } from "~/utils/favorites";
import EditCalendarDialog from './EditCalendarDialog';
import LoadingSpinner from './LoadingSpinner';
import { useState, useEffect } from "react";
import { CalendarRefreshSpinner } from "~/routes/calendar.refresh-cache";
import { useLoading } from '~/contexts/LoadingContext';
import { ColorPicker } from './ColorPicker';

// Add type for refresh cache response
interface RefreshCacheResponse {
  success?: boolean;
  events?: any[];
  error?: string;
  details?: string;
  message?: string;
}

interface CalendarLinkProps {
  calendar: Calendar & { color?: string };
  onRefreshCalendar?: () => void;
  isVisible?: boolean;
  onVisibilityChange?: (calendarId: string, isVisible: boolean) => void;
  onColorChange?: (calendarId: string, color: string) => void;
}

export default function CalendarLink({ 
  calendar, 
  onRefreshCalendar,
  isVisible,
  onVisibilityChange,
  onColorChange
}: CalendarLinkProps) {
  const location = useLocation();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const fetcher = useFetcher<RefreshCacheResponse>();
  const { showLoading, hideLoading } = useLoading();
  
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

  const handleVisibilityChange = (checked: boolean) => {
    // First update the persistent storage
    updateCalendarVisibility(calendar.id, checked);
    
    // Then notify parent components via callback
    // Wrap in setTimeout to avoid state updates during render
    setTimeout(() => {
      onVisibilityChange?.(calendar.id, checked);
    }, 0);
  };

  // Update useEffect with proper typing
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success && onRefreshCalendar) {
      onRefreshCalendar();
    }
  }, [fetcher.state, fetcher.data, onRefreshCalendar]);

  useEffect(() => {
    if (isRefreshing) {
      showLoading('Loading calendar data...');
    } else {
      hideLoading();
    }
  }, [isRefreshing, showLoading, hideLoading]);

  return (
    <>
      <div className="group flex items-center justify-between px-6 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-lg relative">
        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={isVisible ?? calendar.isVisible ?? true}
            onChange={handleVisibilityChange}
            className={`relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            style={{
              backgroundColor: (isVisible ?? calendar.isVisible ?? true) ? (calendar.color || '#3b82f6') : '#e5e7eb'
            }}
          >
            <span className="sr-only">Show calendar</span>
            <span
              aria-hidden="true"
              className={`${
                (isVisible ?? calendar.isVisible ?? true) ? 'translate-x-3' : 'translate-x-0'
              } pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </Switch>
        </div>

        <Link
          to={`/calendar/${getCurrentView()}?calendarId=${calendar.id}`}
          state={{ calendarName: calendar.name }}
          prefetch="intent"
          className="flex-grow ml-2"
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
                <div className="px-4 py-2">
                  <div className="text-sm text-gray-700 mb-2">Calendar Color</div>
                  <ColorPicker
                    selectedColor={calendar.color || '#3b82f6'}
                    onColorSelect={(color) => {
                      updateCalendarColor(calendar.id, color);
                      if (onColorChange) {
                        onColorChange(calendar.id, color);
                      }
                    }}
                  />
                </div>
              )}
            </Menu.Item>
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