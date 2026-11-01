# AI Development Log

This document records the prompts and AI assistance utilized in developing the two core components of the Weather-Based Order Delay Detection System.

---

## 1. Parallel Weather Fetching

### Prompt
> "In Node.js, I have an array of customer order objects loaded from `orders.json`. Each order has an `order_id`, `customer`, and `city`. I need to fetch the current weather for all order cities concurrently using the OpenWeatherMap Current Weather API and `Promise.all()`. How can I structure this using modern `async/await` and native `fetch` so that requests are triggered simultaneously rather than sequentially in a loop?"

### Summary of Implementation
- Used `Array.prototype.map()` over the orders array to initiate `processOrder` asynchronous calls concurrently.
- Passed the resulting array of promises to `Promise.all()`.
- Avoided sequential `for...of` loops with `await` inside the loop body, ensuring all HTTP requests execute in parallel.

---

## 2. Error Handling & Resilience (Invalid Cities & API Failures)

### Prompt
> "When fetching weather data for multiple cities concurrently with `Promise.all()` in Node.js, one of the cities may be invalid (e.g., `InvalidCity123` returning a 404) or a network request might fail. How should I implement per-order error handling inside the mapped async function so that `Promise.all()` does not reject and fail the entire batch, but instead logs the error for the affected order and allows all other valid cities to be processed and saved?"

### Summary of Implementation
- Wrapped each individual API request inside a `try...catch` block within `processOrder()`.
- In the `catch` block, logged a clear error message including the order ID, city name, and failure reason (`error.message`).
- Returned the original order object with its status preserved (e.g., `Pending`), preventing the rejection of the outer `Promise.all()`.
- Validated the HTTP response status (`response.ok`) and parsed error messages returned by OpenWeatherMap API before throwing.

---

## 3. Weather-Aware Apology Message Generation

### Prompt
> "Write a JavaScript function that takes a customer's name, destination city, and weather condition (such as Rain, Snow, or Extreme), and generates a personalized apology message following this format: 'Hi [Name], your order to [City] is delayed due to [weather condition]. We appreciate your patience!'. Map the weather conditions into natural, polite descriptions like 'heavy rain' or 'snowfall'."

### Summary of Implementation
- Implemented `getWeatherDescription` to map API weather categories (`Rain`, `Snow`, `Extreme`) into customer-friendly phrasing.
- Implemented `generateApologyMessage` returning the formatted, personalized notification string.

