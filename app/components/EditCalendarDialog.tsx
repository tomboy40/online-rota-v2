import { useState, useEffect, useRef } from "react";
import { Form, useFetcher } from "@remix-run/react";
import type { Calendar } from "~/utils/favorites";
import { createPortal } from "react-dom";
import { getFavorites } from "~/utils/favorites";

interface EditCalendarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  calendar: Calendar;
}

export default function EditCalendarDialog({ isOpen, onClose, calendar }: EditCalendarDialogProps) {
  const fetcher = useFetcher();
  const submittedValuesRef = useRef<{ name: string; icalLink: string } | null>(null);
  
  // Fetch calendar details when dialog opens
  useEffect(() => {
    if (isOpen && calendar.id) {
      fetcher.load(`/calendar/edit/${calendar.id}`);
    }
  }, [isOpen, calendar.id]);

  // Use fetched data if available, otherwise use passed calendar
  const calendarData = fetcher.data?.calendar || calendar;

  // Make appId read-only since it's the primary key
  const [appId] = useState(calendarData.id);
  const [appName, setAppName] = useState(calendarData.name);
  const [icalLink, setIcalLink] = useState(calendarData.icalLink || "");

  // Update form when calendar data changes
  useEffect(() => {
    setAppName(calendarData.name);
    setIcalLink(calendarData.icalLink || "");
  }, [calendarData]);

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Watch for successful submission with proper dependencies
  useEffect(() => {
    // Only update when the fetcher has completed successfully
    if (fetcher.state === 'idle' && fetcher.data?.success && submittedValuesRef.current) {
      console.log('Fetcher completed successfully');
      
      // Update local storage if the calendar is in favorites
      const favorites = getFavorites();
      const favoriteIndex = favorites.findIndex(fav => fav.id === calendar.id);
      
      console.log('Current favorites:', favorites);
      console.log('Updating calendar:', calendar.id);
      console.log('Found at index:', favoriteIndex);
      console.log('Submitted values:', submittedValuesRef.current);
      
      if (favoriteIndex !== -1) {
        // Create updated calendar with the same structure as in local storage
        const updatedCalendar = {
          ...favorites[favoriteIndex], // Keep any existing properties
          id: calendar.id,
          name: submittedValuesRef.current.name,
          icalLink: submittedValuesRef.current.icalLink
        };
        
        console.log('Updated calendar:', updatedCalendar);
        
        // Update the favorites array
        favorites[favoriteIndex] = updatedCalendar;
        
        // Save to localStorage
        localStorage.setItem('calendar-favorites', JSON.stringify(favorites));
        
        // Force immediate UI update
        window.dispatchEvent(new Event('storage'));
        
        // Also dispatch our custom event
        window.dispatchEvent(new CustomEvent('favoriteChanged', { 
          detail: { 
            type: 'update', 
            calendarId: calendar.id,
            updatedCalendar
          }
        }));

        console.log('Local storage updated');
        
        // Clear the ref after successful update
        submittedValuesRef.current = null;
      }

      // Close dialog after successful update
      onClose();
    }
  }, [fetcher, fetcher.state, fetcher.data, calendar.id, onClose, appName, icalLink]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Store the current values in the ref
    submittedValuesRef.current = {
      name: appName,
      icalLink: icalLink
    };
    
    console.log('Submitting form with values:', submittedValuesRef.current);
    
    // Submit the form data
    const formData = new FormData(e.currentTarget);
    fetcher.submit(formData, {
      method: 'post',
      action: `/calendar/edit/${calendar.id}`,
    });
  };

  const dialog = (
    <div
      className={`fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity duration-300 flex items-center justify-center ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999
      }}
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className={`bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 ${
          isOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <svg 
              className="h-6 w-6 text-blue-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900">Edit Calendar</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close dialog"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <Form 
          method="post" 
          action={`/calendar/edit/${calendar.id}`}
          className="p-6" 
          onSubmit={handleSubmit}
        >
          <div className="space-y-6">
            <div>
              <label htmlFor="appId" className="block text-sm font-medium text-gray-700">
                App ID
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="text"
                  id="appId"
                  name="appId"
                  value={appId}
                  readOnly
                  className="block w-full rounded-md border-gray-300 pr-10 bg-gray-50 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="appName" className="block text-sm font-medium text-gray-700">
                App Name
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="text"
                  id="appName"
                  name="appName"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="block w-full rounded-md border-gray-300 pr-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter app name"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="icalLink" className="block text-sm font-medium text-gray-700">
                iCal Link
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="url"
                  id="icalLink"
                  name="icalLink"
                  value={icalLink}
                  onChange={(e) => setIcalLink(e.target.value)}
                  className="block w-full rounded-md border-gray-300 pr-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="https://example.com/calendar.ics"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Enter the URL of your calendar's iCal feed
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </Form>
      </div>
    </div>
  );

  // Only render if we're in the browser and the portal container exists
  if (typeof document === 'undefined') return null;
  
  const portalContainer = document.getElementById('portal-container');
  if (!portalContainer) return null;

  return createPortal(dialog, portalContainer);
} 