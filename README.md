
# XCITeS Student Organization Profiling System (SOPS)

A modern, secure, and scalable web platform for managing members, projects, and internal communications for the Xavier Circle of Information Technology Students.

## Features

- **Firebase Authentication:** Secure user sign-up, login, and session management.
- **Role-Based Access Control (RBAC):** Securely segregated permissions using Firebase Custom Claims.
- **Executive & Admin Dashboards:** Powerful interfaces for managing users, projects, and announcements.
- **Excel-Based Member Import:** Streamlined workflow for administrators to manage the member directory.
- **Real-Time Firestore Updates:** Data across the application updates in real-time without page reloads.
- **System Activity Logging:** Detailed audit trails for all critical administrative actions.
- **Dark Mode Support:** A professional, fully-featured dark theme for user comfort.
- **Secure Firebase Rules:** Granular, server-side security to protect all user and system data.

## Tech Stack

| Category           | Technology                                          |
| ------------------ | --------------------------------------------------- |
| **Frontend** | React.js, TailwindCSS                               |
| **Backend**  | Firebase Authentication, Firestore, Cloud Functions |
| **Infra**    | Docker, Firebase Hosting                            |

## RBAC Structure

- **Admin:** Full system control, including user management, role assignments, and system logs.
- **Executive:** Manages projects, departments, and organization-wide announcements.
- **Member:** Access to the main dashboard, personal profile, and member directory.

## Installation

```bash
# Install dependencies for all services (frontend & functions)
npm run install:all

# Start the frontend development server
npm start
```

## Environment Variables

Create a `.env` file in the `frontend/` directory. Reference `frontend/.env.example` for the required Firebase configuration keys.

## Firebase Setup

This project is configured for a production-ready workflow using live Firebase services.

1. Ensure the Firebase CLI is installed (`npm install -g firebase-tools`).
2. Log in to your Firebase account (`firebase login`).
3. Associate the project with your Firebase Project ID (`firebase use <your-project-id>`).

> **Important:** Do **NOT** use Firebase Emulator mode in production. This system is designed to connect directly to live Firebase services.

## Docker

To run the frontend application in a Docker container:

```bash
docker-compose up --build
```

## Security Highlights

- **Firebase Custom Claims:** Roles are managed server-side, preventing client-side privilege escalation.
- **Firestore Rules:** Granular rules prevent unauthorized data access and modification.
- **Protected Routes:** Client-side routes are protected based on authentication status and role.
- **Content Security Policy (CSP):** Hardened HTTP headers to prevent common web vulnerabilities.

## Excel Import Workflow

Department and member data is managed primarily through Excel imports to ensure a single source of truth. Administrators and Executives can upload spreadsheets, and the system will intelligently parse, deduplicate, and update the member directory in Firestore.

## Deployment

```bash
# Build the React application for production
npm run build

# Deploy all services (Hosting, Functions, Rules) to Firebase
firebase deploy
```

## Contributors

This project is managed and developed by Group E for the ITCC15 course.

## License

This project is for educational purposes. All rights reserved.
