interface LoadingSpinnerProps {
  fullScreen?: boolean;
  message?: string;
  isLoading?: boolean;
}

export default function LoadingSpinner({ 
  fullScreen = true, 
  message = 'Loading calendar data...',
  isLoading = true
}: LoadingSpinnerProps) {
  if (!isLoading) return null;

  if (fullScreen) {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center" 
        style={{ zIndex: 99999 }}
      >
        <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <div className="text-gray-700">{message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
    </div>
  );
} 