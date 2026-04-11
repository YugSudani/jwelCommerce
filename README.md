# MERN E-Commerce App

A basic MERN stack e-commerce application.

## Tech Stack
- **Frontend:** React, Tailwind CSS, Axios, React Router, Lucide React, React Hot Toast
- **Backend:** Node.js, Express
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT, bcryptjs

## Features
- User Auth (Signup/Login)
- Product Listing & Details
- Shopping Cart
- Order Placement & History
- Admin Dashboard (Manage Products & Orders)
- Pagination (Products)
- Responsive Design

## Setup Instructions

### Backend
1. Go to `server` directory: `cd server`
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example` and add your MongoDB URI and JWT Secret.
4. Start the server: `npm start` (or `npm run dev` for nodemon)

### Frontend
1. Go to `client` directory: `cd client`
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`

## Project Structure
- `/server`: Express app, models, controllers, routes, middleware.
- `/client`: React app with Vite, Tailwind CSS, context for state management.
