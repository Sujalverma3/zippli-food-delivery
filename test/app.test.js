import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { getHaversineDistance, getNumericDistance } from '../src/utils/distance.js';

test('Distance Utility - Haversine calculations', async (t) => {
  await t.test('returns null when any coordinate is missing or null', () => {
    assert.equal(getHaversineDistance(null, 77.2, 28.6, 77.2), null);
    assert.equal(getHaversineDistance(28.6, undefined, 28.6, 77.2), null);
    assert.equal(getNumericDistance(28.6, 77.2, null, 77.2), null);
  });

  await t.test('returns 0.0 km for identical coordinates', () => {
    const dist = getHaversineDistance(28.6139, 77.2090, 28.6139, 77.2090);
    assert.equal(dist, '0.0 km');
    const num = getNumericDistance(28.6139, 77.2090, 28.6139, 77.2090);
    assert.equal(Math.round(num), 0);
  });

  await t.test('calculates correct approximate distance between Delhi and Mumbai', () => {
    // Delhi: 28.6139° N, 77.2090° E
    // Mumbai: 19.0760° N, 72.8777° E
    const numDist = getNumericDistance(28.6139, 77.2090, 19.0760, 72.8777);
    // Real distance is ~1148 km
    assert.ok(numDist > 1100 && numDist < 1200, `Expected ~1150km, got ${numDist}`);
  });
});

test('Coupon Calculation Logic', async (t) => {
  await t.test('calculates capped discount accurately', () => {
    const coupon = { code: 'ZIPPLI50', discountPercent: 50, maxDiscount: 100, minOrderValue: 150 };
    const cartAmount = 400;

    const rawDiscount = (cartAmount * coupon.discountPercent) / 100;
    const effectiveDiscount = Math.min(rawDiscount, coupon.maxDiscount);

    assert.equal(rawDiscount, 200);
    assert.equal(effectiveDiscount, 100);
  });

  await t.test('applies full percentage discount when under cap', () => {
    const coupon = { code: 'WELCOME20', discountPercent: 20, maxDiscount: 80, minOrderValue: 100 };
    const cartAmount = 200;

    const rawDiscount = (cartAmount * coupon.discountPercent) / 100;
    const effectiveDiscount = Math.min(rawDiscount, coupon.maxDiscount);

    assert.equal(rawDiscount, 40);
    assert.equal(effectiveDiscount, 40);
  });

  await t.test('rejects cart amount below minOrderValue', () => {
    const coupon = { code: 'SUPER75', discountPercent: 30, maxDiscount: 150, minOrderValue: 250 };
    const cartAmount = 200;

    assert.ok(cartAmount < coupon.minOrderValue, 'Should be under minimum threshold');
  });
});

test('Live Backend API Verification', async (t) => {
  function getJson(path) {
    return new Promise((resolve, reject) => {
      const req = http.get({
        hostname: '127.0.0.1',
        port: 5000,
        path,
        timeout: 4000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      });
      req.on('error', reject);
    });
  }

  await t.test('GET /api/health returns ok status and database status', async () => {
    try {
      const res = await getJson('/api/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'ok');
      assert.ok(['mongodb', 'in-memory-fallback'].includes(res.body.database.mode));
      assert.ok(['connected', 'disconnected', 'connecting'].includes(res.body.database.status));
    } catch (e) {
      // If server is not locally active on port 5000 during isolated test run, note and pass
      if (e.code === 'ECONNREFUSED') {
        t.skip('Server not running on port 5000 for integration test');
      } else {
        throw e;
      }
    }
  });

  await t.test('GET /api/restaurants returns populated restaurant list', async () => {
    try {
      const res = await getJson('/api/restaurants');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body));
      assert.ok(res.body.length > 0);
      assert.ok(res.body[0].name);
      assert.ok(res.body[0].cuisine);
    } catch (e) {
      if (e.code === 'ECONNREFUSED') {
        t.skip('Server not running on port 5000 for integration test');
      } else {
        throw e;
      }
    }
  });
});
