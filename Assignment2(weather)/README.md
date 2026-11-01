# Weather-Based Order Delay Detection System

A simple, robust Node.js application that reads e-commerce orders from a local JSON file, fetches real-time weather conditions for each order's destination city in parallel via the OpenWeatherMap API, identifies weather-related shipping delays, generates personalized apology messages for affected customers, and saves updated order statuses back to the file.

---

## Table of Contents

- [Overview](#overview)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [1. Obtain an OpenWeatherMap API Key](#1-obtain-an-openweathermap-api-key)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Run the Application](#4-run-the-application)
- [Expected Output](#expected-output)
- [How It Works](#how-it-works)
  - [Parallel Fetching](#parallel-fetching)
  - [Resilience & Error Handling](#resilience--error-handling)
  - [Weather-Based Delay Logic](#weather-based-delay-logic)
  - [Personalized Apology Messages](#personalized-apology-messages)

---

## Overview

In logistics and e-commerce, severe weather can impact transport routes and lead to delivery delays. This system automates the delay detection workflow:

1. Reads customer orders from `orders.json`.
2. Queries the OpenWeatherMap API for live weather data across all destination cities simultaneously.
3. Detects delay-inducing weather conditions (`Rain`, `Snow`, `Extreme`).
4. Updates affected orders with the status `"Delayed"`.
5. Composes customer-friendly apology notifications for delayed shipments.
6. Handles failed requests (such as invalid cities or network errors) gracefully without halting the application.
7. Saves the updated order records to `orders.json`.

---

## Technologies Used

- **Node.js** (v18+ recommended for native `fetch` support)
- **JavaScript (ES6+)** (async/await, Promises, Arrow Functions)
- **OpenWeatherMap API** (Current Weather Data API - Free Tier)
- **dotenv** (lightweight environment variable loader)

---

## Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher installed on your system)
- An active Internet connection
- An OpenWeatherMap API key (free tier)

Verify your Node.js installation by running:

```bash
node -v
npm -v
```

---

## Project Structure

```
weather-order-tracker/
├── orders.json        # Order dataset (input and output)
├── index.js           # Main application logic
├── package.json       # Project metadata and dependencies
├── .env               # Local environment variables (contains your API key)
├── .env.example       # Template for environment configuration
├── .gitignore         # Prevents committing .env and node_modules/
├── README.md          # Project documentation and guide
├── AI_LOG.md          # Prompts and AI development log
├── test.js            # Automated unit and concurrency test suite
└── test.md            # Detailed test cases and verification report
```

---

## Getting Started

### 1. Obtain an OpenWeatherMap API Key

1. Visit [OpenWeatherMap](https://openweathermap.org/) and sign up for a free account.
2. Navigate to your account dashboard and select the **API keys** tab.
3. Copy your default API key (or generate a new one).
4. *Note: New OpenWeatherMap keys may take a few minutes to activate.*

### 2. Install Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

### 3. Configure Environment Variables

Create your local `.env` file from the provided example template:

```bash
cp .env.example .env
```

Open `.env` in any text editor and replace the placeholder with your actual OpenWeatherMap API key:

```env
OPENWEATHER_API_KEY=your_actual_api_key_here
```

> **Security Note:** The `.env` file is listed in `.gitignore` to ensure secret keys are never committed to version control.

### 4. Run the Application

Start the tracker using:

```bash
node index.js
```

Or using the npm start script:

```bash
npm start
```

### 5. Run Automated Verification Tests

To run the automated test suite covering parallel fetching, error handling, condition matching, and JSON serialization:

```bash
npm test
```

---

## Expected Output

When executed with a valid API key, the console will display the progress, individual error logs (for invalid cities), personalized apology messages, and a summary:

```text
Loading orders from orders.json...
Loaded 4 orders.

Fetching weather for all orders concurrently (parallel)...
[Error] Order #1004 (InvalidCity123): city not found

--- Generated Apology Messages ---
Hi Alice, your order to New York is delayed due to heavy rain. We appreciate your patience!

Saving updated orders to orders.json...
Successfully updated orders.json.

--- Processing Summary ---
Total Orders Processed : 4
Delayed Orders         : 1
Failed Weather Checks  : 1
```

*(Note: Apology messages will vary dynamically depending on real-time weather conditions in New York, Mumbai, and London at the time of execution).*

---

## How It Works

### Parallel Fetching

Instead of sequentially fetching weather city-by-city in a blocking loop, the application utilizes `Promise.all()` with `Array.prototype.map()`:

```javascript
const results = await Promise.all(
  orders.map(order => processOrder(order, apiKey))
);
```

All HTTP requests are fired simultaneously, dramatically reducing total execution time.

### Resilience & Error Handling

- **Per-Order Try/Catch:** Each order's weather fetch is wrapped in its own `try...catch` block inside `processOrder()`.
- **Fault Tolerance:** If a city is not found (e.g., `InvalidCity123`), the error is logged to `console.error`, and the original order is preserved with its `Pending` status.
- **Batch Safety:** Because each promise handles its own errors, `Promise.all()` completes successfully without rejecting the whole batch.
- **Environment Validation:** If `OPENWEATHER_API_KEY` is missing or left as the placeholder, the program exits early with an informative guide.

### Weather-Based Delay Logic

The application checks the `weather[0].main` field from the OpenWeatherMap response. If the condition is:

- `Rain`
- `Snow`
- `Extreme`

The order's `status` is changed to `"Delayed"`. Orders with other weather conditions (such as `Clear` or `Clouds`) retain their current status.

### Personalized Apology Messages

For any order marked as `Delayed`, the `generateApologyMessage()` function formats a courteous notification using:
- Customer Name
- Destination City
- Natural description of the delay-inducing weather condition

Example:
> *"Hi Alice, your order to New York is delayed due to heavy rain. We appreciate your patience!"*

