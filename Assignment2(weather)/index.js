const fs = require('fs');
require('dotenv').config();

const API_KEY = process.env.OPENWEATHER_API_KEY;
const ORDERS_FILE = './orders.json';

// Weather conditions that trigger delivery delays
const DELAY_CONDITIONS = ['Rain', 'Snow', 'Extreme'];

// Friendly weather description for apology message
function getWeatherDescription(main, description) {
  if (main === 'Rain') return 'heavy rain';
  if (main === 'Snow') return 'snowfall';
  if (main === 'Extreme') return 'extreme weather conditions';
  return description || main.toLowerCase();
}

// Generate personalized apology message for customer
function createApologyMessage(customer, city, conditionText) {
  return `Hi ${customer}, your order to ${city} is delayed due to ${conditionText}. We appreciate your patience!`;
}

// Fetch current weather data from OpenWeatherMap API
async function fetchWeather(city, key = API_KEY) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${key}&units=metric`;
  const res = await fetch(url);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `HTTP ${res.status}`);
  }

  return await res.json();
}

// Process a single order: check weather, handle errors per-order
async function processOrder(order, key = API_KEY) {
  try {
    const weatherData = await fetchWeather(order.city, key);
    const mainCondition = weatherData.weather?.[0]?.main || '';
    const description = weatherData.weather?.[0]?.description || '';

    // Check if current weather causes a delivery delay
    const isDelayed = DELAY_CONDITIONS.some(
      (c) => c.toLowerCase() === mainCondition.toLowerCase()
    );

    if (isDelayed) {
      const conditionText = getWeatherDescription(mainCondition, description);
      const apology = createApologyMessage(order.customer, order.city, conditionText);

      console.log(`[Delayed] Order #${order.order_id} (${order.city}) -> ${mainCondition} (${description})`);

      return {
        order: { ...order, status: 'Delayed' },
        weatherCondition: mainCondition,
        apology: apology,
        failed: false
      };
    }

    console.log(`[On Track] Order #${order.order_id} (${order.city}) -> ${mainCondition} (${description})`);
    return {
      order: { ...order },
      weatherCondition: mainCondition,
      apology: null,
      failed: false
    };
  } catch (err) {
    // Log error for invalid cities (e.g. InvalidCity123) without breaking the batch
    console.error(`[Error] Order #${order.order_id} (${order.city}): ${err.message}`);
    return {
      order: { ...order },
      weatherCondition: null,
      apology: null,
      failed: true,
      error: err.message
    };
  }
}

// Main function to run the order tracker
async function main() {
  if (!API_KEY || API_KEY === 'your_api_key_here') {
    console.error('Error: Please set your OPENWEATHER_API_KEY in the .env file.');
    process.exit(1);
  }

  console.log('Reading orders from orders.json...');
  const rawData = fs.readFileSync(ORDERS_FILE, 'utf-8');
  const orders = JSON.parse(rawData);

  console.log(`Found ${orders.length} orders. Fetching weather in parallel...\n`);

  // Fetch weather for all orders concurrently using Promise.all
  const results = await Promise.all(orders.map((order) => processOrder(order, API_KEY)));

  // Show apologies for any delayed orders
  const delayed = results.filter((r) => r.apology);
  if (delayed.length > 0) {
    console.log('\n--- Apology Messages ---');
    delayed.forEach((d) => console.log(d.apology));
  } else {
    console.log('\nNo orders delayed based on current weather conditions.');
  }

  // Save updated orders back to orders.json
  const updatedOrders = results.map((r) => r.order);
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(updatedOrders, null, 2) + '\n');
  console.log('\nUpdated orders saved to orders.json.');

  // Print run summary
  const delayedCount = updatedOrders.filter((o) => o.status === 'Delayed').length;
  const failedCount = results.filter((r) => r.failed).length;
  console.log(`\nSummary: ${orders.length} total, ${delayedCount} delayed, ${failedCount} failed weather check.`);
}

// Run script if executed directly
if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal error:', err.message);
  });
}

module.exports = {
  fetchWeather,
  getWeatherDescription,
  createApologyMessage,
  processOrder,
  DELAY_CONDITIONS
};
