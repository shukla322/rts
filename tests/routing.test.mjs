import assert from 'node:assert/strict'
import { test } from 'node:test'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'

// Bundle the actual TypeScript modules in memory using Vite's existing compiler.
const result = await build({
  stdin: {
    contents: `export * from './src/data/network'; export * from './src/data/geo';
      export * from './src/data/baseline'; export * from './src/engine/evaluateRun';
      export * from './src/data/catalog';`,
    resolveDir: fileURLToPath(new URL('../', import.meta.url)),
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  define: { 'import.meta.env.BASE_URL': '"/rts/"' },
  write: false,
})
const { getNetworkPath, MAJOR_NODES, NETWORK_LINKS, getMajorNode, haversineKm,
  pathMetrics, computeBaseline, computeActual, evaluateRun, PRODUCTS } =
  await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)

test('reported routes pass through nearby corridor hubs instead of Bhopal', () => {
  assert.deepEqual(getNetworkPath('BOM', 'BLR'), ['BOM', 'PUN', 'BLR'])
  assert.deepEqual(getNetworkPath('BBS', 'GUW'), ['BBS', 'KOL', 'GUW'])
  assert.deepEqual(getNetworkPath('BLR', 'BOM'), ['BLR', 'PUN', 'BOM'])
  assert.deepEqual(getNetworkPath('GUW', 'BBS'), ['GUW', 'KOL', 'BBS'])
})

test('all 196 hub pairs are connected, loop-free, and globally shortest', () => {
  // Independent Floyd-Warshall oracle also catches choosing fewest hops.
  const ids = MAJOR_NODES.map((node) => node.id)
  const distances = ids.map((a) => ids.map((b) => a === b ? 0 : Infinity))
  const links = new Set()
  for (const [a, b] of NETWORK_LINKS) {
    assert.notEqual(a, b)
    assert.ok(!links.has(`${a}:${b}`), 'Duplicate corridor')
    links.add(`${a}:${b}`)
    links.add(`${b}:${a}`)
    const km = haversineKm(getMajorNode(a), getMajorNode(b))
    distances[ids.indexOf(a)][ids.indexOf(b)] = km
    distances[ids.indexOf(b)][ids.indexOf(a)] = km
  }
  for (let k = 0; k < ids.length; k++)
    for (let i = 0; i < ids.length; i++)
      for (let j = 0; j < ids.length; j++)
        distances[i][j] = Math.min(distances[i][j], distances[i][k] + distances[k][j])

  for (const [i, from] of ids.entries()) {
    for (const [j, to] of ids.entries()) {
      const path = getNetworkPath(from, to)
      assert.equal(path[0], from)
      assert.equal(path.at(-1), to)
      assert.equal(new Set(path).size, path.length)
      for (let n = 1; n < path.length; n++) assert.ok(links.has(`${path[n - 1]}:${path[n]}`))
      assert.ok(Math.abs(pathMetrics(path, 25).km - distances[i][j]) < 1e-8, `${from} to ${to}`)
      assert.deepEqual(getNetworkPath(to, from), [...path].reverse())
    }
  }
})

test('same-hub trips have no legs; invalid hubs are rejected', () => {
  assert.deepEqual(getNetworkPath('BHO', 'BHO'), ['BHO'])
  assert.deepEqual(computeBaseline('BHO', 'BHO', 25), { legs: 0, km: 0, cost: 0 })
  assert.throws(() => getNetworkPath('INVALID', 'BOM'), /Unknown major node/)
})

test('baseline, resale costs, and history traces use the corrected route', () => {
  const baseline = computeBaseline('BOM', 'BLR', 25)
  assert.equal(baseline.legs, 2)
  assert.equal(baseline.cost, 50)
  assert.deepEqual(computeActual('BOM', 'BLR', 25, 3, 'PUN'), pathMetrics(['BLR', 'PUN'], 25))
  assert.deepEqual(computeActual('BOM', 'BLR', 25, undefined, undefined), baseline)
  const run = evaluateRun({
    id: 'routing-regression', createdAt: 0, source: 'live', product: PRODUCTS[0],
    sscId: 'BOM', dscId: 'BLR', costPerLeg: 25, margin: 0.5,
  }, {})
  const traceHubs = run.trace.filter((step) => step.layer === 3).map((step) => step.nodeId)
  assert.ok(traceHubs.includes('PUN'))
  assert.ok(!traceHubs.includes('BHO'))
})
