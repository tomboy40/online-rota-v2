# Project Structure and Tech Stack

## 1. Tech Stack

- **Framework:** [Remix](https://remix.run) - A full-stack web framework for building fast, resilient, and user-centric web applications.
- **Language:** [TypeScript](https://www.typescriptlang.org) - A statically typed superset of JavaScript that enhances code maintainability and developer productivity.
- **Styling:** [Tailwind CSS](https://tailwindcss.com) - A utility-first CSS framework for rapid UI development. [PostCSS](https://postcss.org) is used for processing Tailwind CSS.
- **ORM (Object-Relational Mapper):** [Drizzle ORM](https://orm.drizzle.team) - A lightweight TypeScript ORM for interacting with databases. [Prisma](https://www.prisma.io) is also present, potentially as an alternative or for specific functionalities.
- **Database:**  The presence of `drizzle/dev.db` suggests SQLite might be used for development, but the project is likely adaptable to other databases supported by Drizzle ORM in production.
- **Runtime:** [Node.js](https://nodejs.org) - JavaScript runtime environment.
- **Package Manager:** [npm](https://www.npmjs.com) or [yarn](https://yarnpkg.com) (implied by `package.json`).

## 2. Project Architecture Overview

The project follows Remix's architectural principles, emphasizing server-side rendering, progressive enhancement, and a focus on web standards. The application is structured as a monorepo, with all code and configurations within a single repository.

Key architectural characteristics:

- **Server-Side Rendering (SSR):** Remix prioritizes SSR for faster initial page loads and improved SEO. Loaders and actions in route modules handle server-side data fetching and mutations.
- **Progressive Enhancement:** The application is designed to be functional even with JavaScript disabled, progressively enhancing the user experience as JavaScript becomes available.
- **Route-Based Structure:**  The `app/routes/` directory is central to the application structure, with each file representing a specific route or route segment.
- **Component-Based UI:** React components in `app/components/` are used to build the user interface, promoting reusability and maintainability.
- **Data Handling:** Drizzle ORM (and potentially Prisma) is used to interact with the database, providing a type-safe way to manage data.

## 3. Directory Structure and Key Files

- **`/app`**:  The core application directory containing Remix-specific code.
    - **`/app/root.tsx`**:
        - **Role:** The root module and entry point for the Remix application. Defines the root layout that wraps all routes.
        - **Key Components:**
            - `<html>`, `<head>`, `<body>`:  Basic HTML structure.
            - `<Meta>`, `<Links>`, `<Scripts>`, `<LiveReload>`, `<ScrollRestoration>`: Remix components for meta tags, stylesheets, scripts, live reloading, and scroll restoration.
            - `<Outlet>`:  Renders the content of child routes.
            - `<Header>`, `<Sidebar>`, `<ViewSelector>`, `<CreateCalendarDialog>`:  Layout and UI components.
            - `LoadingProvider`: Context provider for managing loading state.
        - **Functionality:**
            - Sets up global styles and scripts.
            - Manages application-level state (e.g., current date, sidebar visibility, dialog states).
            - Defines navigation and layout structure.
    - **`/app/routes`**:
        - **Role:** Defines application routes. Each file in this directory corresponds to a URL route.
        - **Key Files:**
            - `_index.tsx`:  The index route (`/`).
            - `calendar.add.tsx`: Route for adding a calendar (`/calendar/add`).
            - `calendar.day.tsx`, `calendar.week.tsx`, `calendar.month.tsx`: Routes for different calendar views (`/calendar/day`, `/calendar/week`, `/calendar/month`).
            - `calendar.edit.$id.tsx`: Route for editing a calendar, with dynamic ID parameter (`/calendar/edit/:id`).
            - `search.tsx`: Route for search functionality (`/search`).
        - **Functionality:**
            - Route modules can export:
                - Components to render UI for the route.
                - `loader` functions for fetching data on the server.
                - `action` functions for handling form submissions and mutations on the server.
    - **`/app/components`**:
        - **Role:** Contains reusable UI components.
        - **Examples:** `CalendarLink.tsx`, `CalendarSettings.tsx`, `ColorPicker.tsx`, `ConfirmDialog.tsx`, `CreateCalendarDialog.tsx`, `CurrentTimeIndicator.tsx`, `EditCalendarDialog.tsx`, `EventDetailsDialog.tsx`, `Header.tsx`, `LoadingSpinner.tsx`, `Sidebar.tsx`, `ViewSelector.tsx`.
        - **Functionality:**  Encapsulates UI logic and presentation, promoting component reusability across the application.
    - **`/app/contexts`**:
        - **Role:**  Contains React Context providers for managing global or application-wide state.
        - **Example:** `LoadingContext.tsx` - Provides a context for managing loading states, likely used to display loading spinners or indicators.
        - **Functionality:**  Centralizes state management and avoids prop drilling for commonly used data.
    - **`/app/types`**:
        - **Role:**  TypeScript type definitions for the application.
        - **Example:** `css.d.ts` - Likely contains type declarations for CSS modules or related styling types.
        - **Functionality:**  Enhances type safety and code clarity.
    - **`/app/utils`**:
        - **Role:**  Utility functions and modules used throughout the application.
        - **Examples:** `calendar.server.ts`, `client.ts`, `db.server.ts`, `favorites.ts`, `helpers.ts`, `settings.ts`.
        - **Functionality:**  Houses reusable logic for server-side and client-side operations, database interactions, and helper functions.
    - **`/app/tailwind.css`**:
        - **Role:** Global CSS file where Tailwind CSS directives (e.g., `@tailwind base`, `@tailwind components`, `@tailwind utilities`) are included.
        - **Functionality:**  Entry point for Tailwind CSS styling.
- **`/docs`**:
    - **Role:**  Project documentation.
    - **Files:** `features.md`, `implementation.md`, `project-overview.md`, and the file to be created `project-structure.md`.
    - **Functionality:**  Contains documentation files providing information about project features, implementation details, and overall project overview.
- **`/drizzle`**:
    - **Role:**  Drizzle ORM related files.
    - **Files:** `drizzle.config.ts`, `index.ts`, `migrate.ts`, `schema.ts`, `/migrations`.
    - **Functionality:**
        - `schema.ts`: Defines the database schema using Drizzle ORM.
        - `drizzle.config.ts`: Configuration file for Drizzle.
        - `migrate.ts`: Script for running database migrations.
        - `/migrations`: Directory containing database migration files.
- **`/prisma`**:
    - **Role:** Prisma related files.
    - **File:** `schema.prisma`.
    - **Functionality:**  Defines the database schema if Prisma is used.
- **`/public`**:
    - **Role:**  Static assets served directly to the browser.
    - **File:** `favicon.ico`.
    - **Functionality:**  Contains static files like favicon, images, etc.
- **Configuration Files (Root Level)**:
    - `.cursorrules`, `.eslintrc.js`, `.gitignore`, `.prettierrc`, `drizzle.config.ts`, `package.json`, `postcss.config.js`, `remix.config.js`, `tailwind.config.js`, `tsconfig.json`.
    - **Role:** Project-level configuration files for linters, formatters, build tools, and other development utilities.

## 4. Module and Component Relationships

- **Components in `/app/components` are used by:**
    - Route modules in `/app/routes` to build page UIs.
    - Layout components like `Header.tsx`, `Sidebar.tsx`, and `root.tsx` to structure the application layout.
    - Other components in `/app/components` to create composite UI elements.
- **Contexts in `/app/contexts` are used by:**
    - Components and route modules that need access to global state (e.g., `LoadingContext` likely used by components that perform data fetching).
- **Utilities in `/app/utils` are used by:**
    - Route modules for server-side logic (loaders, actions).
    - Components for client-side logic and data manipulation.
    - Other utility modules.
- **Routes in `/app/routes` are composed within:**
    - `root.tsx` via the `<Outlet>` component, which renders the content of the currently matched route.
    - Nested layouts (if any) within route modules to create hierarchical UI structures.

**Import/Export Analysis (Conceptual):**

- **Imports:** Files in `/app/routes` and `/app/components` import components from `/app/components`, contexts from `/app/contexts`, utilities from `/app/utils`, and types from `/app/types`.
- **Exports:**
    - `/app/components`: Exports React components for UI elements.
    - `/app/contexts`: Exports React Context providers and consumers.
    - `/app/routes`: Exports route components, loaders, and actions.
    - `/app/utils`: Exports utility functions and modules.
    - `/app/types`: Exports TypeScript type definitions.

## 5. Project Structure Classification

**Monorepo**.  All related code, documentation, and configurations for the online rota application are contained within a single repository (`online-rota-v2`). This simplifies dependency management, code sharing, and coordinated development across different parts of the project.

---

*This document provides a high-level overview of the project structure and tech stack based on file analysis. Further in-depth analysis of individual files and code logic may be required for a more detailed understanding.*