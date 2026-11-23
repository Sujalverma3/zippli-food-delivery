# Zippli

Food delivery platform built with the MERN stack (MongoDB, Express, React, Node.js) and Vite. Features customer ordering, restaurant partner management, delivery rider dashboard, and platform administration.

## Features

- **Customer storefront**: Browse restaurants, search menus, filter by dietary preferences, apply promo coupons, and calculate delivery times.
- **Order tracking**: Live status flow (placed, confirmed, preparing, out for delivery, delivered) with distance calculation via Haversine formula.
- **Partner portal**: Unified portal for restaurant vendors to manage menus and delivery partners to accept assignments.
- **Admin verification**: New partner onboarding review and account approval workflow.
- **Dual-mode database**: Connects to MongoDB when available; smoothly falls back to an in-memory database if offline so the app stays usable.
- **Health monitoring**: Dedicated `/api/health` endpoint returning system uptime, process memory, and database connectivity.

## Tech stack

- **Frontend**: React 18, React Router 6, Tailwind CSS, Framer Motion, Leaflet maps, Vite
- **Backend**: Node.js, Express, Mongoose, JWT authentication, bcryptjs, esbuild
- **Database**: MongoDB (with in-memory fallback)
- **Testing**: Built-in Node.js test runner (`node:test`, `node:assert/strict`)

## Getting started

### Prerequisites

- Node.js 18+
- Npm 9+
- MongoDB running locally (default: `mongodb://localhost:27017/zippli`) or a MongoDB Atlas connection string.

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Sujalverma3/zippli-food-delivery.git
cd zippli
npm install
```

### Environment configuration

Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/zippli
NODE_ENV=development
```

### Running locally

Start both the Express API and the Vite dev server with one command:

```bash
npm run dev
```

- Customer App: [http://localhost:3000](http://localhost:3000)
- Partner & Admin Portal: [http://localhost:3000/partner.html](http://localhost:3000/partner.html)
- Backend API: [http://localhost:5000](http://localhost:5000)

## Running tests

Run the automated test suite covering distance calculations, coupon logic, and API endpoints:

```bash
npm test
```

## Production build & deployment

Build both frontend client assets and server bundle:

```bash
npm run build
npm start
```

This project includes a `render.yaml` blueprint configured for automated deployments on Render.

## Demo credentials

All default seeded accounts use the password: `password123`

| Role | Email | Portal |
| :--- | :--- | :--- |
| Customer | customer@zippli.com | http://localhost:3000/login |
| Restaurant Partner | vendor@zippli.com | http://localhost:3000/partner.html |
| Delivery Rider | delivery@zippli.com | http://localhost:3000/partner.html |
| Platform Admin | admin@zippli.com | http://localhost:3000/partner.html |
