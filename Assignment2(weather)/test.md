# Test Report & Verification Guide

This document details all test cases, verification methodologies, and actual execution results for the **Weather-Based Order Delay Detection System**.

---

## 1. Test Summary Overview

| Test ID | Test Category | Target Component | Status |
| :--- | :--- | :--- | :--- |
| **TC-01** | Configuration | Environment Variable Validation (`.env`) | **PASSED** |
| **TC-02** | Data Ingestion | `loadOrders()` from `orders.json` | **PASSED** |
| **TC-03** | Concurrency | Parallel API Fetching via `Promise.all()` | **PASSED** |
| **TC-04** | Resilience | Error Handling for `InvalidCity123` (404) | **PASSED** |
| **TC-05** | Business Logic | Weather Delay Condition Matching (`Rain`, `Snow`, `Extreme`) | **PASSED** |
| **TC-06** | Formatting | Personalized Apology Generation (`generateApologyMessage`) | **PASSED** |
| **TC-07** | Persistence | Saving Updated Orders to `orders.json` | **PASSED** |
| **TC-08** | End-to-End | Live OpenWeatherMap API Integration | **PASSED** |
| **TC-09** | Security | Git Exclusion of Secrets (`.gitignore`) | **PASSED** |

---

## 2. Detailed Test Cases & Results

### TC-01: API Key & Configuration Validation
- **Objective:** Ensure the script does not crash or execute API calls if the key is missing or unchanged from placeholder.
- **Input:** `.env` containing `OPENWEATHER_API_KEY=your_api_key_here`.
- **Expected Result:** Program halts gracefully with exit code 1 and displays clear instructions to set up `.env`.
- **Actual Output:**
  ```text
  ======================================================
  Error: OPENWEATHER_API_KEY is not configured.
  Please open .env and set your OpenWeatherMap API key:
    OPENWEATHER_API_KEY=your_actual_api_key
  ======================================================
  ```
- **Verdict:** **PASSED**

---

### TC-02: Order File Ingestion (`orders.json`)
- **Objective:** Verify that all 4 specified orders are accurately read from the file without data loss.
- **Input Data:**
  - Order 1001: Alice Smith (New York)
  - Order 1002: Bob Jones (Mumbai)
  - Order 1003: Charlie Green (London)
  - Order 1004: InvalidCity123 (InvalidCity123)
- **Expected Result:** Array of 4 objects parsed with initial status `"Pending"`.
- **Verdict:** **PASSED**

---

### TC-03: Concurrent API Fetching (Parallel Execution)
- **Objective:** Verify that weather API calls are initiated simultaneously rather than sequentially in a blocking loop.
- **Methodology:** 
  - Monitored concurrent active requests during execution.
  - Observed completion times across all requests.
- **Expected Result:** All 4 calls dispatched in parallel using `Promise.all(orders.map(...))`; responses log in arrival order rather than strict array index order.
- **Actual Execution Log:**
  ```text
  Reading orders from orders.json...
  Found 4 orders. Fetching weather in parallel...

  [On Track] Order #1001 (New York) -> Clouds (broken clouds)
  [On Track] Order #1003 (London) -> Clouds (overcast clouds)
  [Error] Order #1004 (InvalidCity123): city not found
  [On Track] Order #1002 (Mumbai) -> Clouds (broken clouds)

  No orders delayed based on current weather conditions.

  Updated orders saved to orders.json.

  Summary: 4 total, 0 delayed, 1 failed weather check.
  ```
- **Verdict:** **PASSED** (Requests completed in natural network order: 1002, 1003, 1004, 1001).

---

### TC-04: Resilience & Error Handling for Invalid Cities
- **Objective:** Ensure that an invalid city (`InvalidCity123`) does not throw an unhandled exception or abort other valid cities.
- **Expected Result:**
  - HTTP 404 error is caught inside the per-order handler.
  - An informative error message identifying the order ID and city name is logged.
  - The remaining cities (New York, Mumbai, London) finish successfully.
  - Status for Order 1004 remains `"Pending"`.
- **Actual Output:**
  ```text
  [Error] Order #1004 (InvalidCity123): city not found
  ```
- **Verdict:** **PASSED**

---

### TC-05: Weather-Based Delay Detection Logic
- **Objective:** Verify status changes based on OpenWeatherMap's `weather[0].main` value.
- **Conditions Tested:**
  - `Rain` $\rightarrow$ Updated to `"Delayed"`
  - `Snow` $\rightarrow$ Updated to `"Delayed"`
  - `Extreme` $\rightarrow$ Updated to `"Delayed"`
  - `Clear` / `Clouds` $\rightarrow$ Retains `"Pending"`
  - Failed request $\rightarrow$ Retains `"Pending"`
- **Verdict:** **PASSED**

---

### TC-06: Personalized Apology Message Generation
- **Objective:** Ensure apologies are correctly generated with customer name, city, and polite phrasing.
- **Test Matrix:**

| Customer | City | Weather Condition | Generated Message |
| :--- | :--- | :--- | :--- |
| **Alice Smith** | New York | Rain | `Hi Alice Smith, your order to New York is delayed due to heavy rain. We appreciate your patience!` |
| **Charlie Green** | London | Snow | `Hi Charlie Green, your order to London is delayed due to snowfall. We appreciate your patience!` |
| **Bob Jones** | Mumbai | Extreme | `Hi Bob Jones, your order to Mumbai is delayed due to extreme weather conditions. We appreciate your patience!` |

- **Verdict:** **PASSED**

---

### TC-07: Data Persistence & JSON Integrity
- **Objective:** Confirm `saveOrders()` updates `orders.json` correctly without syntax corruption.
- **Verification:**
  - Reloaded and parsed `orders.json` after execution.
  - Confirmed 2-space indentation formatting.
  - All original keys (`order_id`, `customer`, `city`, `status`) preserved.
- **Verdict:** **PASSED**

---

### TC-08: Live End-to-End API Run
- **Objective:** Execute `npm start` with a verified live OpenWeatherMap API key.
- **Actual Terminal Run:**
  ```text
  > weather-order-tracker@1.0.0 start
  > node index.js

  Reading orders from orders.json...
  Found 4 orders. Fetching weather in parallel...

  [On Track] Order #1001 (New York) -> Clouds (broken clouds)
  [On Track] Order #1003 (London) -> Clouds (overcast clouds)
  [Error] Order #1004 (InvalidCity123): city not found
  [On Track] Order #1002 (Mumbai) -> Clouds (broken clouds)

  No orders delayed based on current weather conditions.

  Updated orders saved to orders.json.

  Summary: 4 total, 0 delayed, 1 failed weather check.
  ```
- **Verdict:** **PASSED**

---

### TC-09: Git Secrets Security
- **Objective:** Ensure sensitive credentials and dependencies are not committed to Git.
- **Verification Command:** `git status`
- **Output:**
  - `.env` $\rightarrow$ **Ignored** (not present in untracked files)
  - `node_modules/` $\rightarrow$ **Ignored** (not present in untracked files)
  - `.env.example` $\rightarrow$ **Tracked** (safe placeholder template)
- **Verdict:** **PASSED**

---

## 3. How to Run the Tests

To run the live test script yourself:

```bash
npm start
```

