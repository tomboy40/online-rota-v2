import { useState } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import { db } from "~/utils/db.server";

interface Event {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  calendarId: string;
}

type ContextType = {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
};

export async function loader({ request }: LoaderFunctionArgs) {
  // Get the week's start and end dates from the URL
  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  const startDate = dateParam ? new Date(dateParam) : new Date();
  
  // Adjust to start of week (Sunday)
  startDate.setDate(startDate.getDate() - startDate.getDay());
  
  // Calculate end of week
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);

  // TODO: Fetch events for the week from the database
  const events: Event[] = [];

  return json({ startDate: startDate.toISOString(), events });
}

export default function CalendarWeek() {
  const { startDate, events } = useLoaderData<typeof loader>();
  const { currentDate } = useOutletContext<ContextType>();

  // Generate time slots (from 12 AM to 11 PM)
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 || 12;
    const ampm = i < 12 ? 'AM' : 'PM';
    return {
      label: `${hour} ${ampm}`,
      hour: i,
    };
  });

  // Generate week dates
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - date.getDay() + i);
    return date;
  });

  // Format date for column headers
  const formatColumnHeader = (date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    return {
      dayName: date.toLocaleString('default', { weekday: 'short' }).toUpperCase(),
      dayNumber: date.getDate(),
      isToday,
    };
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header row with days */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        {/* Time gutter */}
        <div className="w-16 flex-shrink-0" />
        
        {/* Day columns */}
        {weekDates.map((date, index) => {
          const { dayName, dayNumber, isToday } = formatColumnHeader(date);
          return (
            <div
              key={index}
              className={`flex-1 text-center py-2 ${
                isToday ? 'text-blue-600' : 'text-gray-900'
              }`}
            >
              <div className="text-sm font-medium">{dayName}</div>
              <div className={`text-2xl font-medium ${
                isToday ? 'bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto' : ''
              }`}>
                {dayNumber}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="flex flex-1 overflow-y-auto">
        {/* Time labels */}
        <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-white sticky left-0">
          {timeSlots.map(({ label, hour }, index) => (
            <div
              key={index}
              className="h-12 text-right pr-2 relative"
            >
              <span className="text-xs text-gray-500 absolute -top-2 right-2">{label}</span>
            </div>
          ))}
        </div>

        {/* Grid columns */}
        <div className="flex flex-1">
          {weekDates.map((date, dateIndex) => (
            <div
              key={dateIndex}
              className="flex-1 border-r border-gray-200 relative"
            >
              {/* Hour lines */}
              {timeSlots.map((_, index) => (
                <div
                  key={index}
                  className="h-12 border-b border-gray-100"
                />
              ))}

              {/* Current time indicator */}
              {formatColumnHeader(date).isToday && (
                <div
                  className="absolute left-0 right-0 flex items-center"
                  style={{
                    top: `${(new Date().getHours() * 60 + new Date().getMinutes()) / 1440 * 100}%`,
                  }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.25" />
                  <div className="flex-1 border-t border-red-500" />
                </div>
              )}

              {/* Events would be rendered here */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 