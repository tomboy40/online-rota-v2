# Feature Documentation

This document provides a detailed overview of the features implemented in the online-rota-v2 application.

---

**Feature:** Root Layout

**Description:**
The Root Layout component (`root.tsx`) serves as the main entry point for the application and defines the overall structure of the user interface. It arranges the primary UI elements, including the header, sidebar, and the main content outlet, providing a consistent layout across different views.

**Functionality:**
- **Sets up the basic HTML structure:** Includes `<html>`, `<head>`, and `<body>` elements with necessary meta tags, links to stylesheets, and scripts.
- **Defines the main application container:** Uses a flex layout to structure the header, sidebar, and main content area.
- **Manages global UI state:** Uses React's `useState` to manage application-level state such as:
    - `currentDate`:  The currently selected date, used for calendar views.
    - `miniCalendarDate`: The date focused on the mini-calendar in the sidebar.
    - `isSidebarOpen`: Controls the visibility of the sidebar.
    - `isCreateDialogOpen`: Controls the visibility of the "Create Calendar" dialog.
    - `visibleCalendars`: A set of calendar IDs that are currently visible.
- **Provides context:** Uses `LoadingProvider` to make loading state available to child components.
- **Handles navigation:** Uses `useLocation` and `useNavigate` from Remix to manage routing and URL changes.
- **Renders key UI components:** Includes `<Header>`, `<Sidebar>`, `<ViewSelector>`, `<Outlet>`, and `<CreateCalendarDialog>`.

**Internal Logic and Data Flow:**
- The component initializes several state variables to control the UI and application state.
- Date state (`currentDate`, `miniCalendarDate`) is managed at the root level and passed down to child components like `<Header>` and `<Sidebar>`.
- Sidebar visibility (`isSidebarOpen`) is controlled by the menu click handler in the `<Header>`.
- Dialog visibility (`isCreateDialogOpen`) is managed by the create calendar button in the `<Sidebar>`.
- Navigation is handled using Remix's `useNavigate` hook, with functions like `handleSearchClick`, `handleViewChange`, and form submission for search.
- The `<Outlet>` component renders the content of the currently matched route, passing down `currentDate` and `visibleCalendars` in its context.

**Dependencies:**
- React (`useState`, `useLocation`, `useNavigate`, `Link`, `Form`)
- Remix (`Links`, `LiveReload`, `Meta`, `Outlet`, `Scripts`, `ScrollRestoration`)
- `ViewSelector` component (`~/components/ViewSelector`)
- `Header` component (`~/components/Header`)
- `Sidebar` component (`~/components/Sidebar`)
- `CreateCalendarDialog` component (`~/components/CreateCalendarDialog`)
- `LoadingProvider` context (`~/contexts/LoadingContext`)
- `tailwind.css` (`~/tailwind.css`)

**Interactions:**
- Interacts with `<Header>` to handle menu clicks, date navigation, and search initiation.
- Interacts with `<Sidebar>` to manage date selection from the mini-calendar and calendar creation.
- Interacts with `<ViewSelector>` to handle view changes (day, week, month).
- Provides context to routes rendered within the `<Outlet>`, allowing them to access `currentDate` and `visibleCalendars`.
- Triggers navigation to different routes based on user interactions (e.g., search, view changes).

**Edge Cases and Failure Modes:**
- No specific edge cases or failure modes are apparent in the root layout itself. However, errors in child components or route handling could propagate up to this level and be caught by error boundaries (though error boundaries are not explicitly defined in this component).

**Business Rules and Validation:**
- No specific business rules or validation logic are implemented in the root layout. It primarily focuses on UI structure and state management.

---

**Feature:** Header

**Description:**
The Header component (`Header.tsx`) is responsible for rendering the application's header section. It includes navigation controls, the application logo, a date display, and buttons for search and settings.

**Functionality:**
- **Displays application logo and title:** Shows a calendar icon and the "Calendar" title.
- **Provides menu toggle:** Includes a button to toggle the sidebar visibility, triggering the `onMenuClick` callback.
- **Date navigation:**
    - "Today" button: Navigates to the current date, triggering the `onTodayClick` callback.
    - Previous/Next buttons: Navigate to the previous or next day/week/month based on the current view, triggering `onPrevClick` and `onNextClick` callbacks respectively.
    - Date display: Shows the currently selected date in a user-friendly format, updating dynamically based on the current view (day, week, month).
- **Search initiation:** Includes a search button that triggers the `onSearchClick` callback.
- **Calendar settings:** Integrates the `<CalendarSettings>` component, providing access to calendar-related settings.

**Internal Logic and Data Flow:**
- Receives `currentDate`, `onMenuClick`, `onPrevClick`, `onNextClick`, `onTodayClick`, and `onSearchClick` as props from the parent component (`root.tsx`).
- Uses `useLocation` to determine the current view (day, week, month) based on the URL path.
- `formatDate` function: Formats the `currentDate` prop into a string representation based on the current view. It handles different formatting for day, week, and month views, including displaying date ranges for week views and considering month and year boundaries.
- Button click handlers: Call the corresponding callback props (`onMenuClick`, `onTodayClick`, `onPrevClick`, `onNextClick`, `onSearchClick`) to notify the parent component of user interactions.

