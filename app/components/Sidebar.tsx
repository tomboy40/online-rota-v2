import { useState, useEffect } from "react";
import { Form, useSubmit } from "@remix-run/react";

interface SidebarProps {
  isOpen: boolean;
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
  currentDate: Date;
  onCreateClick: () => void;
}

export default function Sidebar({ isOpen, onDateSelect, selectedDate, currentDate, onCreateClick }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMyCalendarsOpen, setIsMyCalendarsOpen] = useState(true);
  const [miniCalendarDate, setMiniCalendarDate] = useState(selectedDate);
  const submit = useSubmit();

  // Update mini calendar when main calendar changes
  useEffect(() => {
    setMiniCalendarDate(selectedDate);
  }, [selectedDate]);

  // Generate dates for mini calendar
  const generateCalendarDates = () => {
    const today = new Date(miniCalendarDate);
    const month = today.getMonth();
    const year = today.getFullYear();
    
    // Get first day of month
    const firstDay = new Date(year, month, 1);
    const startingDay = firstDay.getDay();
    
    // Get last day of month
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    
    // Generate array of dates
    const dates: (Date | null)[] = [];
    
    // Add empty slots for days before first of month
    for (let i = 0; i < startingDay; i++) {
      dates.push(null);
    }
    
    // Add all days of month
    for (let i = 1; i <= totalDays; i++) {
      dates.push(new Date(year, month, i));
    }
    
    return dates;
  };

  const handleDateClick = (date: Date | null) => {
    if (date) {
      onDateSelect(date);
    }
  };

  const handlePrevMonth = () => {
    const newDate = new Date(miniCalendarDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setMiniCalendarDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(miniCalendarDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setMiniCalendarDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const formatMonthYear = () => {
    return miniCalendarDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit(event.currentTarget);
  };

  if (!isOpen) return null;

  return (
    <div className="w-60 h-full bg-white border-r border-gray-200 flex-shrink-0 fixed left-0 top-16">
      <div className="p-4">
        {/* Create Calendar Button */}
        <button 
          onClick={onCreateClick}
          className="w-full mb-8 px-3 py-2 text-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-full shadow-sm flex items-center justify-center space-x-2"
        >
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add</span>
        </button>

        {/* Mini Calendar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-900">{formatMonthYear()}</h2>
            <div className="flex space-x-2">
              <button
                onClick={handlePrevMonth}
                className="p-1 hover:bg-gray-100 rounded-full"
                aria-label="Previous month"
              >
                <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-gray-100 rounded-full"
                aria-label="Next month"
              >
                <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {/* Day labels */}
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="h-6 flex items-center justify-center">
                <span className="text-xs text-gray-500">{day}</span>
              </div>
            ))}
            
            {/* Calendar dates */}
            {generateCalendarDates().map((date, i) => (
              <div key={i} className="h-6 flex items-center justify-center">
                {date ? (
                  <button
                    onClick={() => handleDateClick(date)}
                    className={`w-6 h-6 flex items-center justify-center text-xs rounded-full
                      ${isToday(date) ? 'bg-blue-600 text-white' : 
                        isSelected(date) ? 'bg-blue-100 text-blue-600' : 
                        'text-gray-900 hover:bg-gray-100'}`}
                  >
                    {date.getDate()}
                  </button>
                ) : (
                  <span className="w-6 h-6" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <Form onSubmit={handleSearchSubmit} className="mb-8">
          <div className="relative">
            <input
              type="text"
              name="q"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search calendars"
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </Form>

        {/* My Calendars Section */}
        <div>
          <button
            onClick={() => setIsMyCalendarsOpen(!isMyCalendarsOpen)}
            className="flex items-center space-x-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg px-2 py-1 w-full"
          >
            <svg
              className={`h-4 w-4 transform transition-transform ${isMyCalendarsOpen ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>My calendars</span>
          </button>
          
          {isMyCalendarsOpen && (
            <div className="mt-2 space-y-1">
              {/* Sample calendars - replace with actual data */}
              <label className="flex items-center space-x-3 px-6 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 rounded" />
                <span>Calendar 1</span>
              </label>
              <label className="flex items-center space-x-3 px-6 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">
                <input type="checkbox" className="form-checkbox h-4 w-4 text-blue-600 rounded" />
                <span>Calendar 2</span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}