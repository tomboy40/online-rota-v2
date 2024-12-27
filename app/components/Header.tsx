import { useLocation, Link } from "@remix-run/react";

interface HeaderProps {
  currentDate: Date;
  onMenuClick: () => void;
  onPrevClick: () => void;
  onNextClick: () => void;
  onTodayClick: () => void;
}

export default function Header({ 
  currentDate, 
  onMenuClick, 
  onPrevClick, 
  onNextClick, 
  onTodayClick,
}: HeaderProps) {
  const location = useLocation();
  
  // Determine current view from URL
  const getCurrentView = () => {
    const path = location.pathname;
    if (path.includes("/calendar/day")) return "day";
    if (path.includes("/calendar/month")) return "month";
    return "week";
  };

  const formatDate = () => {
    const view = getCurrentView();
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      year: 'numeric',
    };

    if (view === 'day') {
      options.weekday = 'long';
      options.day = 'numeric';
    } else if (view === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${weekStart.toLocaleString('default', { month: 'long' })} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
      } else if (weekStart.getFullYear() === weekEnd.getFullYear()) {
        return `${weekStart.toLocaleString('default', { month: 'short' })} ${weekStart.getDate()} - ${weekEnd.toLocaleString('default', { month: 'short' })} ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
      } else {
        return `${weekStart.toLocaleString('default', { month: 'short' })} ${weekStart.getDate()}, ${weekStart.getFullYear()} - ${weekEnd.toLocaleString('default', { month: 'short' })} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
      }
    }

    return currentDate.toLocaleString('default', options);
  };

  return (
    <header className="flex-1 flex items-center space-x-4">
      {/* Left Section: Menu and Logo */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-gray-100 rounded-full"
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link to="/" className="flex items-center space-x-2 px-2">
          <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xl font-semibold text-gray-900">Calendar</span>
        </Link>
      </div>

      {/* Center Section: Navigation */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onTodayClick}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg"
        >
          Today
        </button>
        <div className="flex items-center space-x-2">
          <button
            onClick={onPrevClick}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Previous"
          >
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={onNextClick}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Next"
          >
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <h2 className="text-xl text-gray-900">{formatDate()}</h2>
      </div>
    </header>
  );
}