**Dependencies:**
- React (`useState`, `useEffect`)
- Remix (`useLocation`, `Link`)
- Heroicons (`MagnifyingGlassIcon`, `Cog6ToothIcon`, `ChevronDownIcon`, `ArrowPathIcon`, `InformationCircleIcon`, `Bars3Icon`, `PencilIcon`)
- `@headlessui/react` (`Menu`)
- `CalendarSettings` component (`./CalendarSettings`)
- `EditCalendarDialog` component (`./EditCalendarDialog`) (though not directly used in Header, it's imported)

**Interactions:**
- Interacts with the parent component (`root.tsx`) through callback props to:
    - Toggle sidebar visibility (`onMenuClick`).
    - Navigate to the current date (`onTodayClick`).
    - Navigate to previous/next date ranges (`onPrevClick`, `onNextClick`).
    - Initiate search (`onSearchClick`).
- Uses `<CalendarSettings>` component to render calendar settings UI.
- Uses Remix `<Link>` for navigation (though currently only to `/calendar/week` in the logo).

**Edge Cases and Failure Modes:**
- Date formatting logic in `formatDate` handles cases where week views span across different months and years.
- No specific error handling is implemented within the Header component itself.

**Business Rules and Validation:**
- No specific business rules or validation logic are implemented in the Header component. It primarily focuses on UI presentation and user interaction handling.

---

**Feature:** Sidebar

**Description:**
The Sidebar component (`Sidebar.tsx`) provides a navigation and quick access panel on the left side of the application. It includes a mini-calendar for date selection, a "Quick Access" section for favorite calendars, and a button to create new calendars.

**Functionality:**
- **Mini-calendar:**
    - Displays a monthly calendar view.
    - Allows navigation to previous and next months.
    - Highlights the current day and the selected date.
    - Triggers the `onDateSelect` callback when a date is clicked, updating the main calendar view.
- **Quick Access section:**
    - Displays a list of favorite calendars using the `<CalendarLink>` component.
    - Allows toggling the visibility of the Quick Access section.
    - Dynamically updates the list of favorite calendars based on storage events (`storage` and `favoriteChanged`).
    - Allows toggling the visibility of individual calendars, persisting the state using `updateCalendarVisibility` and triggering the `onCalendarVisibilityChange` callback.
- **Create Calendar button:**
    - Opens the "Create Calendar" dialog when clicked, triggering the `onCreateClick` callback.
- **Calendar Visibility Management:**
    - Manages the visibility state of calendars using `visibleCalendars` state variable.
    - Persists calendar visibility changes using `updateCalendarVisibility` utility.
    - Notifies the parent component (`root.tsx`) about changes in visible calendars through the `onCalendarVisibilityChange` callback.

**Internal Logic and Data Flow:**
- Receives `isOpen`, `onDateSelect`, `selectedDate`, `currentDate`, `onCreateClick`, and `onCalendarVisibilityChange` as props from the parent component (`root.tsx`).
- **State Management:**
    - `isQuickAccessOpen`: Controls the visibility of the Quick Access section.
    - `miniCalendarDate`:  The date focused on the mini-calendar, initialized with `selectedDate` prop.
    - `favorites`: An array of favorite calendar objects, fetched using `getFavorites` utility.
    - `visibleCalendars`: A Set of calendar IDs that are currently visible, initialized based on the `isVisible` property of favorite calendars.
- **Effects:**
    - Initial setup effect (`useEffect` with empty dependency array):
        - Fetches favorite calendars using `getFavorites()`.
        - Initializes `favorites` and `visibleCalendars` state.
        - Calls `handleVisibilityStateChange` to notify parent component about initial visible calendars.
    - Event listener effect (`useEffect` with empty dependency array):
        - Adds event listeners for `storage` and `favoriteChanged` events to react to changes in favorite calendars and their visibility.
        - Updates `favorites` and `visibleCalendars` state based on these events.
        - Removes event listeners on component unmount.
    - Visibility update effect (`useEffect` with `visibleCalendars` and `handleVisibilityStateChange` dependencies):
        - Calls `handleVisibilityStateChange` whenever `visibleCalendars` state changes, notifying the parent component.
    - Mini-calendar date update effect (`useEffect` with `selectedDate` dependency):
        - Updates `miniCalendarDate` state when `selectedDate` prop changes, keeping the mini-calendar in sync with the main calendar.
- **Date Generation:**
    - `generateCalendarDates` function: Generates an array of dates for the mini-calendar display based on `miniCalendarDate`. It calculates the first day of the month, the number of days in the month, and generates an array including null values for days before the first day of the month.
- **Date Click Handling:**
    - `handleDateClick` function: Calls the `onDateSelect` callback prop with the clicked date.
- **Month Navigation:**
    - `handlePrevMonth` and `handleNextMonth` functions: Update the `miniCalendarDate` state to navigate to the previous or next month in the mini-calendar.
- **Formatting and Utility Functions:**
    - `formatMonthYear`: Formats `miniCalendarDate` to display month and year in the mini-calendar header.
    - `isToday` and `isSelected`: Utility functions to check if a date is today or the selected date for styling the mini-calendar.
- **Visibility Change Handling:**
    - `handleVisibilityChange`: Calls `updateCalendarVisibility` to persist visibility changes and updates the `visibleCalendars` state.

**Dependencies:**
- React (`useState`, `useEffect`, `useCallback`, `useRef`, `useLayoutEffect`)
- Remix (`Form`)
- `getFavorites`, `updateCalendarVisibility` utilities (`~/utils/favorites`)
- `CalendarLink` component (`./CalendarLink`)

**Interactions:**
- Interacts with the parent component (`root.tsx`) through callback props:
    - `onDateSelect`: To notify about date selection from the mini-calendar.
    - `onCreateClick`: To notify about clicks on the "Create Calendar" button.
    - `onCalendarVisibilityChange`: To notify about changes in visible calendars.
- Uses `CalendarLink` component to display and manage individual favorite calendars.
- Uses `getFavorites` and `updateCalendarVisibility` utilities to interact with local storage for favorite calendar data.

**Edge Cases and Failure Modes:**
- Handles cases where there are no favorite calendars by displaying "No favorites yet" message.
- Relies on local storage for persistence of favorite calendars and their visibility. Potential failure modes related to local storage access or corruption are not explicitly handled.
- Event listeners for `storage` and `favoriteChanged` events ensure that the sidebar UI stays synchronized with changes made in other parts of the application or in other browser tabs/windows.

**Business Rules and Validation:**
- No specific business rules or validation logic are implemented in the Sidebar component itself. It primarily focuses on UI presentation, user interaction handling, and managing calendar visibility state.

---

**Feature:** View Selector

**Description:**
The ViewSelector component (`ViewSelector.tsx`) provides a set of buttons to switch between different calendar views: Day, Week, and Month. It's a simple UI component that allows users to change the granularity of the calendar display.

**Functionality:**
- **View selection:**
    - Displays three buttons: "Day", "Week", and "Month".
    - Visually highlights the currently selected view.
    - Triggers the `onViewChange` callback when a view button is clicked, notifying the parent component to switch the calendar view.

**Internal Logic and Data Flow:**
- Receives `currentView` and `onViewChange` as props from the parent component (`root.tsx`).
- **Button click handlers:**
    - Each button has an `onClick` handler that calls the `onViewChange` callback prop with the corresponding view option ("day", "week", or "month").
- **Conditional styling:**
    - Applies different CSS classes to the buttons based on the `currentView` prop to visually indicate the selected view.

**Dependencies:**
- React

**Interactions:**
- Interacts with the parent component (`root.tsx`) through the `onViewChange` callback prop to notify about view changes.

**Edge Cases and Failure Modes:**
- No specific edge cases or failure modes are apparent in the ViewSelector component. It's a purely presentational component with simple button interactions.

**Business Rules and Validation:**
- No specific business rules or validation logic are implemented in the ViewSelector component. It solely focuses on providing UI for view selection.

---

**Feature:** Create Calendar Dialog

**Description:**
The CreateCalendarDialog component (`CreateCalendarDialog.tsx`) is a modal dialog that allows users to add a new calendar to the application by providing an App ID, App Name, and an iCal link.

**Functionality:**
- **Modal dialog:**
    - Displays a modal dialog overlay when opened, blocking interaction with the rest of the application.
    - Uses CSS transitions for smooth opening and closing animations.
    - Can be closed by clicking a close button in the header or clicking outside the dialog content area.
- **Input form:**
    - Contains a form with fields for "App ID", "App Name", and "iCal Link".
    - "App ID" and "App Name" are text input fields.
    - "iCal Link" is a URL input field, enforcing URL format validation by the browser.
    - All fields are required.
- **Form submission:**
    - Uses a Remix `<Form>` component with `method="post"` and `action="/calendar/add"` to submit the form data to the server when the "Add Calendar" button is clicked.
    - Calls the `onClose` callback prop after form submission (in `onSubmit` handler), closing the dialog.
- **Form state management:**
    - Uses React's `useState` to manage the input values for "App ID", "App Name", and "iCal Link" (`appId`, `appName`, `icalLink` state variables).
    - Resets the form fields to empty strings when the dialog is closed using a `useEffect` hook that listens to the `isOpen` prop.
- **Cancel action:**
    - Includes a "Cancel" button that calls the `onClose` callback prop, closing the dialog without submitting the form.

**Internal Logic and Data Flow:**
- Receives `isOpen` and `onClose` as props from the parent component (`root.tsx` or `Sidebar.tsx`).
- **State Management:**
    - `isOpen`: Controls the visibility of the dialog, received as a prop.
    - `appId`, `appName`, `icalLink`: Local state variables to store input values.
- **Effects:**
    - Form reset effect (`useEffect` with `isOpen` dependency): Resets form fields when `isOpen` prop becomes false.
- **Event Handlers:**
    - `handleBackdropClick`: Closes the dialog when the backdrop (the area outside the dialog content) is clicked.
- **Form Submission:**
    - The `<Form>` component handles form submission to the `/calendar/add` route. The `onSubmit` handler is used to close the dialog after submission.

**Dependencies:**
- React (`useState`, `useEffect`)
- Remix (`Form`)

**Interactions:**
- Interacts with the parent component (`root.tsx` or `Sidebar.tsx`) through the `isOpen` and `onClose` props to control dialog visibility.
- Submits form data to the `/calendar/add` route using Remix `<Form>`.

**Edge Cases and Failure Modes:**
- Form validation: Relies on browser's built-in URL validation for the "iCal Link" field and `required` attributes for all fields. Server-side validation in the `/calendar/add` route is expected to handle more robust validation and error handling.
- Dialog closing: Handles closing the dialog when clicking outside the content area or clicking the close/cancel buttons.

**Business Rules and Validation:**
- Requires "App ID", "App Name", and "iCal Link" to be filled in by the user.
- Expects "iCal Link" to be a valid URL.
- Server-side validation in the `/calendar/add` route is expected to handle uniqueness of App ID, validity of iCal link content, and other business rules related to calendar creation.

---

**Feature:** Loading Context

**Description:**
The LoadingContext (`LoadingContext.tsx`) provides a context and provider component (`LoadingProvider`) to manage a global loading state for the application. It allows components to easily display and hide a loading spinner with a message during asynchronous operations.

**Functionality:**
- **Loading Provider:**
    - `LoadingProvider` component: Wraps parts of the application that need to display a loading indicator. It initializes the loading context and makes the `showLoading` and `hideLoading` functions available to its children.
- **Loading Context:**
    - `LoadingContext`: A React context that holds the `showLoading` and `hideLoading` functions.
- **Loading Hook:**
    - `useLoading` hook: A custom hook that provides access to the `showLoading` and `hideLoading` functions from within components that are descendants of the `LoadingProvider`.
- **Loading Spinner:**
    - Renders a `LoadingSpinner` component (imported from `~/components/LoadingSpinner`) when the `isLoading` state is true. The spinner is displayed full-screen with an optional message.

**Internal Logic and Data Flow:**
- **Context Creation:**
    - `LoadingContext = createContext<LoadingContextType | null>(null);`: Creates a React context to hold the loading management functions.
- **Provider Component (`LoadingProvider`):**
    - Initializes `isLoading` (boolean) and `message` (string) state variables using `useState`.
    - `showLoading(msg: string)` function: Sets the `message` state to the provided message and sets `isLoading` to `true`, causing the `LoadingSpinner` to be displayed.
    - `hideLoading()` function: Sets `isLoading` to `false` and clears the `message` state, hiding the `LoadingSpinner`.
    - Provides the `showLoading` and `hideLoading` functions through the `LoadingContext.Provider` to its children.
    - Conditionally renders the `LoadingSpinner` component based on the `isLoading` state.
- **Hook (`useLoading`):**
    - `useContext(LoadingContext)`: Accesses the loading context value.
    - Error handling: Throws an error if `useLoading` is used outside of a `LoadingProvider`, ensuring that the context is properly initialized.
    - Returns the `context` value, which contains `showLoading` and `hideLoading` functions.

**Dependencies:**
- React (`createContext`, `useContext`, `useState`, `ReactNode`)
- `LoadingSpinner` component (`~/components/LoadingSpinner`)

**Interactions:**
- Components use the `useLoading` hook to access the `showLoading` and `hideLoading` functions.
- Calling `showLoading` will display the `LoadingSpinner`, and calling `hideLoading` will hide it.
- The `LoadingProvider` component makes the loading context available to its descendant components.

**Edge Cases and Failure Modes:**
- Error handling: `useLoading` hook throws an error if used outside of a `LoadingProvider`, preventing unexpected behavior.
- Multiple loading states: Only one global loading state is managed by this context. If nested loading states are required, a more complex context or state management solution might be needed.

**Business Rules and Validation:**
- No specific business rules or validation logic are implemented in the LoadingContext. It provides a utility for managing and displaying a global loading indicator.

---

**Feature:** Loading Spinner

**Description:**
The LoadingSpinner component (`LoadingSpinner.tsx`) is a visual indicator that informs the user that the application is currently loading data or performing an operation. It can be displayed in full-screen mode or inline within a component.

**Functionality:**
- **Visual loading indicator:**
    - Renders a spinning animation using CSS classes (`animate-spin`).
    - Uses a circular shape with a blue border to indicate loading.
- **Full-screen or inline display:**
    - `fullScreen` prop (boolean, default: `true`): Controls whether the spinner is displayed in full-screen mode (overlaying the entire viewport) or inline within its parent container.
    - Full-screen mode: Uses a fixed position overlay with a semi-transparent black background to cover the entire screen. Centers the spinner and optional message in the middle of the screen.
    - Inline mode: Renders a smaller spinner without the full-screen overlay, suitable for displaying loading indicators within specific sections of the UI.
- **Optional message:**
    - `message` prop (string, default: "Loading calendar data..."): Allows displaying a message below the spinner to provide context about the loading operation. Only displayed in full-screen mode.
- **Conditional rendering:**
    - `isLoading` prop (boolean, default: `true`): Controls the visibility of the spinner. If `isLoading` is `false`, the component renders nothing (`null`).

**Internal Logic and Data Flow:**
- Receives `fullScreen`, `message`, and `isLoading` as props.
- **Conditional rendering based on `isLoading` prop:**
    - If `isLoading` is `false`, returns `null`, hiding the spinner.
- **Conditional rendering based on `fullScreen` prop:**
    - If `fullScreen` is `true`, renders the full-screen spinner with a backdrop and optional message.
    - If `fullScreen` is `false`, renders the inline spinner.

**Dependencies:**
- React

**Interactions:**
- The `isLoading` prop is typically controlled by a parent component or a context (like `LoadingContext`) to indicate the loading state of an operation.

**Edge Cases and Failure Modes:**
- No specific edge cases or failure modes are apparent in the LoadingSpinner component. It's a purely presentational component that displays a loading animation based on props.

**Business Rules and Validation:**
- No specific business rules or validation logic are implemented in the LoadingSpinner component. It's a UI utility for indicating loading state.

---

**Feature:** Calendar Link

**Description:**
The CalendarLink component (`CalendarLink.tsx`) represents a single calendar item in the sidebar's Quick Access list. It provides a toggle to control calendar visibility, a link to navigate to the calendar view, a color picker to customize the calendar color, and a menu with actions to refresh, edit, remove from quick access, and view application details.

**Functionality:**
- **Calendar Visibility Toggle:**
    - Uses a `<Switch>` component to toggle the visibility of the calendar in the main calendar view.
    - Persists visibility changes using `updateCalendarVisibility` utility.
    - Triggers the `onVisibilityChange` callback to notify the parent component about visibility changes.
- **Navigation Link:**
    - Provides a button that, when clicked, navigates the user to the calendar view (day, week, or month) for the specific calendar.
    - Preserves the current view (day, week, month) when navigating to a calendar.
    - Passes calendar name, ID, and timestamp in the navigation state.
- **Calendar Actions Menu:**
    - Uses a `<Menu>` component to display a dropdown menu with actions:
        - **Color Picker:** Integrates a `<ColorPicker>` component to allow users to change the calendar's color. Persists color changes using `updateCalendarColor` and triggers the `onColorChange` callback.
        - **Refresh:** Triggers a cache refresh for the calendar's events by submitting a form to the `/calendar/refresh-cache` route using Remix `useFetcher`. Displays a loading spinner during refresh and calls the `onRefreshCalendar` callback after successful refresh.
        - **Edit:** Opens the `EditCalendarDialog` for editing calendar details.
        - **Remove from Quick Access:** Removes the calendar from the favorites list using `removeFavorite` utility.
        - **View Application:** Navigates to an `/app-details` page (not implemented in provided code) for viewing application details.
- **Loading Indication:**
    - Uses `useFetcher` to handle cache refresh requests and displays a loading spinner (using `LoadingContext`) during the refresh process.

**Internal Logic and Data Flow:**
- Receives `calendar`, `onRefreshCalendar`, `isVisible`, `onVisibilityChange`, and `onColorChange` as props.
- **State Management:**
    - `isEditDialogOpen`: Controls the visibility of the `EditCalendarDialog`.
- **Fetcher:**
    - `fetcher = useFetcher<RefreshCacheResponse>()`: Uses Remix `useFetcher` to handle form submissions for cache refresh.
- **Effects:**
    - Refresh completion effect (`useEffect` with `fetcher.state`, `fetcher.data`, `onRefreshCalendar` dependencies): Calls `onRefreshCalendar` callback after successful cache refresh.
    - Loading spinner effect (`useEffect` with `fetcher.state`, `fetcher.formData`, `showLoading`, `hideLoading` dependencies): Shows loading spinner when refresh request is submitted and hides it when it's complete.
- **Event Handlers:**
    - `handleRemoveFavorite`: Calls `removeFavorite` utility to remove the calendar from favorites.
    - `handleRefreshCache`: Submits a form to `/calendar/refresh-cache` to refresh the calendar cache.
    - `handleVisibilityChange`: Calls `updateCalendarVisibility` to persist visibility changes and triggers `onVisibilityChange` callback.
    - `handleClick`: Navigates to the calendar view, passing calendar details in navigation state.

**Dependencies:**
- React (`useState`, `useEffect`)
- Remix (`Link`, `useLocation`, `useFetcher`, `useNavigate`)
- `@headlessui/react` (`Menu`, `Switch`)
- Heroicons (`EllipsisVerticalIcon`, `StarIcon`, `InformationCircleIcon`, `PencilIcon`, `ArrowPathIcon`)
- `Calendar` type, `removeFavorite`, `updateCalendarColor`, `updateCalendarVisibility` utilities (`~/utils/favorites`)
- `EditCalendarDialog` component (`./EditCalendarDialog`)
- `LoadingSpinner` component (`./LoadingSpinner`)
- `CalendarRefreshSpinner` component (`~/routes/calendar.refresh-cache`)
- `useLoading` hook (`~/contexts/LoadingContext`)
- `ColorPicker` component (`./ColorPicker`)
- `getCachedEvents` utility (`~/utils/calendar.server`) (though not directly used in CalendarLink, it's imported)

**Interactions:**
- Interacts with parent components (e.g., `Sidebar`) through callback props:
    - `onVisibilityChange`: To notify about calendar visibility changes.
    - `onColorChange`: To notify about calendar color changes.
    - `onRefreshCalendar`: To notify after successful calendar refresh.
- Uses `EditCalendarDialog` to allow editing calendar details.
- Uses `ColorPicker` to allow color customization.
- Uses Remix `useFetcher` to submit form to `/calendar/refresh-cache` route.
- Uses `useLoading` context to display loading spinner.
- Uses `removeFavorite`, `updateCalendarColor`, `updateCalendarVisibility` utilities to interact with local storage for calendar data.
- Navigates to calendar views using Remix `<Link>` and `useNavigate`.

**Edge Cases and Failure Modes:**
- Loading state management: Uses `useFetcher` and `LoadingContext` to manage loading state during cache refresh. Handles cases where refresh requests are in progress or complete.
- Visibility persistence: Relies on `updateCalendarVisibility` to persist visibility changes in local storage. Potential failures related to local storage are not explicitly handled.
- Error handling for cache refresh: Error handling for cache refresh failures is not explicitly implemented in this component. It's likely handled in the `/calendar/refresh-cache` route or in the `getCachedEvents` utility.

**Business Rules and Validation:**
- Calendar visibility is persisted in local storage and can be toggled by the user.
- Calendar color can be customized and is persisted in local storage.
- Cache refresh is triggered by user action and updates calendar events.

---

**Feature:** Calendar Settings

**Description:**
The CalendarSettings component (`CalendarSettings.tsx`) provides a popover menu in the header that allows users to customize calendar settings, such as the default date range for calendar views.

**Functionality:**
- **Popover Menu:**
    - Uses `@headlessui/react` `Popover` component to create a dropdown menu that appears when the settings icon is clicked.
- **Date Range Setting:**
    - Provides radio buttons to select the default date range for calendar views.
    - Uses `DATE_RANGE_OPTIONS` constant (defined in `~/utils/settings`) to display available date range options (e.g., "1 month", "3 months", "6 months", "1 year").
    - Persists selected date range setting using `saveCalendarSettings` utility.
    - Initializes settings from local storage using `getCalendarSettings` utility on component mount.

**Internal Logic and Data Flow:**
- **State Management:**
    - `settings`: State variable of type `CalendarSettings` (defined in `~/utils/settings`) to store current calendar settings. Initialized with `DEFAULT_SETTINGS` and updated from local storage on mount.
- **Effects:**
    - Initialization effect (`useEffect` with empty dependency array):
        - Calls `getCalendarSettings()` to retrieve settings from local storage and updates the `settings` state.
- **Event Handlers:**
    - `handleDateRangeChange(months: number)`:
        - Creates a new settings object with the updated date range (number of months).
        - Updates the `settings` state with the new settings object.
        - Calls `saveCalendarSettings(newSettings)` to persist the updated settings in local storage.

**Dependencies:**
- React (`useState`, `useEffect`)
- `@headlessui/react` (`Popover`)
- Heroicons (`Cog6ToothIcon`)
- `getCalendarSettings`, `saveCalendarSettings`, `DATE_RANGE_OPTIONS`, `DEFAULT_SETTINGS`, `CalendarSettings` type utilities (`~/utils/settings`)

**Interactions:**
- Uses `@headlessui/react` `Popover` to create a popover menu.
- Uses radio buttons to allow users to select date range options.
- Uses `getCalendarSettings` and `saveCalendarSettings` utilities to interact with local storage for settings persistence.

**Edge Cases and Failure Modes:**
- Settings initialization: Initializes settings from local storage on component mount. If local storage is empty or corrupted, it falls back to `DEFAULT_SETTINGS`.
- Settings persistence: Relies on `saveCalendarSettings` to persist settings in local storage. Potential failures related to local storage are not explicitly handled.

**Business Rules and Validation:**
- Date range options are defined in `DATE_RANGE_OPTIONS` constant.
- Selected date range is persisted in local storage and used as default for calendar views.

---

**Feature:** Color Picker

**Description:**
The ColorPicker component (`ColorPicker.tsx`) provides a palette of predefined colors for users to select and customize the color associated with a calendar.

**Functionality:**
- **Color Palette Display:**
    - Renders a grid of color swatches, each representing a predefined color from the `CALENDAR_COLORS` array.
    - Uses buttons for each color swatch to make them interactive and accessible.
- **Color Selection:**
    - Allows users to select a color by clicking on a color swatch.
    - Visually indicates the currently selected color by adding a border and a checkmark icon.
    - Triggers the `onColorSelect` callback prop when a color is selected, passing the selected color value to the parent component.
- **Predefined Colors:**
    - Uses a constant array `CALENDAR_COLORS` to define the available color options. This array contains a list of hex color codes.

**Internal Logic and Data Flow:**
- Receives `selectedColor` and `onColorSelect` as props.
- **Color Mapping:**
    - `CALENDAR_COLORS`: An array of hex color codes defining the available color palette.
- **Rendering Color Swatches:**
    - Uses `CALENDAR_COLORS.map()` to iterate over the predefined colors and render a button for each color.
    - Applies inline styles to set the background color of each swatch button.
    - Conditionally applies CSS classes to highlight the `selectedColor` and provide hover effects.
    - Renders a checkmark icon (SVG) within the button when the color is selected.
- **Event Handling:**
    - `onClick` handler for each color swatch button: Calls the `onColorSelect` callback prop with the corresponding color value.

**Dependencies:**
- React (`useState`)

**Interactions:**
- Interacts with the parent component (e.g., `CalendarLink`) through the `onColorSelect` callback prop to notify about color selections.

**Edge Cases and Failure Modes:**
- No specific edge cases or failure modes are apparent in the ColorPicker component. It's a purely presentational component that provides color selection UI.
- Limited color palette: The color choices are limited to the predefined colors in `CALENDAR_COLORS`.

**Business Rules and Validation:**
- Color selection is limited to the predefined colors in `CALENDAR_COLORS`.
- The `selectedColor` prop indicates the currently active color, and `onColorSelect` is used to communicate color changes to the parent component.

---

**Feature:** Confirm Dialog

**Description:**
The ConfirmDialog component (`ConfirmDialog.tsx`) is a generic modal dialog that prompts the user for confirmation before performing a potentially destructive action, such as deleting a calendar or event.

**Functionality:**
- **Modal Dialog:**
    - Displays a modal dialog overlay when opened, blocking interaction with the rest of the application.
    - Uses CSS transitions for smooth opening and closing animations.
    - Can be closed by clicking a close button in the header or clicking outside the dialog content area.
    - Uses React Portal to render the dialog content at the `portal-container` element in the DOM, ensuring proper layering and event handling.
- **Confirmation Prompt:**
    - Displays a title and a message to clearly explain the action being confirmed.
    - Customizable title and message via props.
- **Confirm and Cancel Actions:**
    - Provides two buttons: "Confirm" and "Cancel".
    - "Confirm" button: Triggers the `onConfirm` callback prop and then closes the dialog. The button label is customizable via `confirmLabel` prop (default: "Delete").
    - "Cancel" button: Triggers the `onClose` callback prop, closing the dialog without performing the action. The button label is customizable via `cancelLabel` prop (default: "Cancel").
- **Backdrop Click Handling:**
    - Closes the dialog when the backdrop (the area outside the dialog content) is clicked.

**Internal Logic and Data Flow:**
- Receives `isOpen`, `onClose`, `onConfirm`, `title`, `message`, `confirmLabel`, and `cancelLabel` as props.
- **Modal Rendering:**
    - Uses React Portal (`createPortal`) to render the dialog content into the `portal-container` element in the DOM.
    - Conditionally renders the dialog based on the `isOpen` prop.
    - Uses CSS classes and inline styles to create the modal overlay and dialog box with animations.
- **Event Handlers:**
    - `handleBackdropClick`: Closes the dialog when the backdrop is clicked.
- **Button Click Handlers:**
    - "Cancel" button `onClick`: Calls the `onClose` callback prop.
    - "Confirm" button `onClick`: Calls the `onConfirm` callback prop and then calls the `onClose` callback prop.

**Dependencies:**
- React (`createPortal`)

**Interactions:**
- Interacts with the parent component through the `isOpen`, `onClose`, and `onConfirm` props to control dialog visibility and handle confirmation actions.

**Edge Cases and Failure Modes:**
- Portal container: Relies on the existence of a `portal-container` element in the DOM to render the dialog. Returns `null` if the container is not found or if running in a non-browser environment.
- Dialog closing: Handles closing the dialog when clicking outside the content area or clicking the close/cancel buttons.

**Business Rules and Validation:**
- Provides a UI for confirming actions. The specific action to be confirmed and the logic to perform it are determined by the parent component through the `onConfirm` callback.
- Customizable labels for confirm and cancel buttons allow for flexible use in different contexts.

---

**Feature:** Current Time Indicator

**Description:**
The CurrentTimeIndicator component (`CurrentTimeIndicator.tsx`) displays a visual indicator in the calendar day view to represent the current time of day. It's a horizontal line with a red dot that moves down the day view as time progresses.

**Functionality:**
- **Real-time Position Update:**
    - Calculates the vertical position of the indicator based on the current local time.
    - Updates the position every minute to reflect the passage of time.
- **Visual Representation:**
    - Renders a horizontal red line with a red dot at the beginning to visually represent the current time.
    - Designed to be placed within a calendar day view, aligning with the time slots.

**Internal Logic and Data Flow:**
- **State Management:**
    - `position`: State variable to store the vertical position (in pixels) of the time indicator. Initialized with the result of `getLocalTimePosition()` on component mount.
- **Time Position Calculation:**
    - `getLocalTimePosition()` function:
        - Gets the current local time using `new Date()`.
        - Calculates the number of minutes since midnight.
        - Calculates the pixel position based on the assumption that each hour slot in the day view is 48 pixels high (defined by `pixelsPerHour` constant, corresponding to `h-12` class in Tailwind CSS).
        - Returns the calculated pixel position.
- **Effects:**
    - Time update interval effect (`useEffect` with empty dependency array):
        - Calls `getLocalTimePosition()` initially to set the initial position.
        - Sets up an interval using `setInterval` to call `getLocalTimePosition()` and update the `position` state every 60 seconds (1 minute).
        - Clears the interval using `clearInterval` on component unmount to prevent memory leaks.

**Dependencies:**
- React (`useState`, `useEffect`)

**Interactions:**
- The component is designed to be used within a calendar day view component. It relies on the day view layout having hour slots that are approximately 48 pixels high for accurate positioning.

**Edge Cases and Failure Modes:**
- Time zone: The component uses local time to calculate the position. It does not handle different time zones or time zone changes.
- Day view layout dependency: The position calculation is based on the assumption of 48 pixels per hour slot. If the day view layout changes, this value might need to be adjusted.
- Browser/system clock accuracy: The accuracy of the time indicator depends on the accuracy of the browser's or system's clock.

**Business Rules and Validation:**
- Represents the current local time visually in the day view.
- Updates every minute to reflect real-time progression.

---

**Feature:** Edit Calendar Dialog

**Description:**
The EditCalendarDialog component (`EditCalendarDialog.tsx`) is a modal dialog that allows users to edit the details of an existing calendar, specifically the App Name and iCal Link. It fetches the calendar data from the server when opened and submits updates to the server when saved.

**Functionality:**
- **Modal Dialog:**
    - Displays a modal dialog overlay when opened, blocking interaction with the rest of the application.
    - Uses CSS transitions for smooth opening and closing animations.
    - Can be closed by clicking a close button in the header or clicking outside the dialog content area.
    - Uses React Portal to render the dialog content at the `portal-container` element in the DOM.
- **Calendar Data Fetching:**
    - Uses Remix `useFetcher` to fetch calendar details from the `/calendar/edit/$id` route when the dialog is opened. The calendar ID is passed as a route parameter.
    - Displays a loading state (implicitly handled by `useFetcher` state) while fetching data.
- **Input Form:**
    - Contains a form with fields for "App ID", "App Name", and "iCal Link".
    - "App ID" is a read-only text input field, as it's the primary key and cannot be changed.
    - "App Name" and "iCal Link" are editable text and URL input fields respectively.
    - All fields are required for form submission.
- **Form Submission:**
    - Uses Remix `<Form>` component with `method="post"` and `action="/calendar/edit/$id"` to submit the form data to the server when the "Save Changes" button is clicked.
    - Submits updated "App Name" and "iCal Link" to the server.
- **Local Storage Update:**
    - After successful form submission (indicated by `fetcher.data?.success`), updates the calendar details in local storage (`calendar-favorites`) if the calendar is in favorites.
    - Dispatches a custom event `favoriteChanged` with `type: 'update'` to notify other parts of the application about the calendar update.
    - Dispatches a standard `storage` event to force UI updates in other browser tabs/windows.
- **Form State Management:**
    - Uses React's `useState` to manage the input values for "App Name" and "iCal Link" (`appName`, `icalLink` state variables). "App ID" is managed using `useState` but initialized only once and read-only.
    - Initializes form fields with fetched calendar data or passed `calendar` prop.
    - Updates form fields when `calendarData` prop changes using `useEffect`.
- **Cancel Action:**
    - Includes a "Cancel" button that calls the `onClose` callback prop, closing the dialog without saving changes.

**Internal Logic and Data Flow:**
- Receives `isOpen`, `onClose`, and `calendar` as props.
- **Fetcher:**
    - `fetcher = useFetcher()`: Uses Remix `useFetcher` to fetch calendar data and submit form updates.
- **State Management:**
    - `isOpen`: Controls dialog visibility, received as prop.
    - `appId`: Read-only state, initialized with `calendar.id`.
    - `appName`, `icalLink`: State variables for form inputs, initialized with `calendarData` or `calendar` prop.
    - `submittedValuesRef`: Ref to store submitted form values for updating local storage after successful submission.
- **Effects:**
    - Data fetching effect (`useEffect` with `isOpen`, `calendar.id` dependencies): Fetches calendar data when dialog is opened.
    - Form update effect (`useEffect` with `calendarData` dependency): Updates form fields when `calendarData` changes.
    - Submission completion effect (`useEffect` with `fetcher`, `fetcher.state`, `fetcher.data`, `calendar.id`, `onClose`, `appName`, `icalLink` dependencies): Handles local storage update and dialog closing after successful form submission.
- **Event Handlers:**
    - `handleBackdropClick`: Closes the dialog when the backdrop is clicked.
    - `handleSubmit`: Handles form submission using `fetcher.submit`.

**Dependencies:**
- React (`useState`, `useEffect`, `useRef`, `createPortal`)
- Remix (`Form`, `useFetcher`)
- `Calendar` type, `getFavorites` utility (`~/utils/favorites`)

**Interactions:**
- Interacts with the parent component through the `isOpen` and `onClose` props to control dialog visibility.
- Fetches calendar data from and submits updates to the `/calendar/edit/$id` route using Remix `useFetcher` and `<Form>`.
- Updates local storage and dispatches custom events to synchronize calendar data across the application.

**Edge Cases and Failure Modes:**
- Data fetching errors: Error handling for initial data fetching is not explicitly implemented in the component. It's assumed that the `/calendar/edit/$id` route handles errors and returns appropriate responses.
- Form validation: Relies on browser's built-in URL validation for the "iCal Link" field and `required` attributes for all fields. Server-side validation in the `/calendar/edit/$id` route is expected to handle more robust validation and error handling.
- Local storage update failures: Potential failures related to local storage access or corruption during update are not explicitly handled.

**Business Rules and Validation:**
- Requires "App Name" and "iCal Link" to be filled in for form submission. "App ID" is read-only.
- Expects "iCal Link" to be a valid URL.
- Updates calendar details in local storage and notifies other parts of the application about changes after successful server-side update.

---

**Feature:** Event Details Dialog

**Description:**
The EventDetailsDialog component (`EventDetailsDialog.tsx`) displays a modal dialog that shows detailed information about a calendar event, including the title, time, location, and description.

**Functionality:**
- **Modal Dialog:**
    - Uses `@headlessui/react` `Dialog` component to create a full-screen modal dialog that overlays the content.
    - Can be closed by clicking the "Close" button or by clicking outside the dialog panel (due to `onClose` prop on `Dialog` component).
- **Event Information Display:**
    - Displays the event title in the dialog header.
    - Shows the event start and end times, formatted using `date-fns` `format` function.
    - Optionally displays the event location if available.
    - Optionally displays the event description if available, with whitespace pre-wrapping to preserve formatting.
- **Close Action:**
    - Includes a "Close" button that calls the `onClose` callback prop, closing the dialog.

**Internal Logic and Data Flow:**
- Receives `event`, `isOpen`, and `onClose` as props.
- **Conditional Rendering:**
    - If `event` prop is `null`, the component returns `null` and does not render anything.
    - Renders the dialog content only when `isOpen` prop is `true` (controlled by `@headlessui/react` `Dialog` component).
- **Event Data Display:**
    - Displays event properties (`title`, `startTime`, `endTime`, `location`, `description`) from the `event` prop.
    - Uses `date-fns` `format` function to format `startTime` and `endTime` for user-friendly display.
    - Conditionally renders location and description sections only if the corresponding data is available in the `event` prop.

**Dependencies:**
- React
- `@headlessui/react` (`Dialog`)
- `date-fns` (`format`)
- `CalendarEvent` type (`~/utils/calendar.server`)

**Interactions:**
- Interacts with the parent component through the `isOpen` and `onClose` props to control dialog visibility.
- Receives event data through the `event` prop to display event details.

**Edge Cases and Failure Modes:**
- Null event data: Handles cases where the `event` prop is `null` by not rendering the dialog.
- Missing location or description:gracefully handles cases where event location or description are not available by conditionally rendering those sections.

**Business Rules and Validation:**
- Displays event details in a modal dialog. The specific event data to be displayed is passed through the `event` prop.
- Uses `date-fns` for consistent date and time formatting.

---

**Feature:** Index Route

**Description:**
The Index Route (`_index.tsx`) defines the application's root path (`/`). It's responsible for handling requests to the root URL and redirecting users to the default calendar view, which is the week view (`/calendar/week`).

**Functionality:**
- **Redirection:**
    - Implements a Remix `loader` function.
    - Uses the `redirect` function from `@remix-run/node` to perform a server-side redirect to the `/calendar/week` route.

**Internal Logic and Data Flow:**
- **Loader Function:**
    - The `loader` function is executed when a user navigates to the root path (`/`).
    - It immediately calls `redirect("/calendar/week")`, which sends a 302 redirect response to the browser, instructing it to navigate to `/calendar/week`.

**Dependencies:**
- Remix (`redirect`, `LoaderFunction`)

**Interactions:**
- Handles requests to the root path (`/`).
- Redirects to the Week View route (`/calendar/week`).

**Edge Cases and Failure Modes:**
- No specific edge cases or failure modes are apparent in this simple redirection route. If the `/calendar/week` route is not defined or throws an error, the redirection might fail, but the Index Route itself will always attempt to redirect.

**Business Rules and Validation:**
- Defines the default landing page of the application as the week calendar view.

---

**Feature:** Week View Route

**Description:**
The Week View Route (`calendar.week.tsx`) defines the `/calendar/week` route, displaying a weekly calendar view. It fetches calendar events for the week, renders them in a grid layout, and allows users to view event details in a dialog.

**Functionality:**
- **Data Loading:**
    - Implements a Remix `loader` function to fetch calendar events for the week.
    - Fetches events from a specific calendar if `calendarId` is provided as a query parameter.
    - Uses `getCachedEvents` to retrieve cached events initially. If no cached events are found or `calendarId` is not provided, it fetches events from the database using `fetchCalendarEvents` and `db.query.calendar.findFirst`.
    - Handles loading state using `isLoading` flag in the loader and `isDataLoading` and `navigation.state` in the component, displaying a loading spinner during data fetching.
    - Fetches calendar colors from favorites using `getFavorites` and applies them to events.
- **Weekly Calendar Display:**
    - Renders a weekly calendar grid with columns for each day of the week and rows for time slots (hourly).
    - Displays day names and numbers in column headers, highlighting the current day.
    - Displays time labels in the time gutter column.
    - Renders hour lines to visually separate time slots.
    - Uses `CurrentTimeIndicator` component to display a real-time indicator in the current day column.
- **Event Rendering:**
    - Filters and renders events that fall within the displayed week and are visible based on `visibleCalendars` context.
    - Positions events within the grid based on their start and end times, calculating top position and height based on minutes from midnight and event duration.
    - Visually represents event colors using background and border styles, using calendar colors from favorites.
    - Handles events that span across day boundaries, visually indicating continuation with rounded corners and "(...)" suffix in the title.
- **Event Interaction:**
    - Allows users to click on events to view event details in the `EventDetailsDialog`.
    - Opens the `EventDetailsDialog` component when an event is clicked, passing the selected event data.
- **State Management:**
    - Uses `useState` to manage:
        - `selectedEvent`: The currently selected event for displaying details in the dialog.
        - `events`: The array of calendar events to display, initialized with data from the loader and updated on data changes.
        - `favorites`: Array of favorite calendars, fetched using `getFavorites`.
- **Context Consumption:**
    - Uses `useOutletContext<ContextType>()` to access:
        - `currentDate`: The currently selected date, used to determine the displayed week.
        - `visibleCalendars`: A Set of calendar IDs that are currently visible.
- **Navigation Hook:**
    - Uses `useNavigation` to track navigation state and display loading indicator during route transitions.
- **Client-Side Storage:**
    - Uses `clientUtils.setLastCalendarView('week')` for faster navigation between routes.

**Internal Logic and Data Flow:**
- **Loader Function:**
    - Fetches calendar events and calendar colors.
    - Returns event data, loading state, and timestamp as JSON.
- **Component Rendering:**
    - Receives event data and loading state from `useLoaderData`.
    - Accesses `currentDate` and `visibleCalendars` from context using `useOutletContext`.
    - Manages `selectedEvent`, `events`, and `favorites` state using `useState`.
    - Calculates week start and end dates based on `currentDate`.
    - Filters events for the current week and visible calendars.
    - Generates time slots and week dates arrays for rendering the grid.
    - Formats column headers using `formatColumnHeader` function.
    - Renders the calendar grid, time labels, day columns, hour lines, current time indicator, and events.
    - Renders `EventDetailsDialog` to display event details.
- **Effects:**
    - Favorites loading effect (`useEffect` with empty dependency array): Fetches favorites on component mount.
    - Color change listener effect (`useEffect` with empty dependency array): Listens for `favoriteChanged` events to update event colors when calendar colors are changed in settings.
    - Initial events update effect (`useEffect` with `initialEvents`, `favorites` dependencies): Updates `events` state when `initialEvents` or `favorites` change, applying favorite colors to new events.
    - Loading indicator effect (`useEffect` with `isDataLoading`, `navigation.state`, `navigation.location?.search`, `showLoading`, `hideLoading` dependencies): Shows and hides loading spinner based on data loading and navigation states.
    - Last view storage effect (`useEffect` with empty dependency array): Stores 'week' as the last visited calendar view in client-side storage on component mount.

**Dependencies:**
- React (`useState`, `useEffect`)
- Remix (`useLoaderData`, `useOutletContext`, `useNavigation`, `json`, `LoaderFunctionArgs`)
- `db` (database client - `~/utils/db.server`)
- `fetchCalendarEvents`, `getCachedEvents`, `CalendarEvent` type (`~/utils/calendar.server`)
- `startOfWeek`, `endOfWeek`, `startOfDay`, `endOfDay` from `date-fns`
- `clientUtils` (`~/utils/client`)
- `LoadingSpinner` component (`~/components/LoadingSpinner`)
- `CurrentTimeIndicator` component (`~/components/CurrentTimeIndicator`)
- `EventDetailsDialog` component (`~/components/EventDetailsDialog`)
- `getFavorites`, `Calendar` type (`~/utils/favorites`)
- `useLoading` hook (`~/contexts/LoadingContext`)

**Interactions:**
- Fetches calendar events using `fetchCalendarEvents` or retrieves them from cache using `getCachedEvents` in the loader.
- Queries the database using `db.query.calendar.findFirst` in the loader.
- Uses `getFavorites` to fetch favorite calendars and their colors.
- Uses `clientUtils.setLastCalendarView` to store the last visited view.
- Uses `LoadingContext` to display loading spinner.
- Renders `CurrentTimeIndicator` and `EventDetailsDialog` components.
- Interacts with `EventDetailsDialog` to display event details when events are clicked.
- Consumes `currentDate` and `visibleCalendars` from the outlet context.

**Edge Cases and Failure Modes:**
- Data fetching errors: Handles potential errors during event data fetching in the loader using a `try...finally` block, ensuring loading state is reset even if fetching fails. Error handling for API requests and database queries is expected to be implemented in `fetchCalendarEvents` and `db.query.calendar.findFirst` utilities.
- Event date parsing errors: Includes error handling for parsing event start and end times using `try...catch` block when filtering events, logging errors and skipping invalid events.
- No events: Handles cases where no events are found for the week or calendar by rendering an empty calendar grid without events.
- CalendarId parameter: Handles cases where `calendarId` query parameter is not provided, fetching all events or displaying a default view (behavior depends on `fetchCalendarEvents` implementation).
- Calendar visibility: Filters events based on `visibleCalendars` context, only displaying events for calendars that are currently visible.

**Business Rules and Validation:**
- Displays calendar events in a weekly grid layout.
- Fetches and displays events for a specific calendar if `calendarId` is provided, otherwise may display events from all calendars or a default calendar (depending on `fetchCalendarEvents` implementation).
- Uses cached events when available to improve performance and reduce API requests.
- Visually indicates the current time in the day view.
- Allows users to view detailed information about calendar events.
- Persists the last visited calendar view in client-side storage.

---

**Feature:** Day View Route

**Description:**
The Day View Route (`calendar.day.tsx`) defines the `/calendar/day` route, displaying a daily calendar view. It fetches calendar events for the day, renders them in a time-based layout, and allows users to view event details in a dialog.

**Functionality:**
- **Data Loading:**
    - Implements a Remix `loader` function to fetch calendar events for the day.
    - Fetches events from a specific calendar if `calendarId` is provided as a query parameter.
    - Uses `getCachedEvents` to retrieve cached events initially, checking for cache info using `getCachedEvents(calendarId, true)`. If no cached events are found or `calendarId` is not provided, it fetches events from the database using `fetchCalendarEvents` and `db.query.calendar.findFirst`.
    - Handles loading state using `isLoading` flag in the loader and `isDataLoading`, `isCached` and `navigation.state` in the component, displaying a loading spinner during data fetching.
    - Fetches calendar colors from favorites using `getFavorites` and applies them to events.
- **Daily Calendar Display:**
    - Renders a daily calendar grid with a single column for the day and rows for time slots (hourly).
    - Displays day name and number in the column header, highlighting the current day.
    - Displays time labels in the time gutter column.
    - Renders hour lines to visually separate time slots.
    - Uses `CurrentTimeIndicator` component to display a real-time indicator in the day view.
- **Event Rendering:**
    - Filters and renders events that fall within the displayed day and are visible based on `visibleCalendars` context.
    - Positions events within the grid based on their start and end times, calculating top position and height based on minutes from midnight and event duration.
    - Visually represents event colors using background and border styles, using calendar colors from favorites.
    - Handles events that start before or end after the displayed day, visually indicating continuation with rounded corners and "(...)" suffix in the title.
- **Event Interaction:**
    - Allows users to click on events to view event details in the `EventDetailsDialog`.
    - Opens the `EventDetailsDialog` component when an event is clicked, passing the selected event data.
- **State Management:**
    - Uses `useState` to manage:
        - `selectedEvent`: The currently selected event for displaying details in the dialog.
        - `events`: The array of calendar events to display, initialized with data from the loader and updated on data changes.
        - `favorites`: Array of favorite calendars, fetched using `getFavorites`.
- **Context Consumption:**
    - Uses `useOutletContext<ContextType>()` to access:
        - `currentDate`: The currently selected date, used to determine the displayed day.
        - `visibleCalendars`: A Set of calendar IDs that are currently visible.
- **Navigation Hook:**
    - Uses `useNavigation` to track navigation state and display loading indicator during route transitions.
- **Client-Side Storage:**
    - Uses `clientUtils.setLastCalendarView('day')` to store the last visited calendar view in client-side storage.
- **Event Filtering and Parsing:**
    - Filters events to include only those that overlap with the current day, using `startOfDay` and `endOfDay` from `date-fns` and `currentDate` from context.
    - Parses event start and end times using `new Date()`, handling potential invalid dates and logging errors.
    - Adjusts event start and end times to day boundaries if events start before or end after the current day.
    - Adds `continuesFromPrevDay` and `continuesNextDay` boolean properties to event objects to indicate event continuation beyond the current day.

**Internal Logic and Data Flow:**
- **Loader Function:**
    - Fetches calendar events and calendar colors, similar to Week View Route but optimized for day view.
    - Returns event data, loading state, cache status and timestamp as JSON.
- **Component Rendering:**
    - Receives event data, loading state, and cache status from `useLoaderData`.
    - Accesses `currentDate` and `visibleCalendars` from context using `useOutletContext`.
    - Manages `selectedEvent`, `events`, and `favorites` state using `useState`.
    - Formats day header using `formatDayHeader` function.
    - Filters events for the current day and visible calendars, parsing and adjusting event times.
    - Generates time slots array for rendering the grid.
    - Renders the calendar grid, time labels, day column, hour lines, current time indicator, and events.
    - Renders `EventDetailsDialog` to display event details.
- **Effects:**
    - Favorites loading effect, color change listener effect, initial events update effect: Same as in Week View Route.
    - Loading indicator effect (`useEffect` with `isDataLoading`, `isCached`, `navigation.state`, `navigation.location?.search`, `location.search`, `showLoading`, `hideLoading` dependencies): Shows and hides loading spinner based on data loading, cache status and navigation states, with more conditions to optimize loading display based on cache and navigation changes.
    - Last view storage effect: Same as in Week View Route, but stores 'day' as the last visited view.

**Dependencies:**
- React (`useState`, `useEffect`)
- Remix (`useLoaderData`, `useOutletContext`, `useNavigation`, `json`, `LoaderFunctionArgs`)
- `db` (database client - `~/utils/db.server`)
- `fetchCalendarEvents`, `getCachedEvents`, `CalendarEvent` type (`~/utils/calendar.server`)
- `startOfDay`, `endOfDay`, `parseISO` from `date-fns`
- `CurrentTimeIndicator` component (`~/components/CurrentTimeIndicator`)
- `clientUtils` (`~/utils/client`)
- `LoadingSpinner` component (`~/components/LoadingSpinner`)
- `EventDetailsDialog` component (`~/components/EventDetailsDialog`)
- `getFavorites` (`~/utils/favorites`)
- `useLoading` hook (`~/contexts/LoadingContext`)

**Interactions:**
- Similar interactions as Week View Route, but optimized for day view data fetching and display.

**Edge Cases and Failure Modes:**
- Similar edge cases and failure modes as Week View Route, with specific handling for day view constraints and optimizations for cached data and loading states.

**Business Rules and Validation:**
- Displays calendar events in a daily time-based layout.
- Fetches and displays events for a specific calendar if `calendarId` is provided, otherwise may display events from all calendars or a default calendar.
- Uses cached events when available, checking cache info for staleness.
- Visually indicates the current time in the day view.
- Allows users to view detailed information about calendar events.
- Persists the last visited day view in client-side storage.

---

**Feature:** Month View Route

**Description:**
The Month View Route (`calendar.month.tsx`) defines the `/calendar/month` route, displaying a monthly calendar view. It fetches calendar events for the month, renders them in a grid layout, and allows users to view event details in a dialog. It also supports mouse wheel scrolling for month navigation.

**Functionality:**
- **Data Loading:**
    - Implements a Remix `loader` function to fetch calendar events for the month.
    - Fetches events from a specific calendar if `calendarId` is provided as a query parameter.
    - Prioritizes cached events using `getCachedEvents`. If cached events are not available, fetches fresh data using `fetchCalendarEvents` and `db.query.calendar.findFirst`.
    - Handles loading state using `isLoading` flag in the loader and `isDataLoading` and `navigation.state` in the component, displaying a loading spinner during data fetching.
    - Fetches calendar colors from favorites using `getFavorites` and applies them to events.
- **Monthly Calendar Display:**
    - Renders a monthly calendar grid with 7 columns (days of the week) and 6 rows (weeks).
    - Displays day names in the header row.
    - Renders dates for the current month, highlighting the current day.
    - Includes empty slots for days outside the current month to complete the 6x7 grid.
- **Event Rendering:**
    - Filters and renders events for each day in the month, considering calendar visibility (`visibleCalendars` context).
    - Limits the number of displayed events per day to keep the UI clean.
    - Visually represents event colors using background and border styles, using calendar colors from favorites.
    - Handles events that span across day boundaries, visually indicating continuation with "(...)" suffix in the title.
- **Event Interaction:**
    - Allows users to click on events to view event details in the `EventDetailsDialog`.
    - Opens the `EventDetailsDialog` component when an event is clicked, passing the selected event data.
- **Month Navigation (Mouse Wheel Scroll):**
    - Implements mouse wheel scrolling for navigating to the previous or next month.
    - Uses `debounce` to limit the frequency of month changes on rapid scrolling.
    - Updates the `currentDate` context value to trigger month change when scrolling.
- **State Management:**
    - Uses `useState` to manage:
        - `selectedEvent`: The currently selected event for displaying details in the dialog.
        - `events`: The array of calendar events to display, initialized with data from the loader and updated on data changes.
        - `favorites`: Array of favorite calendars, fetched using `getFavorites`.
- **Context Consumption:**
    - Uses `useOutletContext<ContextType>()` to access:
        - `currentDate`: The currently selected date, used to determine the displayed month.
        - `setCurrentDate`: Function to update the `currentDate` context value for month navigation.
        - `visibleCalendars`: A Set of calendar IDs that are currently visible.
- **Navigation Hook:**
    - Uses `useNavigation` to track navigation state and display loading indicator during route transitions.
- **Client-Side Storage:**
    - Uses `clientUtils.setLastCalendarView('month')` to store the last visited calendar view in client-side storage.
- **Date Generation:**
    - `generateMonthDates` function: Generates an array of dates (and nulls for empty slots) to populate the month grid, ensuring a fixed 6x7 grid size.
- **Event Filtering (per day):**
    - `getEventsForDate` function: Filters events to retrieve only those that fall on a specific date, used for rendering events within each day cell in the month grid.

**Internal Logic and Data Flow:**
- **Loader Function:**
    - Fetches calendar events and calendar colors, optimized for month view data requirements.
    - Returns event data and loading state as JSON.
- **Component Rendering:**
    - Receives event data and loading state from `useLoaderData`.
    - Accesses `currentDate`, `setCurrentDate`, and `visibleCalendars` from context using `useOutletContext`.
    - Manages `selectedEvent`, `events`, and `favorites` state using `useState`.
    - Generates month dates using `generateMonthDates` function.
    - Renders the month grid, day headers, date cells, and events within each day cell.
    - Renders `EventDetailsDialog` to display event details.
- **Effects:**
    - Favorites loading effect, color change listener effect, initial events update effect, loading indicator effect, last view storage effect: Same as in Week and Day View Routes.
    - Mouse wheel scroll effect (`useEffect` with `handleWheel` dependency): Attaches and detaches mouse wheel event listener to the month grid element for month navigation.
- **Event Handlers:**
    - `handleWheel`: Debounced function to handle mouse wheel scroll events, updating `currentDate` context value for month navigation.

**Dependencies:**
- React (`useState`, `useEffect`, `useCallback`)
- Remix (`useLoaderData`, `useOutletContext`, `useNavigation`, `json`, `LoaderFunctionArgs`)
- `db` (database client - `~/utils/db.server`)
- `fetchCalendarEvents`, `getCachedEvents`, `CalendarEvent` type (`~/utils/calendar.server`)
- `startOfMonth`, `endOfMonth`, `startOfDay`, `endOfDay` from `date-fns`
- `clientUtils` (`~/utils/client`)
- `LoadingSpinner` component (`~/components/LoadingSpinner`)
- `EventDetailsDialog` component (`~/components/EventDetailsDialog`)
- `getFavorites`, `Calendar` type (`~/utils/favorites`)
- `useLoading` hook (`~/contexts/LoadingContext`)
- `debounce` utility (`~/utils/helpers`)

**Interactions:**
- Similar interactions as Week and Day View Routes, with added mouse wheel scroll interaction for month navigation.

**Edge Cases and Failure Modes:**
- Similar edge cases and failure modes as Week and Day View Routes.
- Mouse wheel scroll handling: Uses debouncing to prevent excessive month changes on rapid scrolling. May have slight delays in month navigation due to debouncing.
- Month grid generation: `generateMonthDates` function ensures a fixed 6x7 grid size, handling months with different numbers of days and different starting days of the week.

**Business Rules and Validation:**
- Displays calendar events in a monthly grid layout.
- Fetches and displays events for a specific calendar if `calendarId` is provided, otherwise may display events from all calendars or a default calendar.
- Uses cached events when available.
- Allows month navigation using mouse wheel scroll.
- Allows users to view detailed information about calendar events.
- Persists the last visited month view in client-side storage.

---

**Feature:** Calendar Add Route

**Description:**
The Calendar Add Route (`calendar.add.tsx`) defines the `/calendar/add` route, which handles the submission of the "Create Calendar" form. It's a Remix action route that receives form data, validates it, and adds a new calendar to the database.

**Functionality:**
- **Form Submission Handling:**
    - Implements a Remix `action` function to handle POST requests to the `/calendar/add` route.
    - Checks if the request method is POST; if not, returns a 405 "Method Not Allowed" response.
- **Form Data Extraction:**
    - Extracts `appId`, `appName`, and `icalLink` from the submitted form data using `request.formData()`.
- **Data Validation:**
    - Checks if `appId`, `appName`, and `icalLink` are present in the form data.
    - If any of these required fields are missing, throws an error (which will be handled by Remix error handling).
- **Database Insertion:**
    - Uses `db.insert(schema.calendar).values(...)` to insert a new calendar record into the database using Drizzle ORM.
    - Inserts the extracted `appId`, `appName`, and `icalLink` into the `calendar` table.
- **Redirection:**
    - After successful database insertion, redirects the user to the week view (`/calendar/week`) using `redirect("/calendar/week")`.

**Internal Logic and Data Flow:**
- **Action Function:**
    - The `action` function is executed when the "Create Calendar" form is submitted to the `/calendar/add` route.
    - It performs form data extraction, validation, database insertion, and redirection.
- **Database Interaction:**
    - Uses `db.insert` to interact with the database and add a new calendar record.
    - Uses `schema.calendar` to reference the calendar table schema defined in Drizzle.

**Dependencies:**
- Remix (`ActionFunctionArgs`, `redirect`)
- `db` (database client - `~/utils/db.server`)
- `schema` (database schema - `../../drizzle`)

**Interactions:**
- Handles POST requests to the `/calendar/add` route, typically submitted by the `CreateCalendarDialog` component.
- Interacts with the database to insert new calendar records.
- Redirects to the Week View route after successful calendar creation.

**Edge Cases and Failure Modes:**
- Invalid request method: Returns 405 error for non-POST requests.
- Missing required fields: Throws an error if `appId`, `appName`, or `icalLink` are missing in the form data. Error handling is expected to be managed by Remix error boundaries or parent components.
- Database errors: Potential database errors during insertion are not explicitly handled in this route. Error handling for database operations is expected to be implemented in `db.insert` or the database client.
- Data validation: Basic validation for required fields is implemented. More robust validation (e.g., URL validation for `icalLink`, uniqueness validation for `appId`) may be needed, potentially in this route or in the database schema/constraints.

**Business Rules and Validation:**
- Requires `appId`, `appName`, and `icalLink` to be provided in the form data.
- Adds a new calendar record to the database with the provided data.
- Redirects to the week view after successful calendar creation.

---

**Feature:** Calendar Edit Route

**Description:**
The Calendar Edit Route (`calendar.edit.$id.tsx`) defines the `/calendar/edit/$id` route, which handles both fetching calendar data for editing (using a loader) and submitting updated calendar data (using an action). The `$id` path parameter is used to identify the calendar being edited.

**Functionality:**
- **Data Loading (Loader):**
    - Implements a Remix `loader` function to fetch calendar data for a specific calendar ID.
    - Retrieves the calendar ID from the `params.id` path parameter.
    - Uses `db.query.calendar.findFirst` to query the database for the calendar with the matching ID.
    - If the calendar is not found, throws a 404 "Calendar not found" response.
    - If found, returns the calendar data as JSON in the loader response.
- **Form Submission Handling (Action):**
    - Implements a Remix `action` function to handle POST requests to the `/calendar/edit/$id` route.
    - Extracts `appName` and `icalLink` from the submitted form data using `request.formData()`.
- **Data Validation (Action):**
    - Checks if `appName` and `icalLink` are present in the form data.
    - If any of these required fields are missing, returns a 400 "Bad Request" JSON response with an error message.
- **Database Update (Action):**
    - Uses `db.update(schema.calendar).set(...).where(...)` to update the calendar record in the database.
    - Updates the `name` and `icalLink` fields of the calendar with the ID from `params.id`.
- **Success Response (Action):**
    - After successful database update, returns a 200 "OK" JSON response with `{ success: true }`.

**Internal Logic and Data Flow:**
- **Loader Function:**
    - Fetches calendar data from the database based on the `id` path parameter.
    - Returns calendar data as JSON.
- **Action Function:**
    - Extracts form data, validates required fields, and updates the corresponding calendar record in the database.
    - Returns a success or error JSON response.
- **Database Interaction:**
    - Uses `db.query.calendar.findFirst` in the loader to fetch calendar data.
    - Uses `db.update(schema.calendar).set(...).where(...)` in the action to update calendar data.
    - Uses `schema.calendar` and `eq` from Drizzle ORM for database queries and updates.

**Dependencies:**
- Remix (`LoaderFunctionArgs`, `ActionFunctionArgs`, `json`)
- `db`, `schema` (`~/utils/db.server`, `../../drizzle`)
- `eq` from `drizzle-orm`

**Interactions:**
- Handles GET requests to `/calendar/edit/$id` to load calendar data for editing (Loader).
- Handles POST requests to `/calendar/edit/$id` to submit updated calendar data (Action), typically submitted by the `EditCalendarDialog` component.
- Interacts with the database to fetch and update calendar records.

**Edge Cases and Failure Modes:**
- Calendar not found (Loader): Returns 404 error if no calendar with the provided ID exists.
- Missing required fields (Action): Returns 400 error if `appName` or `icalLink` are missing in the form data.
- Database errors: Potential database errors during fetch or update are not explicitly handled in this route. Error handling for database operations is expected to be implemented in `db.query.calendar.findFirst`, `db.update`, or the database client.
- Data validation: Basic validation for required fields is implemented in the action. More robust validation (e.g., URL validation for `icalLink`) may be needed, potentially in this route or in the database schema/constraints.

**Business Rules and Validation:**
- Requires `appName` and `icalLink` to be provided in the form data for updates.
- Updates the `name` and `icalLink` of the calendar with the matching ID in the database.
- Returns a success or error response in JSON format.

---

**Feature:** Calendar Refresh Cache Route

**Description:**
The Calendar Refresh Cache Route (`calendar.refresh-cache.tsx`) defines the `/calendar/refresh-cache` route, which is an action route responsible for refreshing the cached events for a specific calendar. It's used to manually trigger a cache refresh, ensuring the application displays the latest event data from the iCal feed.

**Functionality:**
- **Action Function:**
    - Implements a Remix `action` function to handle POST requests to the `/calendar/refresh-cache` route.
- **Calendar ID Extraction:**
    - Extracts the `calendarId` from the submitted form data using `request.formData()`.
- **Calendar ID Validation:**
    - Checks if `calendarId` is present in the form data.
    - If `calendarId` is missing, returns a 400 "Bad Request" JSON response with an error message.
- **Cache Refresh Initiation:**
    - Calls `refreshCalendarCache(calendarId)` to initiate the cache refresh process for the specified calendar ID. This function (defined in `~/utils/calendar.server`) is responsible for fetching fresh event data from the iCal feed and updating the cache.
- **Success Response:**
    - If `refreshCalendarCache` is successful, returns a 200 "OK" JSON response with:
        - `success: true`: Indicates successful cache refresh.
        - `events`: The array of refreshed calendar events.
        - `message`: A success message "Calendar cache refreshed successfully".
- **Error Handling:**
    - Implements comprehensive error handling for different failure scenarios during cache refresh:
        - **Calendar Not Found:** If `refreshCalendarCache` throws an error with a message including "Calendar not found", returns a 404 "Not Found" JSON response with an error message and details.
        - **Failed to fetch calendar data:** If `refreshCalendarCache` throws an error with a message including "Failed to fetch calendar data", returns a 502 "Bad Gateway" JSON response with an error message and details.
        - **Internal Server Error:** For any other errors during cache refresh, returns a 500 "Internal Server Error" JSON response with a generic error message and details.
- **CalendarRefreshSpinner Component:**
    - Exports a `CalendarRefreshSpinner` component, which is a simple wrapper around the `LoadingSpinner` component, pre-configured to display a "Refreshing calendar data..." message in full-screen mode. This component can be used to visually indicate cache refresh operations in the UI.

**Internal Logic and Data Flow:**
- **Action Function:**
    - The `action` function is executed when a POST request is made to the `/calendar/refresh-cache` route, typically triggered by a user action in the UI (e.g., clicking a "Refresh" button in `CalendarLink`).
    - It extracts the `calendarId`, validates it, calls `refreshCalendarCache` to perform the refresh, and returns a JSON response indicating success or failure.
- **Cache Refreshing:**
    - Relies on the `refreshCalendarCache` function (defined in `~/utils/calendar.server`) to handle the actual cache refresh logic, including fetching data from the iCal feed, updating the cache, and handling potential errors during the process.

**Dependencies:**
- Remix (`ActionFunction`, `json`)
- `refreshCalendarCache` utility (`~/utils/calendar.server`)
- `LoadingSpinner` component (`~/components/LoadingSpinner`)

**Interactions:**
- Handles POST requests to the `/calendar/refresh-cache` route, typically initiated by the `CalendarLink` component.
- Calls `refreshCalendarCache` utility to perform the actual cache refresh operation.
- Returns JSON responses to indicate the status of the cache refresh operation (success or various error types).
- Uses `LoadingSpinner` component via `CalendarRefreshSpinner` for UI loading indication (though `CalendarRefreshSpinner` is not directly used in this route file, it's exported for potential use elsewhere).

**Edge Cases and Failure Modes:**
- Missing calendarId: Returns 400 error if `calendarId` is not provided in the form data.
- Calendar not found: Returns 404 error if `refreshCalendarCache` indicates that the calendar with the provided ID was not found (e.g., in the database).
- Failed to fetch calendar data: Returns 502 error if `refreshCalendarCache` fails to fetch data from the iCal feed (e.g., due to network issues or invalid iCal link).
- Internal server error: Returns 500 error for any other unexpected errors during cache refresh.
- Loading indication: Provides `CalendarRefreshSpinner` component for UI loading indication during cache refresh, but the route itself doesn't directly manage or trigger the display of this spinner. The spinner display is expected to be handled by the component that initiates the cache refresh request (e.g., `CalendarLink`).

**Business Rules and Validation:**
- Requires `calendarId` to be provided to identify the calendar to refresh.
- Triggers a cache refresh operation for the specified calendar, fetching fresh event data from the iCal feed and updating the cache.
- Returns different error responses based on the specific failure scenario (calendar not found, failed to fetch data, internal server error).
- Provides a `CalendarRefreshSpinner` component for UI loading indication during cache refresh.

---

**Feature:** Search Route

**Description:**
The Search Route (`search.tsx`) defines the `/search` route, providing a search interface for calendars. It allows users to search calendars by ID or name, view search results, manage favorite calendars, edit calendar details, and delete calendars.

**Functionality:**
- **Data Loading (Loader):**
    - Implements a Remix `loader` function to fetch calendars based on a search query.
    - Retrieves the search query `q` from the URL search parameters.
    - If no query is provided, returns an empty list of calendars.
    - Queries the database using `db.select().from(schema.calendar).where(...)` to find calendars matching the query in either `id` or `name` fields, using Drizzle ORM's `like` and `or` operators for fuzzy searching.
    - Fetches cache information (last refresh timestamp) for each calendar using `getCachedEvents` and includes it in the loader response.
    - Returns calendar data and cache info as JSON.
- **Calendar Deletion (Action):**
    - Implements a Remix `action` function to handle POST requests for deleting calendars.
    - Extracts `calendarId` and `intent` from the form data.
    - Validates that the `intent` is "delete" and `calendarId` is provided.
    - Uses `db.delete(schema.calendar).where(...)` to delete the calendar from the database using Drizzle ORM.
    - Returns a JSON response indicating success or failure of the deletion.
- **Search Results Display:**
    - Displays search results as a list of calendars.
    - Shows calendar name, ID, and last refresh timestamp for each calendar in the search results.
    - Displays "No results found" message when no calendars match the search query.
- **Calendar Navigation:**
    - Provides links to navigate to calendar views (day, week, month) for each calendar in the search results.
    - Preserves the current calendar view when navigating from search results.
    - Indicates loading state during navigation to uncached calendars using `LoadingSpinner`.
- **Favorite Management:**
    - Allows users to toggle calendars as favorites using a star icon button.
    - Uses `addFavorite`, `removeFavorite`, and `isFavorite` utilities to manage favorite calendars in local storage.
    - Updates the UI to reflect the favorite status of each calendar.
- **Calendar Editing:**
    - Allows users to edit calendar details by clicking an "Edit" button, which opens the `EditCalendarDialog` component.
- **Calendar Deletion:**
    - Allows users to delete calendars by clicking a "Delete" button, which opens a `ConfirmDialog` to confirm the deletion before proceeding.
    - Handles calendar deletion using the action function and updates the UI to remove the deleted calendar from the search results immediately.
- **Loading Indication:**
    - Displays a `LoadingSpinner` component in full-screen mode when navigating to an uncached calendar from search results.
    - Uses Remix `useNavigation` hook to track navigation state and determine loading status.
- **State Management:**
    - Uses `useState` to manage:
        - `favorites`: An object to store the favorite status of each calendar, initialized based on local storage data.
        - `isNavigating`: A boolean to indicate whether navigation to a calendar is in progress (used for loading spinner).
        - `editingCalendar`: The calendar object being edited in the `EditCalendarDialog`.
        - `deleteCalendar`: The calendar object being deleted, used to open the `ConfirmDialog`.
- **Context Consumption:**
    - No context is consumed by this route component.
- **Navigation Hooks:**
    - Uses `useSearchParams` to access the search query from the URL.
    - Uses `useLocation` and `useNavigate` for programmatic navigation.
    - Uses `useNavigation` to track navigation state and display loading indicator.
- **Fetcher Hook:**
    - Uses `useFetcher` to handle form submissions for calendar deletion without full page reloads.
- **Client-Side Storage:**
    - Uses `clientUtils.getLastCalendarView()` to retrieve the last visited calendar view for navigation.
    - Uses `addFavorite`, `removeFavorite`, `isFavorite` utilities to manage favorite calendars in local storage.

**Internal Logic and Data Flow:**
- **Loader Function:**
    - Fetches calendars based on search query and retrieves cache info.
    - Returns calendar data and cache info as JSON.
- **Action Function:**
    - Handles calendar deletion requests, deleting the calendar from the database.
    - Returns success or error JSON response.
- **Component Rendering:**
    - Receives calendar data and cache info from `useLoaderData`.
    - Manages search query, favorites state, loading state, and dialog visibility using `useState` and `useSearchParams`.
    - Renders search input (in `root.tsx` header).
    - Renders search results as a list of calendars, including links to calendar views, favorite toggle buttons, edit and delete buttons.
    - Renders `LoadingSpinner` during navigation to uncached calendars.
    - Renders `EditCalendarDialog` for editing calendar details.
    - Renders `ConfirmDialog` for confirming calendar deletion.
- **Effects:**
    - Favorites initialization effect (`useEffect` with `calendars` dependency): Initializes `favorites` state based on the loaded calendars and local storage data.
    - Navigation state reset effect (`useEffect` with `navigation.state` dependency): Resets `isNavigating` state when navigation completes.
- **Event Handlers:**
    - `handleCalendarClick`: Handles clicks on calendar links, initiating navigation to calendar views and managing loading state.
    - `toggleFavorite`: Toggles the favorite status of a calendar, updating local storage and UI state.
    - `handleDelete`: Handles calendar deletion, submitting a form to the action function and updating UI state.

**Dependencies:**
- React (`useState`, `useEffect`)
- Remix (`useLoaderData`, `useSearchParams`, `useLocation`, `useNavigate`, `useNavigation`, `useFetcher`, `json`, `LoaderFunctionArgs`, `ActionFunctionArgs`, `Link`)
- `db`, `schema` (`~/utils/db.server`, `../../drizzle`)
- `eq`, `like`, `or` from `drizzle-orm`
- `addFavorite`, `removeFavorite`, `isFavorite`, `Calendar` type (`~/utils/favorites`)
- `clientUtils` (`~/utils/client`)
- `LoadingSpinner` component (`~/components/LoadingSpinner`)
- `PencilIcon`, `TrashIcon` from `@heroicons/react/24/outline`
- `EditCalendarDialog` component (`~/components/EditCalendarDialog`)
- `ConfirmDialog` component (`~/components/ConfirmDialog`)
- `getCachedEvents` utility (`~/utils/calendar.server`)

**Interactions:**
- Fetches calendars from the database based on search queries in the loader.
- Deletes calendars from the database in the action.
- Uses `getFavorites`, `addFavorite`, `removeFavorite`, `isFavorite` utilities to manage favorite calendars in local storage.
- Uses `clientUtils.getLastCalendarView` to retrieve the last visited calendar view.
- Renders `LoadingSpinner`, `EditCalendarDialog`, and `ConfirmDialog` components.
- Navigates to calendar views using Remix `<Link>` and `useNavigate`.

**Edge Cases and Failure Modes:**
- No search query: Displays all calendars or a default set of calendars when no search query is provided (behavior depends on loader implementation). Currently returns empty array.
- No search results: Displays "No results found" message when no calendars match the search query.
- Database errors: Handles potential database errors during calendar deletion in the action, returning an error response. Error handling for database queries in the loader is not explicitly implemented in this route.
- Navigation loading indication: Displays loading spinner only when navigating to uncached calendars, optimizing user experience by avoiding unnecessary loading spinners for cached calendars.
- Client-side storage errors: Potential errors related to local storage access during favorite management are not explicitly handled.

**Business Rules and Validation:**
- Allows searching calendars by ID or name (case-insensitive, partial matches).
- Allows users to manage favorite calendars (add/remove from quick access).
- Allows users to edit and delete calendars from the search results page.
- Provides loading indication during navigation to uncached calendars.

---

**Feature:** CSS Module Declaration

**Description:**
The `css.d.ts` file (`app/types/css.d.ts`) is a TypeScript declaration file that provides type definitions for CSS modules. This file allows importing CSS files directly into TypeScript or JavaScript modules without causing compilation errors. It essentially tells the TypeScript compiler how to handle CSS imports, treating them as modules that export a string `content`.

**Functionality:**
- **Module Declaration:**
    - Declares a TypeScript module for files ending with `.css` (`declare module '*.css'`).
    - This declaration informs the TypeScript compiler that any import statement that tries to import a file ending with `.css` should be treated as a module.
- **Default Export Definition:**
    - Defines a default export for the CSS module (`const content: string; export default content;`).
    - Specifies that the default export of a CSS module is a string constant named `content`. This string typically represents the CSS content itself, although in practice with CSS modules, it's often used to represent a mapping of class names to unique identifiers.

**Internal Logic and Data Flow:**
- **Type Declaration:**
    - This file doesn't contain any executable logic. It's purely a type declaration file for TypeScript.
    - It provides type information to the TypeScript compiler during the compilation process.
- **CSS Import Handling:**
    - When TypeScript compiler encounters an import statement like `import styles from './styles.css'`, it uses this declaration file to understand that `styles` is a module.
    - According to the declaration, `styles` will have a default export `content` of type `string`.

**Dependencies:**
- TypeScript

**Interactions:**
- This file interacts with the TypeScript compiler, influencing how CSS imports are processed during compilation.
- It enables importing CSS files in TypeScript/JavaScript code, which is commonly used in modern web development with CSS modules or similar CSS-in-JS approaches.

**Edge Cases and Failure Modes:**
- Incorrect declaration: If the declaration in `css.d.ts` is incorrect or doesn't match the actual behavior of CSS module processing (e.g., if CSS modules are not actually configured), it can lead to runtime errors or unexpected behavior, even if TypeScript compilation succeeds.
- Missing declaration: If this declaration file is missing, TypeScript compiler will likely throw errors when encountering CSS imports, as it won't know how to handle them as modules.

**Business Rules and Validation:**
- This file doesn't enforce any business rules or validation. It's purely a type declaration to facilitate CSS module imports in TypeScript projects.

---

**Feature:** Calendar Server Utilities

**Description:**
The `calendar.server.ts` file (`app/utils/calendar.server.ts`) provides server-side utility functions for fetching, caching, and processing calendar events from iCal feeds. It handles interactions with the database to retrieve calendar data and uses an in-memory cache to improve performance.

**Functionality:**
- **Event Fetching (`fetchCalendarEvents`):**
    - Fetches calendar events from a given iCal URL (`icalUrl`).
    - Uses `ical.js` library to parse iCal data.
    - Implements caching mechanism to store fetched events in memory (`calendarCache` Map).
    - Checks cache for fresh data before fetching from the network, using a `CACHE_TTL` of 30 seconds.
    - Expands recurring events based on the specified `dateRange` (number of months before and after the current date).
    - Filters events based on calendar visibility (using `getSafeFavorites` and `visibilityStatus` Map).
    - Adds calendar color information to events based on favorite calendars (using `getSafeFavorites` and `calendarColors` Map).
    - Handles fetch errors gracefully, returning cached data as fallback if available.
    - Warns in console if a large number of events are processed for a calendar, suggesting to reduce the date range.
- **Event Filtering by Date Range (`filterEventsByDateRange`):**
    - Filters an array of `CalendarEvent` objects to include only events that fall within a specified date range (`rangeStart` and `rangeEnd`).
    - Includes events that start within the range, end within the range, or span the entire range.
- **Cache Management:**
    - `calendarCache`: In-memory `Map` to store cached calendar events, using `icalUrl` and `calendarId` as cache keys.
    - `clearCalendarCache`: Function to clear the entire calendar cache or clear cache for a specific calendar (if `icalUrl` and `calendarId` are provided).
    - `getCalendarCacheInfo`: Function to retrieve information about the calendar cache, such as calendar ID, event count, last updated timestamp, and last refresh timestamp.
    - `getCachedEvents`: Function to retrieve cached events for a given `calendarId`. Can return either the array of cached events or just the cache info (last refresh timestamp) based on the `infoOnly` parameter.
- **Cache Refresh (`refreshCalendarCache` and `refreshCalendar`):**
    - `refreshCalendarCache`: Function to manually refresh the cache for a specific calendar ID.
        - Retrieves calendar data (including iCal link) from the database using `db.select` and `schema.calendar`.
        - Clears existing cache for the calendar using `clearCalendarCache`.
        - Calls `refreshCalendar` to fetch fresh events and update the cache.
        - Returns an object containing refreshed events and last refresh timestamp.
    - `refreshCalendar`: Function to fetch fresh events for a calendar, used internally by `refreshCalendarCache`. It's essentially a `fetchCalendarEvents` call with `forceRefresh = true`.
- **Data Structures and Types:**
    - `CalendarEvent` interface: Defines the structure of a calendar event object, including properties like `id`, `title`, `description`, `startTime`, `endTime`, `location`, `calendarId`, `recurrenceId`, and `color`.
    - `DateRangeSettings` interface: Defines the structure for date range settings, currently only including `months` property.
    - `CacheEntry` interface: Defines the structure for cache entries stored in `calendarCache`, including `events`, `timestamp`, `eventCount`, `dateRange`, and `lastRefresh`.
- **Server-Safe Favorites (`getServerFavorites`, `getSafeFavorites`):**
    - `getServerFavorites`: Function to retrieve favorite calendars on the server-side. Currently returns an empty array (as server-side favorites are not yet implemented).
    - `getSafeFavorites`: Function to get favorite calendars that works on both client and server. Uses `getServerFavorites` on the server and dynamically imports `getFavorites` from `./favorites.ts` for client-side.

**Internal Logic and Data Flow:**
- **Caching:**
    - Uses `calendarCache` (in-memory `Map`) to store fetched calendar events.
    - Cache keys are generated using `icalUrl` and `calendarId`.
    - Cache entries have a TTL of 30 seconds (`CACHE_TTL`).
    - `fetchCalendarEvents` checks the cache before fetching from the network and updates the cache after fetching fresh data.
    - `clearCalendarCache` and `refreshCalendarCache` are used to invalidate or refresh the cache.
- **Event Parsing:**
    - Uses `ical.js` library to parse iCal data fetched from iCal feeds.
    - Extracts event properties (title, description, start/end times, location, recurrence rules) from parsed iCal data.
    - Expands recurring events using `ical.js` iterator functionality.
- **Data Fetching:**
    - Uses `fetch` API to fetch iCal data from provided URLs.
    - Handles fetch errors and provides fallback to cached data if available.
- **Database Interaction:**
    - Uses `db.select(schema.calendar)...` to retrieve calendar data from the database in `refreshCalendarCache`.

**Dependencies:**
- `ical.js`
- `db`, `schema` (`~/utils/db.server`)
- `eq` from `drizzle-orm`
- `Calendar` type (`./favorites`)

**Interactions:**
- Used by route loaders (e.g., Week View Route, Day View Route, Month View Route) to fetch and retrieve calendar events.
- Used by Calendar Refresh Cache Route to refresh calendar event cache.
- Interacts with the database to retrieve calendar data (in `refreshCalendarCache`).
- Uses `ical.js` to parse iCal data.
- Uses in-memory cache (`calendarCache`) to store and retrieve fetched events.
- Interacts with `favorites.ts` (dynamically imported on client-side) to get favorite calendars and their colors/visibility.

**Edge Cases and Failure Modes:**
- Fetch errors: Handles fetch errors by returning cached data as fallback if available, or throwing the error if no cache is available.
- iCal parsing errors: Error handling for `ical.js` parsing errors is not explicitly implemented. Parsing errors might lead to empty event lists or incomplete data.
- Cache expiration: Uses a fixed `CACHE_TTL` of 30 seconds. Cache invalidation and refresh logic is based on this TTL.
- Large calendars: Warns in console if a large number of events are processed, but doesn't prevent processing or limit the number of events. Performance issues might arise with very large calendars or date ranges.
- Server-side vs. client-side favorites: Implements `getSafeFavorites` to handle favorites retrieval differently on server and client, as local storage-based favorites are not available on the server.

**Business Rules and Validation:**
- Caches calendar events in memory for 30 seconds to improve performance.
- Fetches fresh event data from iCal feeds when cache is expired or manually refreshed.
- Expands recurring events to cover a date range of ±1 month by default.
- Filters events based on calendar visibility settings.
- Prioritizes cached data over fresh data in case of fetch errors or cache hits.

---

**Feature:** Client-Side Utilities

**Description:**
The `client.ts` file (`app/utils/client.ts`) provides client-side utility functions for managing the last visited calendar view in local storage. This allows the application to remember the user's preferred calendar view (day, week, or month) and restore it when they return to the application.

**Functionality:**
- **Last View Storage:**
    - Uses `localStorage` API to store and retrieve the last visited calendar view.
    - Stores the last view in local storage under the key `last-calendar-view` (defined as `LAST_VIEW_KEY` constant).
- **Get Last View (`getLastCalendarView`):**
    - Retrieves the last visited calendar view from local storage.
    - If no view is stored in local storage or if running on the server-side (where `window` is undefined), returns a default view of 'day'.
    - Returns a `CalendarView` type, which is defined as a union type: `'day' | 'week' | 'month'`.
- **Set Last View (`setLastCalendarView`):**
    - Stores the provided `view` (of type `CalendarView`) in local storage as the last visited calendar view.
    - Does nothing if running on the server-side (where `window` is undefined).

**Internal Logic and Data Flow:**
- **Local Storage Interaction:**
    - Uses `window.localStorage.getItem` to read from local storage in `getLastCalendarView`.
    - Uses `window.localStorage.setItem` to write to local storage in `setLastCalendarView`.
- **Type Handling:**
    - Uses `CalendarView` type to ensure type safety for calendar view values.
    - Type casts the value retrieved from local storage to `CalendarView` in `getLastCalendarView`.
- **Server-Side Check:**
    - Checks `typeof window === 'undefined'` to determine if the code is running on the server-side.
    - Prevents local storage access on the server-side, as `localStorage` is a browser-only API.

**Dependencies:**
- None (relies on browser's `window.localStorage` API)

**Interactions:**
- Used by route components (e.g., Week View Route, Day View Route, Month View Route, Search Route) to store and retrieve the last visited calendar view.
- Interacts with browser's local storage to persist user preferences across sessions.

**Edge Cases and Failure Modes:**
- Local storage unavailable: If local storage is disabled or unavailable in the browser, these utility functions will still function without errors, but the last visited view will not be persisted. In this case, `getLastCalendarView` will always return the default view 'day'.
- Server-side execution: Functions are designed to gracefully handle server-side execution by checking `typeof window === 'undefined'` and avoiding local storage access in non-browser environments.

**Business Rules and Validation:**
- Stores and retrieves the last visited calendar view in local storage.
- Defaults to 'day' view if no last view is stored or if running on the server-side.
- Uses `CalendarView` type to restrict allowed values for calendar views.

---

**Feature:** Database Server Utilities

**Description:**
The `db.server.ts` file (`app/utils/db.server.ts`) acts as a central module for exporting database-related components for server-side use. It re-exports the `db` instance, the `schema` object, and the `eq` function from the Drizzle ORM setup located in the `../../drizzle` directory. This provides a single, convenient point of import for database interactions throughout the server-side application code.

**Functionality:**
- **Module Re-export:**
    - Re-exports `db` instance: This is likely the initialized Drizzle database client instance, configured to connect to the database.
    - Re-exports `schema`: This is the Drizzle schema object, defining the database tables and their structure.
    - Re-exports `eq`: This is the `eq` (equals) function from Drizzle ORM, used for constructing database queries, specifically for equality comparisons in `where` clauses.

**Internal Logic and Data Flow:**
- **No Logic:**
    - This file itself doesn't contain any logic or implementation. It solely re-exports existing modules.
- **Convenience Export:**
    - It simplifies imports in other server-side modules by providing a single file to import database components from.

**Dependencies:**
- `db`, `schema`, `eq` from `../../drizzle` (Drizzle ORM setup)

**Interactions:**
- Other server-side modules (e.g., route action functions, server utilities) import database components from this file instead of directly importing from the `drizzle` directory.

**Edge Cases and Failure Modes:**
- Dependency availability: Relies on the correct setup and export of `db`, `schema`, and `eq` in the `../../drizzle` directory. If those modules are not properly configured or exported, this file will fail to re-export them, leading to import errors in modules that depend on `db.server.ts`.

**Business Rules and Validation:**
- This file doesn't enforce any business rules or validation. It's a utility for organizing and simplifying database-related imports.

---

**Feature:** Favorites Utilities

**Description:**
The `favorites.ts` file (`app/utils/favorites.ts`) provides client-side utility functions for managing favorite calendars in local storage. It allows adding, removing, retrieving, and checking the favorite status of calendars, as well as updating calendar color and visibility settings. It also defines the `Calendar` interface used throughout the application.

**Functionality:**
- **Calendar Data Storage:**
    - Uses `localStorage` API to store favorite calendar data as a JSON string under the key `calendars` (defined as `STORAGE_KEY` constant).
- **Calendar Interface (`Calendar`):**
    - Defines a TypeScript interface `Calendar` to represent a calendar object, including properties like `id`, `name`, `icalLink`, `icalUrl` (optional), `color` (optional), and `isVisible` (optional).
- **Get Favorites (`getFavorites`):**
    - Retrieves favorite calendars from local storage.
    - Parses the JSON string from local storage into an array of `Calendar` objects.
    - Implements validation to ensure data integrity, filtering out invalid calendar objects and setting default `isVisible` to `true` if not explicitly defined.
    - Handles potential errors during local storage access or JSON parsing, returning an empty array in case of errors and removing potentially corrupted data from local storage.
- **Add to Favorites (`addFavorite`):**
    - Adds a calendar to the favorites list in local storage.
    - Prevents adding duplicate calendars by checking if a calendar with the same ID already exists.
    - Dispatches a custom event `favoriteChanged` with `type: 'add'` to notify other parts of the application about the change.
- **Remove from Favorites (`removeFavorite`):**
    - Removes a calendar from the favorites list in local storage based on its `calendarId`.
    - Dispatches a custom event `favoriteChanged` with `type: 'remove'` to notify other parts of the application about the change.
- **Check Favorite Status (`isFavorite`):**
    - Checks if a calendar with the given `calendarId` is in the favorites list in local storage.
- **Update Calendar Color (`updateCalendarColor`):**
    - Updates the color of a calendar in the favorites list in local storage.
    - Dispatches a custom event `favoriteChanged` with `type: 'colorUpdate'` and the new color to notify other parts of the application about the change.
    - Dynamically imports `clearCalendarCache` from `~/utils/calendar.server` and calls it to clear the cache for the updated calendar, ensuring color changes are reflected immediately in calendar views.
- **Update Calendar Visibility (`updateCalendarVisibility`):**
    - Updates the visibility (`isVisible` property) of a calendar in the favorites list in local storage.
    - Dispatches a custom event `favoriteChanged` with `type: 'visibilityUpdate'` and the new visibility status to notify other parts of the application about the change.

**Internal Logic and Data Flow:**
- **Local Storage Interaction:**
    - Uses `window.localStorage.getItem` to read from local storage.
    - Uses `window.localStorage.setItem` to write to local storage.
    - Uses `window.localStorage.removeItem` to remove data from local storage (in error handling of `getFavorites`).
- **Event Dispatching:**
    - Uses `window.dispatchEvent(new CustomEvent('favoriteChanged', ...))` to dispatch custom events to notify about changes in favorite calendars (add, remove, color update, visibility update).
- **Data Validation and Error Handling:**
    - Implements validation in `getFavorites` to ensure data integrity of calendar objects retrieved from local storage.
    - Includes `try...catch` blocks in all functions to handle potential errors during local storage access or JSON parsing, logging errors to the console.
- **Dynamic Import:**
    - Uses dynamic import (`import('~/utils/calendar.server').then(...)`) in `updateCalendarColor` to import `clearCalendarCache` function only when needed and avoid circular dependencies or client-side code in server-side modules.

**Dependencies:**
- None (relies on browser's `window.localStorage` API and custom events)

**Interactions:**
- Used by various components and routes (e.g., Sidebar, CalendarLink, Search Route) to manage favorite calendars and their settings.
- Interacts with browser's local storage to persist favorite calendar data.
- Dispatches custom events (`favoriteChanged`) to notify other parts of the application about changes in favorite calendars.
- Dynamically imports and uses `clearCalendarCache` from `~/utils/calendar.server` in `updateCalendarColor`.

**Edge Cases and Failure Modes:**
- Local storage unavailable: If local storage is disabled or unavailable in the browser, these utility functions will still function without errors, but favorite calendars will not be persisted across sessions. In this case, `getFavorites` will always return an empty array, and other functions will have no persistent effect.
- Data corruption in local storage: Implements basic validation in `getFavorites` to filter out invalid calendar objects from local storage, mitigating potential issues caused by corrupted or invalid data.
- Server-side execution: Functions are designed to gracefully handle server-side execution by checking `typeof window === 'undefined'` and avoiding local storage access in non-browser environments.

**Business Rules and Validation:**
- Manages a list of favorite calendars in local storage.
- Ensures data integrity of calendar objects stored in local storage through validation in `getFavorites`.
- Prevents adding duplicate calendars to favorites.
- Provides functions to update calendar color and visibility settings.
- Uses custom events to notify other parts of the application about changes in favorite calendars, enabling reactive UI updates.

---

**Feature:** Helper Utilities

**Description:**
The `helpers.ts` file (`app/utils/helpers.ts`) provides general-purpose helper functions used throughout the application. Currently, it includes a `debounce` function, which is a common utility for limiting the rate at which a function is executed, particularly in response to rapid or repeated events.

**Functionality:**
- **Debounce Function (`debounce`):**
    - Implements a debounce function that delays the execution of a given function (`func`) until after a specified `wait` time has elapsed since the last time the debounced function was invoked.
    - Useful for scenarios where you want to limit the rate of function calls, such as handling rapid user input events (e.g., search input, scroll events, resize events) or preventing excessive API calls.
    - Returns a debounced version of the original function, which, when called, will delay the execution of the original function.
    - Adds a `cancel` method to the debounced function, allowing to cancel any pending execution of the debounced function.

**Internal Logic and Data Flow:**
- **Debounce Implementation:**
    - Uses `setTimeout` to delay the execution of the original function.
    - Uses `clearTimeout` to clear any pending timeouts if the debounced function is invoked again before the `wait` time has elapsed, effectively resetting the delay timer.
    - Stores the timeout ID in a `timeout` variable to allow clearing the timeout.
    - Returns a new function (`debounced`) that wraps the original function and implements the debouncing logic.
    - Adds a `cancel` method to the `debounced` function, which clears the timeout, preventing the original function from being executed if it's still pending.

**Dependencies:**
- None

**Interactions:**
- Used by components or routes that need to debounce function calls, such as the Month View Route for handling mouse wheel scroll events (`calendar.month.tsx`).

**Edge Cases and Failure Modes:**
- No specific edge cases or failure modes are apparent in the `debounce` function itself. It's a standard debounce implementation using `setTimeout` and `clearTimeout`.
- Typing complexity: The TypeScript type definition for `debounce` is slightly complex to accurately capture the function signature and the added `cancel` method.

**Business Rules and Validation:**
- The `debounce` function is a general-purpose utility and doesn't enforce any specific business rules. It provides a mechanism to control the rate of function execution.

---

**Feature:** Settings Utilities

**Description:**
The `settings.ts` file (`app/utils/settings.ts`) provides client-side utility functions for managing calendar settings in local storage. It defines the structure for calendar settings, default settings, and functions to get and save settings, as well as constants for date range options.

**Functionality:**
- **Settings Storage:**
    - Uses `localStorage` API to store calendar settings as a JSON string under the key `calendar_settings` (defined as `SETTINGS_KEY` constant).
- **CalendarSettings Interface:**
    - Defines a TypeScript interface `CalendarSettings` to represent calendar settings, currently including only `dateRange` property of type `DateRangeSettings` (defined in `calendar.server.ts`).
- **Default Settings (`DEFAULT_SETTINGS`):**
    - Defines a constant `DEFAULT_SETTINGS` of type `CalendarSettings` with default values for calendar settings. Currently, it sets the default date range to ±1 month (`{ months: 1 }`).
- **Get Calendar Settings (`getCalendarSettings`):**
    - Retrieves calendar settings from local storage.
    - Parses the JSON string from local storage into a `CalendarSettings` object.
    - If no settings are stored in local storage, or if there's an error during retrieval or parsing, returns `DEFAULT_SETTINGS`.
- **Save Calendar Settings (`saveCalendarSettings`):**
    - Saves the provided `settings` (of type `CalendarSettings`) to local storage as a JSON string.
    - Handles potential errors during local storage access by logging errors to the console.
- **Date Range Options (`DATE_RANGE_OPTIONS`):**
    - Defines a constant array `DATE_RANGE_OPTIONS` of objects, each representing a date range option for calendar views.
    - Each option includes a `label` (string, e.g., '±1 Month') for display in the UI and a `value` (number, e.g., 1) representing the number of months for the date range setting.

**Internal Logic and Data Flow:**
- **Local Storage Interaction:**
    - Uses `window.localStorage.getItem` to read settings from local storage in `getCalendarSettings`.
    - Uses `window.localStorage.setItem` to write settings to local storage in `saveCalendarSettings`.
- **Default Settings Handling:**
    - `DEFAULT_SETTINGS` constant provides default values for settings when no settings are stored in local storage or when errors occur during retrieval.
- **Client-Side Check:**
    - Uses `isClient` constant (boolean, `typeof window !== 'undefined'`) to check if the code is running on the client-side before accessing `localStorage`.
    - Prevents local storage access on the server-side, returning `DEFAULT_SETTINGS` in `getCalendarSettings` and doing nothing in `saveCalendarSettings` when not on the client.

**Dependencies:**
- `DateRangeSettings` type (`./calendar.server`)

**Interactions:**
- Used by `CalendarSettings` component (`~/components/CalendarSettings`) to load and save calendar settings.
- Interacts with browser's local storage to persist calendar settings across sessions.

**Edge Cases and Failure Modes:**
- Local storage unavailable: If local storage is disabled or unavailable in the browser, these utility functions will still function without errors, but calendar settings will not be persisted. In this case, `getCalendarSettings` will always return `DEFAULT_SETTINGS`, and `saveCalendarSettings` will have no persistent effect.
- Data corruption in local storage: Basic error handling is implemented in `getCalendarSettings` to catch potential errors during local storage access or JSON parsing, returning `DEFAULT_SETTINGS` in case of errors.

**Business Rules and Validation:**
- Manages calendar settings in local storage, including date range preference.
- Provides default settings for date range (±1 month).
- Uses `DATE_RANGE_OPTIONS` to define available date range options.
- Persists settings in local storage, allowing users to customize calendar behavior.

---