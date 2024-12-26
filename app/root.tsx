import { useState } from "react";
import type { LinksFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "@remix-run/react";
import styles from "./tailwind.css";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ViewSelector from "./components/ViewSelector";
import CreateCalendarDialog from "./components/CreateCalendarDialog";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
];

type ViewOption = "Day" | "Week" | "Month";

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [miniCalendarDate, setMiniCalendarDate] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const location = useLocation();

  // Determine current view from URL
  const getCurrentView = (): ViewOption => {
    const path = location.pathname;
    if (path.includes("/calendar/day")) return "Day";
    if (path.includes("/calendar/month")) return "Month";
    return "Week";
  };

  // This function is called when a date is clicked in the mini calendar
  const handleDateSelect = (date: Date) => {
    const view = getCurrentView();
    const newMainDate = new Date(date);
    
    // Adjust the main calendar date based on the current view
    switch (view) {
      case "Week":
        // Set to the start of the week containing the selected date
        const dayOfWeek = date.getDay();
        newMainDate.setDate(date.getDate() - dayOfWeek);
        break;
      case "Month":
        // Set to the first day of the month
        newMainDate.setDate(1);
        break;
      // For day view, use the exact selected date
    }
    
    setCurrentDate(newMainDate);
    setMiniCalendarDate(date); // Mini calendar shows the exact selected date
  };

  const handleMenuClick = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleTodayClick = () => {
    const today = new Date();
    const view = getCurrentView();
    
    // Set the main calendar date
    const newMainDate = new Date(today);
    switch (view) {
      case "Week":
        const dayOfWeek = today.getDay();
        newMainDate.setDate(today.getDate() - dayOfWeek);
        break;
      case "Month":
        newMainDate.setDate(1);
        break;
    }
    setCurrentDate(newMainDate);
    setMiniCalendarDate(today); // Mini calendar always shows today's exact date
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
        // Set mini calendar to the middle of the visible week
        newMiniDate = new Date(newDate);
        newMiniDate.setDate(newMiniDate.getDate() + 3);
        break;
      case "Month":
        newDate.setMonth(newDate.getMonth() - 1);
        // Set mini calendar to the middle of the visible month
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
        // Set mini calendar to the middle of the visible week
        newMiniDate = new Date(newDate);
        newMiniDate.setDate(newMiniDate.getDate() + 3);
        break;
      case "Month":
        newDate.setMonth(newDate.getMonth() + 1);
        // Set mini calendar to the middle of the visible month
        newMiniDate = new Date(newDate);
        newMiniDate.setDate(15);
        break;
    }
    setCurrentDate(newDate);
    setMiniCalendarDate(newMiniDate);
  };

  const handleCreateClick = () => {
    setIsCreateDialogOpen(true);
  };

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
            <Header 
              currentDate={currentDate}
              onMenuClick={handleMenuClick}
              onPrevClick={handlePrevClick}
              onNextClick={handleNextClick}
              onTodayClick={handleTodayClick}
            />
            <div className="ml-auto">
              <ViewSelector 
                currentView={getCurrentView()}
                onViewChange={() => {}} // View changes are handled by navigation in ViewSelector
              />
            </div>
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