import { json, ActionFunction } from "@remix-run/node";
import { refreshCalendarCache } from "~/utils/calendar.server";
import LoadingSpinner from "~/components/LoadingSpinner";

export function CalendarRefreshSpinner() {
  return <LoadingSpinner fullScreen message="Refreshing calendar data..." />;
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const calendarId = formData.get("calendarId") as string;

  if (!calendarId) {
    return json({ error: "Calendar ID is required" }, { status: 400 });
  }

  try {
    const events = await refreshCalendarCache(calendarId);
    return json({ 
      success: true, 
      events,
      message: "Calendar cache refreshed successfully" 
    });
  } catch (error) {
    console.error("Failed to refresh calendar cache:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("Calendar not found")) {
        return json({ 
          error: "Calendar not found", 
          details: error.message 
        }, { status: 404 });
      }
      if (error.message.includes("Failed to fetch calendar data")) {
        return json({ 
          error: "Failed to fetch calendar data", 
          details: error.message 
        }, { status: 502 });
      }
    }
    
    return json({ 
      error: "Internal server error", 
      details: "Failed to refresh calendar cache" 
    }, { status: 500 });
  }
}; 