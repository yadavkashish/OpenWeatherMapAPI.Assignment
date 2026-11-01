const assert = require('assert');
const path = require('path');
const fs = require('fs');

const {
  fetchWeather,
  getWeatherDescription,
  createApologyMessage,
  processOrder
} = require('./index.js');

async function runTests() {
  console.log('Testing weather order tracker logic...\n');

  // Test 1: Verify sample orders read correctly
  const ordersFile = path.join(__dirname, 'orders.json');
  const orders = JSON.parse(fs.readFileSync(ordersFile, 'utf-8'));
  assert.strictEqual(orders.length, 4, 'Must load 4 orders');
  assert.strictEqual(orders[0].city, 'New York');
  assert.strictEqual(orders[1].city, 'Mumbai');
  assert.strictEqual(orders[2].city, 'London');
  assert.strictEqual(orders[3].city, 'InvalidCity123');
  console.log('✓ Test 1: orders.json loaded successfully with 4 sample orders.');

  // Test 2: Apology messages format
  const rainMsg = createApologyMessage('Alice Smith', 'New York', getWeatherDescription('Rain'));
  assert.strictEqual(
    rainMsg,
    'Hi Alice Smith, your order to New York is delayed due to heavy rain. We appreciate your patience!'
  );

  const snowMsg = createApologyMessage('Charlie Green', 'London', getWeatherDescription('Snow'));
  assert.strictEqual(
    snowMsg,
    'Hi Charlie Green, your order to London is delayed due to snowfall. We appreciate your patience!'
  );
  console.log('✓ Test 2: Apology message formatted correctly.');

  // Test 3: Concurrency and error handling with mock API responses
  const mockResponses = {
    'New York': {
      status: 200,
      body: { weather: [{ main: 'Rain', description: 'heavy intensity rain' }] }
    },
    'Mumbai': {
      status: 200,
      body: { weather: [{ main: 'Clear', description: 'clear sky' }] }
    },
    'London': {
      status: 200,
      body: { weather: [{ main: 'Snow', description: 'light snow' }] }
    },
    'InvalidCity123': {
      status: 404,
      body: { message: 'city not found' }
    }
  };

  const originalFetch = global.fetch;
  let activeCalls = 0;
  let maxActiveCalls = 0;

  global.fetch = async (url) => {
    activeCalls++;
    if (activeCalls > maxActiveCalls) maxActiveCalls = activeCalls;

    const urlObj = new URL(url);
    const city = decodeURIComponent(urlObj.searchParams.get('q'));
    const mock = mockResponses[city];

    await new Promise((resolve) => setTimeout(resolve, 20));
    activeCalls--;

    return {
      ok: mock.status === 200,
      status: mock.status,
      json: async () => mock.body
    };
  };

  const results = await Promise.all(orders.map((o) => processOrder(o, 'test_key')));
  global.fetch = originalFetch;

  assert(maxActiveCalls >= 2, `Must run in parallel (observed max concurrent: ${maxActiveCalls})`);
  console.log(`✓ Test 3: Parallel fetching confirmed (max concurrent: ${maxActiveCalls}).`);

  // Test 4: Status updates
  const [ny, mumbai, london, invalid] = results;

  // New York (Rain) -> Delayed
  assert.strictEqual(ny.order.status, 'Delayed');
  assert(ny.apology.includes('heavy rain'));
  console.log('✓ Test 4a: Rain marked as Delayed.');

  // Mumbai (Clear) -> Pending
  assert.strictEqual(mumbai.order.status, 'Pending');
  assert.strictEqual(mumbai.apology, null);
  console.log('✓ Test 4b: Clear sky kept as Pending.');

  // London (Snow) -> Delayed
  assert.strictEqual(london.order.status, 'Delayed');
  assert(london.apology.includes('snowfall'));
  console.log('✓ Test 4c: Snow marked as Delayed.');

  // InvalidCity123 -> Handled without crash
  assert.strictEqual(invalid.order.status, 'Pending');
  assert.strictEqual(invalid.failed, true);
  console.log('✓ Test 4d: Invalid city 404 handled safely without crash.');

  console.log('\nAll tests passed successfully!');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
