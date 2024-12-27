import { useState, useEffect } from 'react';
import { Popover } from '@headlessui/react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { getCalendarSettings, saveCalendarSettings, DATE_RANGE_OPTIONS, DEFAULT_SETTINGS, type CalendarSettings } from '~/utils/settings';

export default function CalendarSettings() {
  const [settings, setSettings] = useState<CalendarSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    // Initialize settings from localStorage on client-side
    setSettings(getCalendarSettings());
  }, []);

  const handleDateRangeChange = (months: number) => {
    const newSettings = {
      ...settings,
      dateRange: { months }
    };
    setSettings(newSettings);
    saveCalendarSettings(newSettings);
  };

  return (
    <Popover className="relative">
      <Popover.Button className="p-2 hover:bg-gray-100 rounded-full" aria-label="Calendar Settings">
        <Cog6ToothIcon className="h-5 w-5 text-gray-600" aria-hidden="true" />
      </Popover.Button>

      <Popover.Panel className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Calendar Settings</h3>
          
          <fieldset className="space-y-2">
            <legend className="text-xs text-gray-500 font-medium">Date Range</legend>
            {DATE_RANGE_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center">
                <input
                  type="radio"
                  id={`date-range-${option.value}`}
                  name="date-range"
                  value={option.value}
                  checked={settings.dateRange.months === option.value}
                  onChange={() => handleDateRangeChange(option.value)}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  aria-label={`Set date range to ${option.label}`}
                />
                <label 
                  htmlFor={`date-range-${option.value}`}
                  className="ml-3 text-sm text-gray-700"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </fieldset>
        </div>
      </Popover.Panel>
    </Popover>
  );
} 