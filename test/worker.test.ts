import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Miniflare } from 'miniflare';
import fs from 'fs';

let mf: Miniflare;

beforeAll(async () => {
  // Build script assumed to output to build/worker.js
  if (!fs.existsSync('build/worker.js')) {
    throw new Error('Worker build not found. Run tsc before tests.');
  }
  mf = new Miniflare({
    scriptPath: 'build/worker.js',
    modules: true,
    compatibilityFlags: ['nodejs_compat'],
  });
});

afterAll(async () => {
  await mf.dispose();
});

describe('Cloudflare Worker', () => {
  it('lists components', async () => {
    const res = await mf.dispatchFetch('http://localhost/components');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json)).toBe(true);
  });
});
