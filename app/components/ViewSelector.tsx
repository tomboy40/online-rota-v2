import { Link } from "@remix-run/react";

export type ViewOption = "Day" | "Week" | "Month";

interface ViewSelectorProps {
  currentView: ViewOption;
  onViewChange: (view: ViewOption) => void;
}

export default function ViewSelector({ currentView, onViewChange }: ViewSelectorProps) {
  const views: ViewOption[] = ["Day", "Week", "Month"];

  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      {views.map((view) => {
        const isActive = currentView === view;
        return (
          <Link
            key={view}
            to={`/calendar/${view.toLowerCase()}`}
            onClick={() => onViewChange(view)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              isActive
                ? "bg-white text-gray-900 shadow"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {view}
          </Link>
        );
      })}
    </div>
  );
} 