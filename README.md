# GinbertFi - Expense Tracking PWA

GinbertFi is a Progressive Web Application (PWA) for personal expense tracking. It allows users to manage their wallets, track income and expenses, and categorize their spending. The application is designed to be mobile-first and works offline thanks to its PWA capabilities.

## Features

-   **PWA Ready**: Installable on mobile devices and works offline.
-   **Wallet Management**: Create and manage multiple wallets (e.g., cash, bank wallet).
-   **Expense Tracking**: Add expenses with categories and subcategories.
-   **Income Tracking**: Add income to your wallets.
-   **Transfers**: Move money between your wallets.
-   **Data Persistence**: All data is stored locally in your browser using the Local Storage API.
-   **Responsive Design**: A modern and clean UI that works on all screen sizes.
-   **Modular components**: The application is built with a modular structure for easy maintenance and scalability.

## Tabs

The application is organized into three main tabs:

-   **Huchas**: Manage your wallets, add income, and perform transfers.
-   **Gastos**: Track your expenses, organized by categories and subcategories with progress bars.
-   **Resumen**: A summary of your financial activity (placeholder for future statistics).

## Technical Stack

-   **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
-   **Layout**: CSS Grid and Flexbox for responsive design.
-   **Data Storage**: Local Storage API.
-   **Offline Capabilities**: Service Worker API.

## Architecture

-   **Modular Structure**: CSS and JavaScript are organized into separate files for each component (header, navigation, modals, etc.).
-   **Event-Driven**: A global event emitter is used to manage communication between different parts of the application, promoting a decoupled architecture.
-   **PWA**: Includes a `manifest.json` and a `sw.js` (service worker) to enable PWA features like offline access and installation.

## How to Run

Since this is a client-side application, you can run it by simply opening the `index.html` file in your web browser. For the best experience and to test PWA features, it's recommended to serve the files using a local web server.

For example, using Python's built-in HTTP server:

```bash
# If you have Python 3
python3 -m http.server

# If you have Python 2
python -m SimpleHTTPServer
```

Then, open your browser and go to `http://localhost:8000`.