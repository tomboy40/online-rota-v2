import { useState, useEffect } from "react";

function getLocalTimePosition() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  // Calculate minutes since midnight
  const minutesSinceMidnight = (hours * 60) + minutes;
  
  // Each hour slot is 48px (h-12)
  const pixelsPerHour = 48;
  const pixelsPerMinute = pixelsPerHour / 60;
  
  // Calculate exact pixel position
  const position = minutesSinceMidnight * pixelsPerMinute;
  
  // For debugging
  console.log(`Local time: ${hours}:${minutes.toString().padStart(2, '0')}`);
  console.log(`Position: ${position}px`);
  
  return position;
}

export default function CurrentTimeIndicator() {
  const [position, setPosition] = useState(getLocalTimePosition);

  useEffect(() => {
    // Initial position
    setPosition(getLocalTimePosition());
    
    // Update position every minute
    const interval = setInterval(() => {
      setPosition(getLocalTimePosition());
    }, 60000);

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="absolute left-0 right-0 flex items-center z-10"
      style={{ top: `${position}px` }}
    >
      <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.25" />
      <div className="flex-1 border-t border-red-500" />
    </div>
  );
} 