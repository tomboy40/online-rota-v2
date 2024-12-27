import { useState } from "react";
import { Form } from "@remix-run/react";

interface CreateCalendarDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateCalendarDialog({ isOpen, onClose }: CreateCalendarDialogProps) {
  const [appId, setAppId] = useState("");
  const [appName, setAppName] = useState("");
  const [icalLink, setIcalLink] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Add Calendar</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Close dialog"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <Form method="post" action="/calendar/add" className="p-4" onSubmit={() => onClose()}>
          <div className="space-y-4">
            <div>
              <label htmlFor="appId" className="block text-sm font-medium text-gray-700">
                App ID
              </label>
              <input
                type="text"
                id="appId"
                name="appId"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="appName" className="block text-sm font-medium text-gray-700">
                App Name
              </label>
              <input
                type="text"
                id="appName"
                name="appName"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="icalLink" className="block text-sm font-medium text-gray-700">
                iCal Link
              </label>
              <input
                type="url"
                id="icalLink"
                name="icalLink"
                value={icalLink}
                onChange={(e) => setIcalLink(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Calendar
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
} 