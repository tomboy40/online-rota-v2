import { Link, useLocation } from "@remix-run/react";
import type { Calendar } from "~/utils/favorites";

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

  return (
    <Link
      to={`/calendar/${getCurrentView()}?calendarId=${calendar.id}`}
      prefetch="none"
      className="flex items-center space-x-3 px-6 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
    >
      <svg
        className="h-4 w-4 text-yellow-400 fill-current"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
      >
        <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
      <span>{calendar.name}</span>
    </Link>
  );
} 