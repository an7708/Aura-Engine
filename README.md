# Aura Engine — Enterprise Inventory Management System

A production-grade inventory management platform engineered for
Apex Logistics and Retail Solutions. Built to handle 50,000 product
SKUs with sub-second query performance, real-time analytics, and
a fully responsive enterprise interface.

---

## Intern Information

| Field | Details |
|---|---|
| Project Name | Aura Engine |
| Track | Fullstack |
| Intern | Anisha Madhukar |
| Cohort | Prodesk IT Internship — 2025 |
| Client Code Name | Aura Enterprise Engine |
| Repository | `aura-engine` |

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [The Business Problem](#the-business-problem)
3. [Tech Stack](#tech-stack)
4. [Core Features](#core-features)
5. [Architecture Decisions](#architecture-decisions)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Folder Structure](#folder-structure)
9. [Environment Variables](#environment-variables)
10. [Getting Started](#getting-started)
11. [Deployment](#deployment)
12. [Performance Benchmarks](#performance-benchmarks)
13. [AI Transparency](#ai-transparency)

---

## Project Overview

Aura Engine is a fullstack web application that replaces a legacy
inventory system built on outdated SAP software and Microsoft Excel
spreadsheets. The platform provides warehouse managers and executive
leadership with a unified interface to search, filter, paginate, and
analyse inventory data across 50,000 distinct product SKUs without
any browser performance degradation.

The system is architected around three core engineering principles.
Data computation happens inside the database, not in JavaScript.
The browser only ever receives the slice of data it needs to render.
Every query path is indexed so response times remain constant
regardless of dataset size.

---

## The Business Problem

Apex Logistics manages inventory for over 40 mid-sized retail chains
across the American Midwest, processing thousands of transactions
daily.

**The Problem.** Their database contained over 50,000 distinct SKUs.
When a warehouse manager attempted to load the inventory page, the
browser would freeze, crash, or take up to 45 seconds to respond.

**The Business Impact.** Delayed inventory counts led to stockouts —
selling items that were not in stock — costing the company hundreds
of thousands of dollars in refunded orders and lost customer trust.

**The Solution.** A modern, server-side rendered inventory dashboard
that fetches 50 records at a time, supports instant search and
multi-parameter filtering, displays real-time analytics via MongoDB
aggregation pipelines, and exports filtered datasets as CSV files
for offline access.

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 18 | Component-based UI framework |
| Recharts | Data visualisation — bar and pie charts |
| Axios | HTTP client for API communication |
| Inter (Google Fonts) | Typography |
| CSS Variables | Design system and theming |

### Backend

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | REST API framework |
| MongoDB | Primary database |
| Mongoose | ODM for schema definition and querying |
| Joi | Server-side request body validation |
| express-rate-limit | API rate limiting and DDoS protection |
| Faker.js | Realistic seed data generation |
| dotenv | Environment variable management |

### Infrastructure

| Technology | Purpose |
|---|---|
| Vercel | Frontend deployment and CI/CD |
| Render | Backend API deployment |
| MongoDB Atlas | Cloud database hosting |
| GitHub | Version control and CI triggers |

---

## Core Features

### Requirement 1 — Database Architecture and Seeding

A Product schema with eight fields: productName, sku (unique),
category, price, cost, stockQuantity, reorderLevel, and lastUpdated.

MongoDB indexes on sku, category, and productName (text index)
ensure query performance remains constant as the dataset grows.
Without indexes, a text search on 50,000 records performs a full
collection scan on every request. With indexes, MongoDB uses the
inverted index to jump directly to matching documents.

A standalone seed script using Faker.js generates and inserts
50,000 realistic product records in batches of 1,000 to prevent
Node.js heap memory overflow.

### Requirement 2 — Optimised Query Engine

The GET /api/inventory endpoint accepts query parameters for
pagination, text search, category filtering, price range filtering,
stock level filtering, and column sorting.

The server returns only 50 records per request plus pagination
metadata including totalRecords, totalPages, currentPage,
hasNextPage, and hasPrevPage. The browser never processes more
than 50 records at a time regardless of dataset size.

A 500ms debounced search hook prevents API calls from firing on
every keystroke, reducing unnecessary server load and providing
a smooth user experience.

### Requirement 3 — Aggregation Pipelines

The GET /api/analytics endpoint uses three MongoDB aggregation
pipelines executed in parallel via Promise.all.

The first pipeline groups all documents by category and sums
price multiplied by stockQuantity to calculate total inventory
valuation per category for the pie chart.

The second pipeline matches documents with stock greater than
zero, sorts ascending by stockQuantity, and limits to 10 results
to produce the restock priority list for the bar chart.

The third pipeline groups all documents with _id: null and
calculates four KPI values in a single pass: total SKU count,
total inventory value, out of stock item count, and low stock
item count.

All three pipelines run inside MongoDB. No arithmetic is
performed in Node.js.

### Requirement 4 — Validation and Business Rules

Joi middleware validates all POST and PUT request bodies before
they reach the controller. Two business rules are enforced at
the server level: a product's price cannot be lower than its
cost, and stockQuantity cannot be negative. Violations return
a 400 Bad Request response with a specific error message.

### Additional Features

Server-side rate limiting protects the API from DDoS attacks and
token spam. The login and analytics endpoints have strict limits
of 10 and 20 requests per window respectively.

A CSV export function downloads the currently filtered table
data to the user's local machine without a server round-trip.
The export respects all active filters so warehouse managers
receive exactly the data on screen.

---

## Architecture Decisions

### Why Server-Side Pagination

Loading 50,000 documents into the browser DOM creates tens of
thousands of DOM nodes. Modern browsers begin degrading at
around 1,500 simultaneous DOM nodes. Server-side pagination
ensures the DOM never exceeds 50 table rows regardless of
dataset size.

### Why MongoDB Aggregation Pipelines

Fetching all 50,000 records into Node.js and calculating totals
with JavaScript array methods would transfer several megabytes
of data over the network on every analytics page load. MongoDB
aggregation pipelines execute computation inside the database
engine and return only the final calculated result — typically
under 1 kilobyte — regardless of how many documents were
processed.

### Why Promise.all for Parallel Queries

The analytics endpoint requires three separate aggregation
pipelines. Running them sequentially would add their individual
execution times together. Running them in Promise.all executes
all three simultaneously and resolves when the slowest one
completes, cutting total response time significantly.

### Why Indexes

An unindexed text search on 50,000 documents examines every
document on every request. A text index builds an inverted word
map at write time so reads are O(log n) rather than O(n). The
trade-off is slightly slower write performance — an acceptable
cost for a read-heavy inventory system.

---

## Database Schema

### Product Collection

```
Field           Type      Notes
productName     String    Required, trimmed
sku             String    Required, unique, uppercase
category        String    Enum of 8 categories
price           Number    Required, min 0
cost            Number    Required, min 0
stockQuantity   Number    Required, min 0, default 0
reorderLevel    Number    Min 0, default 10
lastUpdated     Date      Default now
createdAt       Date      Auto-generated by Mongoose
updatedAt       Date      Auto-generated by Mongoose
```

### Indexes

```
{ sku: 1 }                  Unique lookup
{ category: 1 }             Filter queries
{ productName: 'text' }     Full text search
{ stockQuantity: 1 }        Sort and filter by stock
{ price: 1 }                Sort and filter by price
```

### Categories

Electronics, Apparel, Furniture, Food and Beverage, Sports,
Automotive, Health and Beauty, Toys.

---

## API Endpoints

All endpoints are prefixed with `/api`.

### Inventory

```
GET    /api/inventory
       Query params: page, limit, search, category,
                     minPrice, maxPrice, maxStock,
                     sortBy, order
       Returns: products array + pagination metadata

POST   /api/inventory
       Body: productName, sku, category, price, cost,
             stockQuantity, reorderLevel
       Validates: Joi schema + business rules
       Returns: created product document

GET    /api/inventory/analytics
       Returns: summary KPIs, categoryDistribution,
                lowStockAlert

GET    /api/inventory/:id
       Returns: single product document

PUT    /api/inventory/:id
       Body: same as POST
       Returns: updated product document

DELETE /api/inventory/:id
       Returns: success confirmation
```

---

## Folder Structure

```
aura-engine/
│
├── server/
│   ├── controllers/
│   │   └── inventory.controller.js    CRUD + analytics logic
│   ├── models/
│   │   └── Product.model.js           Schema + indexes
│   ├── routes/
│   │   └── inventory.routes.js        Route definitions
│   ├── scripts/
│   │   └── seed.js                    50,000 record seeder
│   ├── utils/
│   │   └── AppError.js                Custom error class
│   ├── validators/
│   │   └── inventory.validator.js     Joi schemas + business rules
│   ├── .env.example                   Environment variable template
│   └── index.js                       Express app entry point
│
├── client/
│   └── src/
│       ├── api/
│       │   └── axios.js               Axios instance
│       ├── hooks/
│       │   └── useDebounce.js         500ms debounce hook
│       ├── pages/
│       │   ├── Inventory.jsx          Paginated table with filters
│       │   └── Analytics.jsx          KPI cards and charts
│       ├── utils/
│       │   └── exportCSV.js           Client-side CSV export
│       ├── App.js                     Root component with navigation
│       └── App.css                    Complete design system
│
├── Prompts.md                         AI transparency log
└── README.md
```

---

## Environment Variables

### server/.env

```
PORT=5001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aura-engine?retryWrites=true&w=majority
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- npm v9 or higher
- A MongoDB Atlas account with a free-tier cluster
- Git

### Installation

Clone the repository.

```bash
git clone https://github.com/an7708/Aura-Engine.git
cd Aura-Engine
```

Install server dependencies.

```bash
cd server
npm install
```

Install client dependencies.

```bash
cd ../client
npm install
```

Configure environment variables.

```bash
cp server/.env.example server/.env
```

Open `server/.env` and fill in your MongoDB Atlas connection
string.

### Seed the Database

Run the seed script once to populate 50,000 product records.
This takes approximately 2 to 3 minutes.

```bash
cd server
npm run seed
```

You will see progress printed every 1,000 records.

### Run Locally

Start the backend server on port 5001.

```bash
cd server
npm run dev
```

Start the React development server on port 3000.

```bash
cd client
npm start
```

Open `http://localhost:3000` in your browser.

---

## Deployment

### Backend — Render

The Express server is deployed on Render as a Web Service.

| Setting | Value |
|---|---|
| Root Directory | server |
| Build Command | npm install |
| Start Command | node index.js |
| Instance Type | Free |

Environment variables are set in the Render dashboard under
the Environment tab. The `MONGODB_URI`, `NODE_ENV`, `PORT`,
and `CLIENT_URL` variables must all be configured before the
first deploy.

### Frontend — Vercel

The React application is deployed on Vercel connected to the
GitHub repository.

| Setting | Value |
|---|---|
| Root Directory | client |
| Build Command | npm run build |
| Output Directory | build |
| Framework Preset | Create React App |

The `REACT_APP_API_URL` environment variable must be set in
the Vercel dashboard to the live Render backend URL.

### Live URLs

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | https://aura-engine.vercel.app |
| Backend API | Render | https://aura-engine.onrender.com |
| Database | MongoDB Atlas | Internal connection |

---

## Performance Benchmarks

These benchmarks were measured against the seeded dataset of
50,000 product documents on the free-tier Render instance.

| Operation | Response Time |
|---|---|
| GET /api/inventory (page 1, no filters) | under 150ms |
| GET /api/inventory (text search) | under 200ms |
| GET /api/inventory/analytics | under 500ms |
| POST /api/inventory (with validation) | under 100ms |

The analytics endpoint processes all three aggregation pipelines
in parallel and returns calculated totals across all 50,000
records in under 500ms. This is the primary performance
requirement specified in the client brief.

---

## AI Transparency

Artificial intelligence tools were used during the development
of this project as engineering references for specific technical
problems. All interactions are documented in full in the
`Prompts.md` file at the root of this repository.

Every piece of code in this repository was written by the
engineer. AI was used to understand concepts — MongoDB
aggregation pipeline syntax, debounce hook implementation
patterns, batch insertion strategies, and indexing trade-offs.
The architectural decisions, implementation choices, and
extensions beyond the AI responses were made independently.

See `Prompts.md` for the complete interaction log.

---

## License

This project was developed as part of the Prodesk IT Internship
Program 2026.

---

*Anisha Madhukar — Prodesk IT Internship 2026*
