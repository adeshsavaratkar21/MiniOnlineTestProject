# Mini Online Test App (MERN Stack)

A full-stack web application for conducting timed online multiple-choice examinations, built using MongoDB, Express.js, React (Vite), and Node.js.

---

## Table of Contents
- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Monorepo Folder Structure](#monorepo-folder-structure)
- [Local Setup & Installation](#local-setup--installation)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Deployment Guide](#deployment-guide)
  - [Deploying Backend to Render](#deploying-backend-to-render)
  - [Deploying Frontend to Vercel / Netlify](#deploying-frontend-to-vercel--netlify)

---

## Project Overview

The **Mini Online Test App** is designed for students and examinees to take timed assessments online.
- Users can register, log in securely with JWT authentication, and start a 10-question randomized test sampled from the database.
- A 10-minute countdown timer runs throughout the examination. If time expires, the test automatically submits unanswered questions as incorrect.
- The correct answers (`correctIndex`) are strictly evaluated on the server side and **never transmitted to the client** during the test, preventing network inspection cheating.
- Upon submission, users immediately see a detailed evaluation report with their score, percentage, passing status, and an itemized question-by-question review showing their choices and correct solutions.
- Users can view their historical test attempts and re-inspect test reports anytime.

---

## Key Features

- **Authentication & Security**:
  - Secure password hashing using `bcryptjs`.
  - Stateless JSON Web Token (`jsonwebtoken`) authentication stored in client localStorage and transmitted via `Authorization: Bearer <token>` headers.
  - Protected API routes and protected client routes (`/test`, `/result`, `/history`).
- **Timed Test Engine**:
  - 10-minute real-time countdown timer with visual critical alerts when time runs low.
  - Automatic test submission when the timer reaches 00:00.
  - Manual test submission with unanswered question warning.
  - Double submission protection.
- **Randomized Question Bank**:
  - MongoDB `$sample` aggregation to pick 10 random questions on every test attempt.
  - Database seed script containing 15 multi-disciplinary questions across General Knowledge, Science, Math, and Programming.
- **Detailed Evaluation & Performance History**:
  - Itemized answer review highlighting correct answers (green) and incorrect/unanswered choices (red).
  - Attempt history table with scores, percentages, timestamps, and deep links to previous attempt breakdowns.
- **Responsive & Clean UI**:
  - Built with pure, modern CSS without heavyweight external CSS frameworks.
  - Optimized for both desktop laptops and mobile screens.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router DOM v6, Axios, Plain CSS |
| **Backend** | Node.js, Express.js, Mongoose, bcryptjs, jsonwebtoken, cors, dotenv |
| **Database** | MongoDB (Local MongoDB Community Server or MongoDB Atlas Cloud) |

---

## Monorepo Folder Structure

```text
Mini-Online-Test-App/
├── .gitignore               # Root git ignore (node_modules, .env files)
├── README.md                # Comprehensive project documentation
├── server/                  # Express & Node.js backend
│   ├── .env.example         # Template for backend environment variables
│   ├── index.js             # Express app setup, CORS, DB connection, routes
│   ├── seed.js              # Database seeder script (15 sample questions)
│   ├── package.json         # Backend dependencies and scripts
│   ├── middleware/
│   │   └── auth.js          # JWT verification middleware
│   ├── models/
│   │   ├── User.js          # User schema (name, email, password)
│   │   ├── Question.js      # Question schema (question, options, correctIndex, subject)
│   │   └── Attempt.js       # Attempt schema (user, answers, score, total, details)
│   └── routes/
│       ├── auth.js          # /api/auth/signup, /api/auth/login, /api/auth/me
│       ├── questions.js     # GET /api/questions, POST /api/questions
│       └── attempts.js      # POST /api/attempts, GET /api/attempts, GET /api/attempts/:id
└── client/                  # React + Vite frontend
    ├── .env.example         # Template for frontend environment variables
    ├── index.html           # HTML5 template
    ├── package.json         # Frontend dependencies and scripts
    ├── vite.config.js       # Vite build configuration
    └── src/
        ├── main.jsx         # React application entry point
        ├── App.jsx          # Router & Route declarations
        ├── index.css        # Responsive styling & themes
        ├── context/
        │   └── AuthContext.jsx  # Authentication state & methods
        ├── services/
        │   └── api.js       # Axios client with interceptors
        ├── components/
        │   ├── Navbar.jsx   # Top navigation bar
        │   └── ProtectedRoute.jsx # Route authentication guard
        └── pages/
            ├── Login.jsx    # Login page
            ├── Signup.jsx   # Registration page
            ├── Test.jsx     # Timed test examination page
            ├── Result.jsx   # Score and question breakdown page
            └── History.jsx  # Past attempts table
```

---

## Local Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) running locally or a [MongoDB Atlas](https://www.mongodb.com/atlas) connection string

### Step 1: Clone the repository
```bash
git clone <repository-url>
cd Mini-Online-Test-App
```

### Step 2: Set up the Backend (`server/`)
1. Navigate to the `server/` directory and install dependencies:
   ```bash
   cd server
   npm install
   ```
2. Create your `.env` configuration file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *(On Windows Command Prompt, use `copy .env.example .env`)*

3. Configure your `server/.env` parameters:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/mini-online-test
   JWT_SECRET=super_secret_jwt_key_mini_online_test_2026
   CLIENT_URL=http://localhost:5173
   ```

4. Seed the database with the 15 sample questions:
   ```bash
   npm run seed
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend API will run on `http://localhost:5000`.

---

### Step 3: Set up the Frontend (`client/`)
1. Open a new terminal window, navigate to the `client/` directory and install dependencies:
   ```bash
   cd client
   npm install
   ```

2. Create your `.env` configuration file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *(On Windows Command Prompt, use `copy .env.example .env`)*

3. Configure `client/.env`:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

4. Start the frontend Vite development server:
   ```bash
   npm run dev
   ```
   The application will open on `http://localhost:5173`.

---

## Environment Variables

### Backend (`server/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Port for the Express server to listen on | `5000` |
| `MONGO_URI` | MongoDB connection string (Local or MongoDB Atlas) | `mongodb://127.0.0.1:27017/mini-online-test` |
| `JWT_SECRET` | Secret key for signing and verifying JWT tokens | `your_secret_jwt_key_min_32_characters` |
| `CLIENT_URL` | URL of the frontend for CORS authorization | `http://localhost:5173` |

### Frontend (`client/.env`)
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL of the backend API | `http://localhost:5000` |

---

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/signup`: Create a new user account.
  - Body: `{ "name": "...", "email": "...", "password": "..." }`
- `POST /api/auth/login`: Authenticate and receive a JWT.
  - Body: `{ "email": "...", "password": "..." }`
- `GET /api/auth/me`: Get current logged-in user details *(Protected)*.

### Questions (`/api/questions`)
- `GET /api/questions`: Get 10 random questions *(Protected)*.
  - **Note**: `correctIndex` is stripped from the response payload.
- `POST /api/questions`: Add a question *(Protected)*.
  - Body: `{ "question": "...", "options": ["...","...","...","..."], "correctIndex": 0, "subject": "..." }`

### Attempts & Scoring (`/api/attempts`)
- `POST /api/attempts`: Submit test answers for evaluation *(Protected)*.
  - Body: `{ "answers": [{ "questionId": "...", "selectedIndex": 0 }] }`
  - Returns calculated score, total, percentage, and detailed answer review.
- `GET /api/attempts`: Retrieve all past attempts for the logged-in user *(Protected)*.
- `GET /api/attempts/:id`: Retrieve detailed breakdown of a specific attempt *(Protected)*.

---

## Deployment Guide

### Deploying Backend to Render

1. Create a free account on [Render](https://render.com/).
2. Push your project to a GitHub repository.
3. In the Render Dashboard, click **New +** -> **Web Service**.
4. Connect your GitHub repository.
5. Configure the service settings:
   - **Name**: `mini-online-test-api`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Under **Environment Variables**, add:
   - `PORT`: `5000`
   - `MONGO_URI`: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/mini-online-test?retryWrites=true&w=majority` (use MongoDB Atlas)
   - `JWT_SECRET`: A secure random secret string
   - `CLIENT_URL`: `https://your-frontend-app.vercel.app` (or Netlify URL)
7. Click **Create Web Service**.
8. After deployment, run the database seed once:
   - Go to Render Dashboard -> your service -> **Shell** tab.
   - Run `npm run seed`.
9. Copy your Render service URL (e.g., `https://mini-online-test-api.onrender.com`).

---

### Deploying Frontend to Vercel or Netlify

#### Option A: Deploy to Vercel
1. Sign in to [Vercel](https://vercel.com/) and click **Add New...** -> **Project**.
2. Select your GitHub repository.
3. In the project configuration:
   - **Root Directory**: Click edit and select `client`.
   - **Framework Preset**: `Vite` (automatically detected).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:
   - `VITE_API_URL`: `https://mini-online-test-api.onrender.com` (your deployed Render backend URL)
5. Click **Deploy**.
6. Ensure client-side routing works by adding a `vercel.json` if needed, or Vercel handles single-page apps automatically.

#### Option B: Deploy to Netlify
1. Sign in to [Netlify](https://netlify.com/) and click **Add new site** -> **Import an existing project**.
2. Select your repository.
3. Configure site build settings:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. In **Environment variables**, set:
   - `VITE_API_URL`: `https://mini-online-test-api.onrender.com`
5. To support HTML5 pushState routing, Netlify requires a redirect rule. A `_redirects` file with `/* /index.html 200` in `client/public/` handles this cleanly.
6. Click **Deploy Site**.
