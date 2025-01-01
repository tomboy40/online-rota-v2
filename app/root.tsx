import { useState } from "react";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigate,
  Link,
  Form,
} from "@remix-run/react";
import type { ViewOption } from "~/components/ViewSelector";
import ViewSelector from "~/components/ViewSelector";
import Header from "~/components/Header";
import Sidebar from "~/components/Sidebar";
import CreateCalendarDialog from "~/components/CreateCalendarDialog";

import styles from "~/tailwind.css";

// Base64 encoded calendar SVG favicon
const calendarFavicon = `data:image/svg+xml;base64,${btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="#4F46E5"/>
  <line x1="16" y1="2" x2="16" y2="6" stroke="#4F46E5"/>
  <line x1="8" y1="2" x2="8" y2="6" stroke="#4F46E5"/>
  <line x1="3" y1="10" x2="21" y2="10" stroke="#4F46E5"/>
  <rect x="6" y="13" width="4" height="4" rx="0.5" fill="#4F46E5"/>
</svg>
`)}`;

export function links() {
  return [
    { rel: "stylesheet", href: styles },
    { rel: "icon", type: "image/svg+xml", href: calendarFavicon }
  ];
}

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [miniCalendarDate, setMiniCalendarDate] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Determine current view from URL
  const getCurrentView = (): ViewOption => {
    const path = location.pathname;
    if (path.includes("/calendar/day")) return "Day";
    if (path.includes("/calendar/month")) return "Month";
    return "Week";
  };

  const handleDateSelect = (date: Date) => {
    const view = getCurrentView();
    const newMainDate = new Date(date);
    
    switch (view) {
      case "Week":
        const dayOfWeek = date.getDay();
        newMainDate.setDate(date.getDate() - dayOfWeek);
        break;
      case "Month":
        newMainDate.setDate(1);
        break;
    }
    
    setCurrentDate(newMainDate);
    setMiniCalendarDate(date);
  };

  const handleMenuClick = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handlePrevClick = () => {
    const view = getCurrentView();
    const newDate = new Date(currentDate);
    let newMiniDate = new Date(currentDate);
    
    switch (view) {
      case "Day":
        newDate.setDate(newDate.getDate() - 1);
        newMiniDate = new Date(newDate);
        break;
      case "Week":
        newDate.setDate(newDate.getDate() - 7);
        newMiniDate = new Date(newDate);
        newMiniDate.setDate(newMiniDate.getDate() + 3);
        break;
      case "Month":
        newDate.setMonth(newDate.getMonth() - 1);
        newMiniDate = new Date(newDate);
        newMiniDate.setDate(15);
        break;
    }
    setCurrentDate(newDate);
    setMiniCalendarDate(newMiniDate);
  };

  const handleNextClick = () => {
    const view = getCurrentView();
    const newDate = new Date(currentDate);
    let newMiniDate = new Date(currentDate);
    
    switch (view) {
      case "Day":
        newDate.setDate(newDate.getDate() + 1);
        newMiniDate = new Date(newDate);
        break;
      case "Week":
        newDate.setDate(newDate.getDate() + 7);
        newMiniDate = new Date(newDate);
        newMiniDate.setDate(newMiniDate.getDate() + 3);
        break;
      case "Month":
        newDate.setMonth(newDate.getMonth() + 1);
        newMiniDate = new Date(newDate);
        newMiniDate.setDate(15);
        break;
    }
    setCurrentDate(newDate);
    setMiniCalendarDate(newMiniDate);
  };

  const handleTodayClick = () => {
    const today = new Date();
    setCurrentDate(today);
    setMiniCalendarDate(today);
  };

  const handleCreateClick = () => {
    setIsCreateDialogOpen(true);
  };

  const handleSearchClick = () => {
    navigate("/search");
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = formData.get("q");
    navigate(`/search?q=${encodeURIComponent(query as string)}`);
  };

  const isSearchView = location.pathname.includes("/search");

  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <div className="flex flex-col h-full">
          <div className="flex items-center h-16 px-4 bg-white border-b border-gray-200">
            {isSearchView ? (
              <div className="flex items-center flex-1">
                <Link
                  to="/calendar/week"
                  className="p-2 hover:bg-gray-100 rounded-full mr-2"
                  aria-label="Back to calendar"
                >
                  <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <div className="text-xl font-medium mr-8">Search</div>
                <Form 
                  method="get" 
                  action="/search"
                  onSubmit={handleSearchSubmit}
                  className="flex-1 max-w-2xl"
                >
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="search"
                      name="q"
                      placeholder="Search"
                      autoFocus
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </Form>
              </div>
            ) : (
              <>
                <Header 
                  currentDate={currentDate}
                  onMenuClick={handleMenuClick}
                  onPrevClick={handlePrevClick}
                  onNextClick={handleNextClick}
                  onTodayClick={handleTodayClick}
                  onSearchClick={handleSearchClick}
                  calendarName={location.state?.calendarName}
                />
                <div className="flex items-center space-x-4">
                  <ViewSelector 
                    currentView={getCurrentView()}
                    onViewChange={(view) => {
                      const newView = view.toLowerCase();
                      const searchParams = new URLSearchParams(location.search);
                      const calendarId = searchParams.get('calendarId');
                      
                      // Preserve the calendar ID when switching views
                      if (calendarId) {
                        navigate(`/calendar/${newView}?calendarId=${calendarId}`, {
                          state: location.state
                        });
                      } else {
                        navigate(`/calendar/${newView}`);
                      }
                    }}
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex flex-1 overflow-hidden">
            <Sidebar 
              isOpen={isSidebarOpen}
              onDateSelect={handleDateSelect}
              selectedDate={miniCalendarDate}
              currentDate={currentDate}
              onCreateClick={handleCreateClick}
            />
            <main className={`flex-1 transition-[margin] duration-300 ${isSidebarOpen ? 'ml-60' : 'ml-0'}`}>
              <Outlet context={{ currentDate, setCurrentDate }} />
            </main>
          </div>
        </div>
        <CreateCalendarDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
        />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}