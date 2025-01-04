export type ViewOption = "day" | "week" | "month";

interface ViewSelectorProps {
  currentView: ViewOption;
  onViewChange: (view: ViewOption) => void;
}

export default function ViewSelector({ currentView, onViewChange }: ViewSelectorProps) {
  return (
    <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
      <button
        onClick={() => onViewChange("day")}
        className={`px-3 py-1.5 text-sm font-medium rounded-md ${
          currentView === "day"
            ? "bg-white text-gray-900 shadow"
            : "text-gray-500 hover:text-gray-900"
        }`}
      >
        Day
      </button>
      <button
        onClick={() => onViewChange("week")}
        className={`px-3 py-1.5 text-sm font-medium rounded-md ${
          currentView === "week"
            ? "bg-white text-gray-900 shadow"
            : "text-gray-500 hover:text-gray-900"
        }`}
      >
        Week
      </button>
      <button
        onClick={() => onViewChange("month")}
        className={`px-3 py-1.5 text-sm font-medium rounded-md ${
          currentView === "month"
            ? "bg-white text-gray-900 shadow"
            : "text-gray-500 hover:text-gray-900"
        }`}
      >
        Month
      </button>
    </div>
  );
} 