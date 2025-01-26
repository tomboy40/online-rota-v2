# User Flow: View Calendar - Week View

This document describes the user flow for viewing the calendar in week view, starting from application load.

## 1. Initial Application Load

**User Action:** User opens the application URL in a browser.

**System Response:**
- The browser requests the root route (`/`).
- Remix server handles the request and executes the `loader` function in `app/routes/_index.tsx`.
- `_index.tsx`'s loader function redirects to `/calendar/week`.
- Remix server handles the redirect and executes the `loader` function in `app/routes/calendar.week.tsx`.

**Data Flow:**
- **Request:** Initial request to `/`.
- **Redirect:** Server-side redirect to `/calendar/week`.
- **Loader Data Fetching (`calendar.week.tsx`):**
    - **Cache Check:** `getCachedEvents` is called (if `calendarId` is present in URL params, otherwise no cache check).
    - **API Call (Conditional):** If no cached events or cache miss, `db.query.calendar.findFirst` fetches calendar details from the database (if `calendarId` is present), then `fetchCalendarEvents` fetches events from the calendar's iCal link.
    - **Favorites and Colors:** `getFavorites` fetches favorite calendars from `localStorage`. Calendar colors are associated with events.
- **Response:** `calendar.week.tsx`'s loader returns JSON data containing:
    - `events`: Array of calendar events with color information.
    - `isLoading`: Boolean indicating loading state.
    - `timestamp`: Timestamp of data fetch.
    - `isCached`: Boolean indicating if data was loaded from cache.

**Components Involved:**
- `_index.tsx` (route)
- `calendar.week.tsx` (route)

**State Changes:**
- No significant state changes at this stage in React components, but server-side data fetching and processing occur.

**API Interactions:**
- **Database Query (Conditional):** `db.query.calendar.findFirst` (if `calendarId` is present).
- **iCal Feed Fetch (Conditional):** `fetchCalendarEvents` (if `calendarId` is present and no cache or cache miss).
- **localStorage Read:** `getFavorites` reads favorite calendars from `localStorage`.

**Error Handling:**
- Errors during data fetching in `fetchCalendarEvents` are caught and logged, potentially resulting in empty event data.
- Database errors are not explicitly handled in the provided code snippet but would likely result in loader errors in a production application.

## 2. Rendering Week View

**User Action:** After initial load/redirect, the week view is rendered in the browser.

**System Response:**
- `root.tsx` component renders the main layout: `Header`, `Sidebar`, and `Outlet`.
- `calendar.week.tsx` component is rendered within the `Outlet`.
- `CalendarWeek` component uses `useLoaderData` to access the event data fetched in the loader.
- `CalendarWeek` component renders the week grid, day headers, time slots, and calendar events.
- `Sidebar` component renders the calendar list and mini-calendar.
- `Header` component renders the header with navigation controls and date display.

**Data Flow:**
- **Loader Data:** JSON data from `calendar.week.tsx`'s loader is passed to the `CalendarWeek` component via `useLoaderData`.
- **Context Data:** `currentDate` and `visibleCalendars` are passed from `root.tsx` to `CalendarWeek` via `useOutletContext`.
- **Event Filtering and Rendering:** `CalendarWeek` filters events for the current week and visible calendars and renders them in the week grid.
- **Date Formatting:** `Header` component formats the `currentDate` for display.
- **Calendar List Rendering:** `Sidebar` component renders the list of calendars from `favorites` data.
- **Mini-Calendar Rendering:** `Sidebar` component renders the mini-calendar based on `miniCalendarDate`.

**Components Involved:**
- `root.tsx`
- `calendar.week.tsx`
- `app/components/Header.tsx`
- `app/components/Sidebar.tsx`
- `app/components/ViewSelector.tsx` (rendered in `root.tsx`)
- `app/components/CurrentTimeIndicator.tsx` (rendered in `calendar.week.tsx`)
- `app/components/EventDetailsDialog.tsx` (rendered in `calendar.week.tsx`)

**State Changes:**
- **`CalendarWeek` component:**
    - `events` state is initialized with `initialEvents` from loader data.
    - `favorites` state is initialized with favorites from `localStorage` (in `useEffect`).
- **`root.tsx` component:**
    - State variables like `currentDate`, `miniCalendarDate`, `isSidebarOpen`, `visibleCalendars` are initialized with default values.

**API Interactions:**
- No API interactions during initial rendering phase after data is loaded by the loader.

**Error Handling:**
- Error handling during rendering is primarily related to handling null or invalid event data during filtering and rendering in `CalendarWeek`.
- `EventDetailsDialog` handles cases where `selectedEvent` is null.

## 3. Navigate to Next/Previous Week

