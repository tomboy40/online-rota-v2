import { Link, useLocation, useNavigate } from "@remix-run/react";

export type ViewOption = "Day" | "Week" | "Month";

interface ViewSelectorProps {
  currentView: ViewOption;
  onViewChange: (view: ViewOption) => void;
}

export default function ViewSelector({ currentView, onViewChange }: ViewSelectorProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleViewChange = (view: ViewOption) => {
    const currentSearchParams = new URLSearchParams(location.search);
    const calendarId = currentSearchParams.get('calendarId');
    
    let path = '/calendar/';
    switch (view) {
      case 'Day':
        path += 'day';
        break;
      case 'Week':
        path += 'week';
        break;
      case 'Month':
        path += 'month';
        break;
    }

    // Preserve the calendarId when switching views
    if (calendarId) {
      path += `?calendarId=${calendarId}`;
      navigate(path, {
        state: location.state // Preserve the existing state
      });
    } else {
      navigate(path);
    }
    onViewChange(view);
  };

  const views: ViewOption[] = ["Day", "Week", "Month"];

  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      {views.map((view) => {
        const isActive = currentView === view;
        return (
          <button
            key={view}
            onClick={() => handleViewChange(view)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              isActive
                ? "bg-white text-gray-900 shadow"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {view}
          </button>
        );
      })}
    </div>
  );
} 