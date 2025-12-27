# GearGuard Frontend

React frontend for the GearGuard maintenance management system.

## Tech Stack

- React 18 (Vite)
- Tailwind CSS
- Axios

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The app will run on `http://localhost:3000`

## Backend

Make sure the backend is running on `http://localhost:5000`

## Features

- Kanban board with 4 columns (New, In Progress, Repaired, Scrap)
- Status transitions with workflow validation
- Duration input for Repaired status
- Visual highlights for Scrap and Overdue requests
- Real-time updates from backend API

## Project Structure

```
frontend/
├── src/
│   ├── components/      # React components
│   ├── pages/          # Page components (future)
│   ├── services/       # API service layer
│   ├── utils/          # Helper functions
│   ├── App.jsx         # Main app component
│   └── main.jsx        # Entry point
├── index.html
└── package.json
```

