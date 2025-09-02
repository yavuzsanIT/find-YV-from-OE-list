# Excel File Processor

A full-stack TypeScript solution for business-oriented Excel file upload, processing, and download.

## Features
- Upload Excel files containing OE numbers or manufacturer cross codes
- Backend processes files and returns downloadable Excel
- Modern React + Vite + TailwindCSS frontend
- Node.js + Express backend with clean architecture
- Centralized error handling, logging, and strong typing

## Tech Stack
- Backend: Node.js, Express, TypeScript, Multer, xlsx, dotenv
- Frontend: React, Vite, TypeScript, TailwindCSS, Axios

## Usage
1. Start backend and frontend servers
2. Upload Excel file via frontend
3. Download processed Excel file

## Local Setup & Running

### 1. Clone the repository
```sh
git clone https://github.com/yavuzsanIT/find-YV-from-OE-list.git
cd find-YV-from-OE-list
```

### 2. Install dependencies for both backend and frontend
```sh
cd backend
npm install
cd ../frontend
npm install
cd ..
```

### 3. Set up environment variables
- Copy `.env.example` to `.env` in both `backend` and `frontend` folders.
- Fill in any required values.

### 4. Start the backend server
```sh
cd backend
npm run dev
```
- The backend will start on the port specified in your `.env` (default is usually 10000).

### 5. Start the frontend development server
```sh
cd ../frontend
npm run dev
```
- The frontend will start on the port specified by Vite (default is 5173).

### 6. Open the app
- Visit `http://localhost:5173` in your browser.

---
## Development
- See `.env.example` files for configuration
- All code is strongly typed and production-ready
- ESLint, Prettier, and Jest included for consistency

---