**User Action:** User clicks the "Next" or "Previous" navigation buttons in the `Header`.

**System Response:**
- When "Next" or "Previous" button is clicked in `Header`, the corresponding callback function (`onNextClick` or `onPrevClick`) is triggered in `root.tsx`.
- `onNextClick` or `onPrevClick` in `root.tsx` updates the `currentDate` state based on the current view (week view in this case).
- `root.tsx` re-renders, passing the updated `currentDate` context to the `Outlet` (including `calendar.week.tsx`).
- `CalendarWeek` component re-renders because it uses `currentDate` from the context.
- `CalendarWeek` recalculates `weekStart`, `weekEnd`, and re-filters `weekEvents` based on the new `currentDate`.
- The week view updates to display events for the new week.

**Data Flow:**
- **User Interaction:** Click on "Next" or "Previous" button in `Header`.
- **Callback Trigger:** `onNextClick` or `onPrevClick` callback in `root.tsx` is executed.
- **State Update:** `currentDate` state is updated in `root.tsx`.
- **Context Update:** `currentDate` context value is updated, triggering re-renders in components consuming the context.
- **Component Re-render (`CalendarWeek`):** `CalendarWeek` re-renders and accesses the updated `currentDate` from the context.
- **Event Filtering:** `CalendarWeek` re-filters `weekEvents` based on the new `currentDate` and week range.
- **UI Update:** Week view is re-rendered with events for the new week.
- **No Loader Re-run:** The `loader` function in `calendar.week.tsx` is **not** re-executed during navigation to the next/previous week. The component re-renders and re-filters the existing event data.

**Components Involved:**
- `root.tsx`
- `app/components/Header.tsx`
- `calendar.week.tsx`

**State Changes:**
- **`root.tsx` component:**
    - `currentDate` state is updated in `onNextClick` or `onPrevClick` handlers.

**API Interactions:**
- No API interactions during week navigation.

**Error Handling:**
- No specific error handling for week navigation in the provided code.

## 4. Select Date in Mini-Calendar

**User Action:** User clicks a date in the mini-calendar in the `Sidebar`.

**System Response:**
- When a date is clicked in the mini-calendar in `Sidebar`, the `handleDateClick` function in `Sidebar` is called.
- `handleDateClick` calls the `onDateSelect` callback function, which is passed as a prop from `root.tsx`.
- `onDateSelect` in `root.tsx` updates the `currentDate` and `miniCalendarDate` state variables to the selected date.
- `root.tsx` re-renders, passing the updated `currentDate` context to the `Outlet` (including `calendar.week.tsx`).
- `Sidebar` re-renders, updating the mini-calendar to reflect the selected date.
- `CalendarWeek` component re-renders because it uses `currentDate` from the context.
- `CalendarWeek` recalculates `weekStart`, `weekEnd`, and re-filters `weekEvents` based on the new `currentDate`.
- The week view updates to display events for the week containing the selected date.

**Data Flow:**
- **User Interaction:** Click on a date in the mini-calendar in `Sidebar`.
- **Callback Trigger:** `handleDateClick` in `Sidebar` is executed, calling `onDateSelect` prop.
- **State Update:** `currentDate` and `miniCalendarDate` states are updated in `root.tsx`.
- **Context Update:** `currentDate` context value is updated, triggering re-renders in components consuming the context.
- **Component Re-render (`CalendarWeek`, `Sidebar`):** `CalendarWeek` and `Sidebar` re-render and access the updated `currentDate` from the context and props respectively.
- **Event Filtering:** `CalendarWeek` re-filters `weekEvents` based on the new `currentDate` and week range.
- **UI Update:** Week view and mini-calendar are re-rendered with the selected date.
- **No Loader Re-run:** The `loader` function in `calendar.week.tsx` is **not** re-executed when selecting a date in the mini-calendar. The component re-renders and re-filters the existing event data.

**Components Involved:**
- `root.tsx`
- `app/components/Sidebar.tsx`
- `calendar.week.tsx`

**State Changes:**
- **`root.tsx` component:**
    - `currentDate` state is updated in `onDateSelect` handler.
    - `miniCalendarDate` state is updated in `onDateSelect` handler.
- **`Sidebar` component:**
    - `miniCalendarDate` state is updated (though this is likely redundant as it's already updated in `root.tsx` and passed down as prop).

**API Interactions:**
- No API interactions during date selection in mini-calendar.

**Error Handling:**
- No specific error handling for date selection in mini-calendar in the provided code.

## 5. Toggle Calendar Visibility

**User Action:** User toggles the visibility switch for a calendar in the `Sidebar` (in `CalendarLink` component).

**System Response:**
- When the visibility switch is toggled in `CalendarLink`, the `handleVisibilityChange` function in `CalendarLink` is called.
- `handleVisibilityChange` updates the calendar's visibility in `localStorage` using `updateCalendarVisibility`.
- `handleVisibilityChange` then calls the `onVisibilityChange` callback prop (passed from `Sidebar`) with the updated visibility state and calendar ID.
- `onVisibilityChange` callback in `Sidebar` updates the `visibleCalendars` state in `Sidebar`.
- `useEffect` in `Sidebar` (watching `visibleCalendars`) then calls `onCalendarVisibilityChange` to propagate the `visibleCalendars` update to `root.tsx`.
- `root.tsx` re-renders, updating the `visibleCalendars` context.
- Calendar views (e.g., `calendar.week.tsx`) re-render and filter events based on the updated `visibleCalendars` context, showing or hiding events for the toggled calendar.
- `Sidebar` re-renders, updating the `CalendarLink` component to reflect the new visibility state.

**Data Flow:**
- **User Interaction:** Toggle visibility switch in `CalendarLink` in `Sidebar`.
- **Callback Trigger:** `handleVisibilityChange` in `CalendarLink` is executed.
- **localStorage Update:** `updateCalendarVisibility` updates calendar visibility in `localStorage`.
- **Callback to Sidebar:** `onVisibilityChange` callback prop is called, updating `visibleCalendars` state in `Sidebar`.
- **Context Update:** `onCalendarVisibilityChange` callback prop in `Sidebar` is called, updating `visibleCalendars` context in `root.tsx`.
- **Component Re-render (`CalendarWeek`, `Sidebar`, `CalendarLink`):** `CalendarWeek`, `Sidebar`, and `CalendarLink` re-render to reflect the visibility change.
- **Event Filtering:** `CalendarWeek` re-filters `weekEvents` based on the updated `visibleCalendars` context.
- **UI Update:** Calendar views and sidebar are re-rendered with the updated calendar visibility.

**Components Involved:**
- `root.tsx`
- `app/components/Sidebar.tsx`
- `app/components/CalendarLink.tsx`
- `calendar.week.tsx` (or other calendar views)

**State Changes:**
- **`Sidebar` component:**
    - `visibleCalendars` state is updated in `handleVisibilityChange` callback from `CalendarLink`.
- **`root.tsx` component:**
    - `visibleCalendars` state (context) is updated via `onCalendarVisibilityChange` callback from `Sidebar`.
- **`CalendarLink` component:**
    - No significant state changes in `CalendarLink` itself, but it reflects the `isVisible` prop and updates the UI accordingly.

**API Interactions:**
- **localStorage Write:** `updateCalendarVisibility` writes to `localStorage` to persist calendar visibility.

**Error Handling:**
- No specific error handling for toggling calendar visibility in the provided code. LocalStorage errors are not explicitly handled.

## 6. Create New Calendar

**User Action:**
1. User clicks the "Add" button in the `Sidebar`.
2. `CreateCalendarDialog` opens.
3. User enters "App ID", "App Name", and "iCal Link" in the dialog form.
4. User clicks the "Add Calendar" button in the dialog.

**System Response:**
- Clicking "Add" button in `Sidebar` triggers `onCreateClick` callback, opening `CreateCalendarDialog`.
- Entering data in the form updates the local state in `CreateCalendarDialog` (`appId`, `appName`, `icalLink`).
- Clicking "Add Calendar" button submits the form as a POST request to `/calendar/add`.
- Remix server handles the POST request to `/calendar/add` and executes the `action` function in `app/routes/calendar.add.tsx`.
- `action` function:
    - Validates request method (must be POST).
    - Extracts `appId`, `appName`, `icalLink` from form data.
    - Validates required fields.
    - Inserts new calendar record into the database using `db.insert(schema.calendar).values(...)`.
    - Redirects to `/calendar/week`.
- Remix handles redirect, browser navigates to `/calendar/week`.
- `CreateCalendarDialog` closes due to `onClose` being called on form submission.
- `Sidebar` updates its calendar list to include the newly created calendar (likely via `storage` or `favoriteChanged` event listeners).
- Week view is rendered, now potentially including events from the newly added calendar (depending on visibility settings).

**Data Flow:**
- **User Interaction (Click "Add" in Sidebar):** Triggers `onCreateClick` callback.
- **Dialog Open:** `CreateCalendarDialog` is rendered.
- **User Input (Form):** Updates `appId`, `appName`, `icalLink` state in `CreateCalendarDialog`.
- **Form Submission (Click "Add Calendar"):** POST request to `/calendar/add` with form data.
- **Server-Side Action (`/calendar/add` route):**
    - Data extraction and validation.
    - Database insertion (`db.insert`).
    - Redirection to `/calendar/week`.
- **Client-Side Navigation:** Browser navigates to `/calendar/week`.
- **Calendar List Update (Sidebar):** `Sidebar` re-renders with updated calendar list (via storage events).
- **Week View Render:** Week view is rendered with potentially new calendar and events.

**Components Involved:**
- `root.tsx`
- `app/components/Sidebar.tsx`
- `app/components/CreateCalendarDialog.tsx`
- `app/routes/calendar.add.tsx`

**State Changes:**
- **`root.tsx` component:**
    - `isCreateDialogOpen` state is updated to `true` and then `false` to control dialog visibility.
- **`CreateCalendarDialog` component:**
    - `appId`, `appName`, `icalLink` states are updated as user types in the form.
    - These states are reset when the dialog is closed.

**API Interactions:**
- **POST Request to `/calendar/add`:** Form submission to create a new calendar.
- **Database Write:** `db.insert` in `calendar.add.tsx` writes new calendar data to the database.
- **localStorage Read (Sidebar update):** `Sidebar` likely reads from `localStorage` to update the calendar list after calendar creation (via storage events).

**Error Handling:**
- **Client-Side Validation:** `CreateCalendarDialog` form likely has basic HTML5 validation (e.g., `required` attribute).
- **Server-Side Validation (`calendar.add.tsx`):**
    - Checks for missing required fields (`appId`, `appName`, `icalLink`). Throws an error if missing.
    - Database errors during insertion are not explicitly handled in the provided code snippet but would likely result in loader errors in a production application.
- **Error Display:** Error handling and display to the user (e.g., if database insertion fails or validation errors occur on the server) are not implemented in the provided code snippets. The user would likely just be redirected back to the week view even if calendar creation fails on the server.

## 7. Edit Calendar

**User Action:**
1. User opens the Calendar Link menu for a calendar in the `Sidebar` and clicks "Edit".
2. `EditCalendarDialog` opens, pre-populated with calendar details.
3. User edits "App Name" and/or "iCal Link" in the dialog form.
4. User clicks the "Save Changes" button in the dialog.

**System Response:**
- Clicking "Edit" in `CalendarLink` menu opens `EditCalendarDialog`.
- `EditCalendarDialog` uses `fetcher.load(`/calendar/edit/${calendar.id}`)` to fetch calendar data from the server.
- Remix server handles the GET request to `/calendar/edit/:id` and executes the `loader` function in `app/routes/calendar.edit.$id.tsx`.
- `loader` function fetches calendar data from the database and returns it as JSON.
- `EditCalendarDialog` populates the form with the fetched calendar data.
- User edits form fields and clicks "Save Changes".
- Form submission sends a POST request to `/calendar/edit/:id`.
- Remix server handles the POST request to `/calendar/edit/:id` and executes the `action` function in `app/routes/calendar.edit.$id.tsx`.
- `action` function:
    - Extracts `appName` and `icalLink` from form data.
    - Validates required fields.
    - Updates the calendar record in the database using `db.update(schema.calendar).set({...}).where(...)`.
    - Returns a JSON success response `{ success: true }`.
- `EditCalendarDialog`'s `useEffect` hook detects successful submission (`fetcher.state === 'idle' && fetcher.data?.success`).
- `useEffect` hook:
    - Updates calendar data in `localStorage` (if it's a favorite).
    - Dispatches `storage` and `favoriteChanged` events.
    - Closes the dialog (`onClose()`).
- UI updates in `Sidebar` and calendar views due to storage events, reflecting the edited calendar details.

**Data Flow:**
- **User Interaction (Click "Edit" in CalendarLink menu):** Opens `EditCalendarDialog`.
- **Data Fetch (GET to `/calendar/edit/:id`):** `EditCalendarDialog` uses `fetcher.load` to fetch calendar data.
- **Server-Side Data Fetching (`/calendar/edit/:id` route - loader):** Fetches calendar data from database.
- **Form Population:** `EditCalendarDialog` populates form with fetched data.
- **User Input (Form):** Updates `appName`, `icalLink` state in `EditCalendarDialog`.
- **Form Submission (Click "Save Changes"):** POST request to `/calendar/edit/:id` with form data.
- **Server-Side Action (`/calendar/edit/:id` route - action):**
    - Data extraction and validation.
    - Database update (`db.update`).
    - Returns success response.
- **Client-Side Success Handling (`EditCalendarDialog` useEffect):**
    - Local storage update.
    - Dispatch storage events.
    - Close dialog.
- **UI Update (Sidebar, Calendar Views):** Re-render triggered by storage events, reflecting edited calendar.

**Components Involved:**
- `root.tsx`
- `app/components/Sidebar.tsx`
- `app/components/CalendarLink.tsx`
- `app/components/EditCalendarDialog.tsx`
- `app/routes/calendar.edit.$id.tsx`

**State Changes:**
- **`CalendarLink` component:**
    - `isEditDialogOpen` state is updated to `true` and then `false` to control dialog visibility.
- **`EditCalendarDialog` component:**
    - `appName`, `icalLink` states are updated as user types in the form and when data is fetched.

**API Interactions:**
- **GET Request to `/calendar/edit/:id`:** To fetch calendar data when dialog opens.
- **POST Request to `/calendar/edit/:id`:** Form submission to update calendar details.
- **Database Read (`/calendar/edit/:id` loader):** `db.query.calendar.findFirst` to fetch calendar data for editing.
- **Database Write (`/calendar/edit/:id` action):** `db.update` to update calendar data in the database.
- **localStorage Write (`EditCalendarDialog` useEffect):** Updates calendar data in `localStorage` (if favorite).

**Error Handling:**
- **Server-Side Validation (`calendar.edit.$id.tsx` action):**
    - Checks for missing required fields (`appName`, `icalLink`). Returns error response if missing.
    - Database errors during update are not explicitly handled in the provided code snippet but would likely result in loader errors in a production application.
- **Client-Side Error Handling:** Error handling and display to the user (e.g., if database update fails or validation errors occur on the server) are not explicitly implemented in the provided code snippets. The user would likely not see any error messages in the current implementation if the edit fails on the server.

## 8. View Event Details

**User Action:** User clicks on an event in the week view grid.

**System Response:**
- Clicking on an event div in `calendar.week.tsx` triggers the `onClick` handler, which calls `setSelectedEvent(event)` in `calendar.week.tsx`.
- `setSelectedEvent(event)` updates the `selectedEvent` state in `calendar.week.tsx` with the clicked event data.
- `EventDetailsDialog` component is rendered in `calendar.week.tsx` because the `isOpen` prop (bound to `selectedEvent !== null`) becomes true.
- `EventDetailsDialog` displays details of the selected event (title, time, location, description) using data from the `event` prop.

**Data Flow:**
- **User Interaction (Click on Event in Week View):** Triggers `onClick` handler on event div in `calendar.week.tsx`.
- **State Update (`calendar.week.tsx`):** `setSelectedEvent(event)` updates `selectedEvent` state.
- **Dialog Render:** `EventDetailsDialog` is rendered in `calendar.week.tsx` with `isOpen=true` and `event` prop.
- **Dialog Content Render:** `EventDetailsDialog` renders event details (title, time, location, description) based on `event` prop.

**Components Involved:**
- `calendar.week.tsx`
- `app/components/EventDetailsDialog.tsx`

**State Changes:**
- **`calendar.week.tsx` component:**
    - `selectedEvent` state is updated to the clicked event object when an event is clicked.
    - `selectedEvent` state is updated back to `null` when the dialog is closed.

**API Interactions:**
- No API interactions during viewing event details.

**Error Handling:**
- `EventDetailsDialog` handles the case where `event` prop is null (dialog is not rendered if `event` is null).
- No specific error handling for event details display in the provided code, assuming the `CalendarEvent` object is correctly structured.

## 9. Search Events

**User Action:**
1. User clicks the "Search" button in the `Header`.
2. User is navigated to the `/search` route.
3. User types a search query in the search input in the header.
4. User submits the search form (e.g., by pressing Enter).

**System Response:**
- Clicking "Search" button in `Header` navigates to `/search` route.
- Initially, with no query, `search.tsx`'s `loader` function returns empty calendar list.
- User input in search input updates the URL to `/search?q=[query]`.
- Remix server handles the request to `/search?q=[query]` and executes the `loader` function in `app/routes/search.tsx`.
- `loader` function:
    - Extracts search query from URL params.
    - Queries the database to find calendars matching the query (in `id` or `name`).
    - Fetches cache info for found calendars.
    - Returns calendars and cache info as JSON.
- `Search` component renders the list of search results (calendars).

**Data Flow:**
- **User Interaction (Click "Search" button in Header):** Navigates to `/search` route.
- **Initial Load (No Query):** `search.tsx` loader fetches no data, component renders empty results.
- **User Input (Search Query):** Updates URL to `/search?q=[query]`.
- **Loader Execution (with Query):** `search.tsx` loader fetches calendars matching query from database.
- **Search Results Render:** `Search` component renders the list of calendars from loader data.

**Components Involved:**
- `root.tsx` (Header contains search input and button)
- `app/routes/search.tsx`

**State Changes:**
- **`Search` component:**
    - `favorites` state is initialized based on search results (in `useEffect`).
    - `isNavigating` state is updated when navigating to calendar views from search results.
    - `editingCalendar` and `deleteCalendar` states are used to control dialog visibility for editing/deleting calendars from search results.

**API Interactions:**
- **GET Request to `/search?q=[query]`:** To fetch search results.
- **Database Read (`/search` loader):** `db.select` to fetch calendars matching the search query.
- **localStorage Read (`Search` component useEffect):** `isFavorite` is used to check favorite status for each calendar in search results.

**Error Handling:**
- **Server-Side Error Handling (`/search` loader):**
    - Database query errors are not explicitly handled in the provided code snippet but would likely result in loader errors in a production application.
- **Client-Side Error Handling:** Error handling and display to the user (e.g., if database query fails) are not explicitly implemented in the provided code snippets. The search results might just be empty or the page might fail to load in case of server errors.

## 10. Switch Views (Day/Week/Month)

**User Action:** User clicks on a view button ("Day", "Week", or "Month") in the `ViewSelector` in the `Header`.

**System Response:**
- Clicking a view button in `ViewSelector` triggers the `onViewChange` callback in `ViewSelector`, which calls `handleViewChange` in `root.tsx`.
- `handleViewChange` in `root.tsx`:
    - Constructs a new path based on the selected view (e.g., `/calendar/day`, `/calendar/week`, `/calendar/month`).
    - Preserves the `calendarId` query parameter if present.
    - Navigates to the new path using `navigate()`.
- Remix navigates to the new calendar view route.
- The `loader` function of the new route (e.g., `calendar.day.tsx`, `calendar.week.tsx`, `calendar.month.tsx`) is executed.
- The corresponding calendar view component is rendered within the `Outlet`, displaying the selected view.

**Data Flow:**
- **User Interaction (Click View Button in ViewSelector):** Triggers `onViewChange` callback in `ViewSelector`.
- **Callback Trigger (`root.tsx`):** `handleViewChange` in `root.tsx` is executed.
- **Navigation:** `handleViewChange` uses `navigate()` to navigate to the new view route.
- **Route Loader Execution:** Loader function of the new route (e.g., `calendar.day.tsx`) is executed.
- **New View Render:** Corresponding calendar view component is rendered with data from the new route's loader.

**Components Involved:**
- `root.tsx`
- `app/components/Header.tsx` (renders ViewSelector)
- `app/components/ViewSelector.tsx`
- `calendar.day.tsx` (or `calendar.week.tsx`, `calendar.month.tsx` - depending on selected view)

**State Changes:**
- **`root.tsx` component:**
    - No significant state changes in `root.tsx` directly in this flow, but `currentDate` context might indirectly influence data loading in the new view.

**API Interactions:**
- API interactions depend on the loader function of the newly navigated route (e.g., `calendar.day.tsx`, `calendar.week.tsx`, `calendar.month.tsx`). Each view route likely fetches calendar events for the corresponding view (day, week, month).

**Error Handling:**
- Error handling depends on the loader function of the newly navigated route. Any errors during data fetching in the new route's loader would be handled by Remix error handling mechanisms (e.g., error boundaries, catch boundaries - not examined in detail yet).

## 11. Error Handling and Edge Cases

### 11.1. View Calendar - Week View

**11.1.1. Initial Application Load:**

- **Error fetching calendars or events:**
    - **Scenario:** `fetchCalendarEvents` or database queries fail due to network issues, invalid iCal link, database connection errors, etc.
    - **Expected Behavior:** The loader might return empty event data or an error response. The UI should gracefully handle this, potentially displaying an error message to the user instead of a blank calendar. (Current implementation might not have explicit error UI for this).
- **No calendars configured:**
    - **Scenario:** User has not added any calendars yet.
    - **Expected Behavior:** Initial week view might be empty, as there are no calendars to fetch events from. This is not an error, but an expected empty state.
- **Invalid iCal link:**
    - **Scenario:** A calendar has an invalid iCal link.
    - **Expected Behavior:** `fetchCalendarEvents` might fail to fetch events for that calendar. Events for this calendar would be missing in the week view, while other calendars might load correctly. (Current implementation might log errors to console but not display specific error messages in UI for invalid iCal links).

**11.1.2. Navigate to Next/Previous Week:**

- **No events for the new week:**
    - **Scenario:** There are no events for the navigated week.
    - **Expected Behavior:** The UI should display an empty week view gracefully, without errors. This is normal behavior when there are no events in a given week.
- **Date calculations edge cases:**
    - **Scenario:** Potential edge cases around year boundaries or month boundaries in date calculations for week ranges. (Although less likely with `date-fns`).
    - **Expected Behavior:** Week view should correctly display the date range for the previous/next week even across year/month boundaries. (Likely handled correctly by `date-fns`, but worth noting as a potential area to watch for bugs).

### 11.2. Select Date in Mini-Calendar

- **Known Errors or Edge Cases:** No known significant error scenarios or edge cases for this user flow. The flow primarily involves client-side date manipulation and UI updates, which are generally robust.

### 11.3. Toggle Calendar Visibility

- **localStorage errors:**
    - **Scenario:** Errors writing to `localStorage` (e.g., due to browser storage quota limits, browser errors).
    - **Expected Behavior:** Calendar visibility might not be persisted correctly if `localStorage` write fails. The UI might become out of sync with the persisted visibility state. (Current implementation doesn't have explicit error handling for `localStorage` writes).
- **Race conditions or state inconsistencies:**
    - **Scenario:** In rare cases, rapid toggling of visibility or concurrent updates from other tabs/windows might lead to race conditions or state inconsistencies in `visibleCalendars` state in `Sidebar` or `localStorage`. (Less likely with the current event-based update mechanism, but worth considering).
- **Callback errors:**
    - **Scenario:** If the `onCalendarVisibilityChange` callback prop in `Sidebar` (which updates `visibleCalendars` context in `root.tsx`) throws an error.
    - **Expected Behavior:** It could prevent the visibility change from propagating correctly to the calendar views. Calendar views might not re-render to reflect the visibility change if the context update fails.

### 11.4. Create New Calendar

... (Existing content for "Create New Calendar" error handling) ...

### 11.5. Edit Calendar

- **Client-side validation errors (in `EditCalendarDialog`):**
    - **Scenario:** User submits the form with missing or invalid input (e.g., empty App Name, invalid iCal link format).
    - **Expected Behavior:** Similar to create calendar, browser's built-in form validation should handle basic client-side validation directly in the form.
- **Server-side validation errors (`/calendar/edit/:id` route - action):**
    - **Scenario:** User submits the form with invalid data that passes client-side validation but fails server-side validation (e.g., empty App Name, invalid iCal link, etc.).
    - **Expected Behavior:** The `/calendar/edit/:id` action function should return an error response (e.g., 400 status code with JSON error message). The current implementation in `app/routes/calendar.edit.$id.tsx` does return a JSON error for missing fields, which is better than the create calendar route. However, more specific error messages and UI handling could be improved to display these errors to the user in the edit dialog.
- **Database errors (`/calendar/edit/:id` route - action):**
    - **Scenario:** Errors during database update (e.g., database connection issues, calendar not found for the given ID).
    - **Expected Behavior:** The `action` function might throw an error if database update fails. Currently, this error is not explicitly handled in detail, and might result in a generic 500 error response from the server, without specific error feedback to the user in the UI.
- **Calendar not found (GET request to `/calendar/edit/:id` - loader):**
    - **Scenario:** When opening the edit dialog, the `fetcher.load` call to `/calendar/edit/:id` might fail if the calendar with the given ID is not found in the database (e.g., if it was deleted in another tab).
    - **Expected Behavior:** The `loader` function in `app/routes/calendar.edit.$id.tsx` handles "Calendar not found" by throwing a 404 response. The `EditCalendarDialog` UI should ideally handle this 404 error gracefully, perhaps by displaying an error message within the dialog and closing it. (Current implementation might not have explicit UI error handling for 404 in edit dialog).
- **Concurrent edit conflicts:**
    - **Scenario:** If multiple users or tabs are editing the same calendar simultaneously, there could be concurrent edit conflicts.
    - **Expected Behavior:** The current implementation doesn't seem to have any explicit conflict resolution mechanism. The last save operation would likely overwrite any previous changes. This is a potential data consistency issue in concurrent editing scenarios. (This is a general limitation of the current implementation, not a specific error, but worth noting as an edge case for potential future improvements).

### 11.6. View Event Details

- **Event data inconsistencies:**
    - **Scenario:** If the `CalendarEvent` object passed to `EventDetailsDialog` is somehow corrupted or missing expected properties (e.g., due to data processing errors earlier in the flow).
    - **Expected Behavior:** The `EventDetailsDialog` component might render incorrectly or throw errors if it relies on specific properties of the `event` prop and those are missing or invalid. However, the current implementation seems to handle cases where `event` is null, and it uses optional chaining for properties like `event.location` and `event.description`, which should prevent crashes due to missing properties.
- **Date formatting errors:**
    - **Scenario:** Errors during date formatting using `date-fns/format` if `event.startTime` or `event.endTime` are invalid date strings or objects.
    - **Expected Behavior:** `date-fns/format` might throw errors if provided with invalid dates. The component should ideally handle these errors gracefully, perhaps by displaying a fallback date format or an error message instead of crashing. However, the current implementation includes a `try-catch` block in `calendar.week.tsx` when parsing event dates, which might prevent invalid dates from being passed to `EventDetailsDialog` in the first place, reducing the likelihood of this error.

### 11.7. Search Events

- **Server-side errors during search query (`/search` loader):**
    - **Scenario:** Database query in the `loader` function fails due to database connection issues, invalid query syntax, or other database errors.
    - **Expected Behavior:** The `loader` function might throw an error, resulting in a 500 error response from the server. The `Search` component should ideally handle this error and display an error message to the user instead of a blank or broken search results page. (Current implementation might not have explicit UI error handling for loader errors in search).
- **No search results:**
    - **Scenario:** User enters a search query that doesn't match any calendars in the database.
    - **Expected Behavior:** The `loader` function should return an empty `calendars` array in this case, which is handled correctly by the `Search` component to display "No results found" message. This is not an error, but an expected empty state.
- **Performance issues with very broad queries or large datasets:**
    - **Scenario:** User enters a very broad or common search query (e.g., "calendar", "app") that might match a large number of calendars in a very large database.
    - **Expected Behavior:** The database query might become slow, and rendering a very long list of search results might also impact performance. Pagination or result limiting might be needed for very large datasets, but is not implemented currently.
- **Error during calendar deletion (`/search` action):**
    - **Scenario:** Calendar deletion initiated from the search results page (via "Delete" button in search result item) might fail due to database errors or other server-side issues.
    - **Expected Behavior:** The `action` function in `search.tsx` handles deletion errors by returning a JSON error response. However, client-side error handling and display of deletion errors in the UI could be improved. Currently, the UI might not explicitly show an error message if deletion fails.

### 11.8. Switch Views (Day/Week/Month)

- **Route loading errors:**
    - **Scenario:** If there are errors in the loader functions of the day, week, or month view routes (e.g., `calendar.day.tsx`, `calendar.week.tsx`, `calendar.month.tsx`), switching to those views might result in error responses from the server.
    - **Expected Behavior:** Remix should handle route loader errors and display error boundaries or catch boundaries if implemented. However, without examining the error boundary implementation, it's hard to say exactly how errors would be displayed to the user. Generic error pages or broken UI might be possible if error handling is not implemented robustly in the view routes.
- **Navigation failures:**
    - **Scenario:** In rare cases, navigation might fail due to browser issues or network problems during navigation.
    - **Expected Behavior:** Browser should handle navigation failures gracefully, but the UI might get stuck in a loading state or display a browser-level error page in extreme cases.
- **View-specific data loading errors:**
    - **Scenario:** After switching to a new view (e.g., month view), the data loading for that specific view might fail (e.g., error in `calendar.month.tsx`'s loader).
    - **Expected Behavior:** Similar to initial load errors, the specific view component should handle data loading errors gracefully, displaying an error message if data fetching fails for that view. The user experience would depend on the error handling implemented in each view component's loader and component rendering logic.

**(End of User Flow Documentation.)**

- **Client-side validation errors:**
    - **Scenario:** User submits the form with missing or invalid input (e.g., empty App ID, invalid iCal link format).
    - **Expected Behavior:** The browser's built-in form validation should prevent form submission and display appropriate error messages to the user directly in the form.
- **Server-side validation errors (`/calendar/add` route):**
    - **Scenario:** User submits the form with invalid data that passes client-side validation but fails server-side validation (e.g., App ID already exists, iCal link is unreachable or doesn't return valid iCalendar data).
    - **Expected Behavior:** The `/calendar/add` action function should ideally return an error response (e.g., 400 status code with JSON error message) to provide specific feedback to the user. However, the current implementation in `app/routes/calendar.add.tsx` only throws a generic `Error("Missing required fields")` which is not handled gracefully and doesn't provide specific error feedback to the user. The user would likely just be redirected back to the week view without any error message, and the calendar creation might fail silently.
- **Database errors (`/calendar/add` route):**
    - **Scenario:** Errors during database insertion (e.g., database connection issues, unique constraint violation if App ID already exists).
    - **Expected Behavior:** The `action` function might throw an error if database insertion fails. Currently, this error is not explicitly handled and would likely result in a generic 500 error response from the server, without specific error feedback to the user in the UI.
- **Network errors during iCal fetch (after calendar creation - not in the documented flow, but related):**
    - **Scenario:** After calendar is created, the system might attempt to fetch events from the provided iCal link. If there are network errors or the iCal link becomes unavailable later, event fetching might fail.
    - **Expected Behavior:** Event fetching errors are logged, but the calendar might still be created successfully in the database. The user might see missing events or loading errors in the calendar view if event fetching fails later on.

**(To be populated with error scenarios for other user flows)**

---

**End of User Flow Documentation.**