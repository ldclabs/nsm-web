import { expect, test } from 'vitest'
import { joinURL } from './joinURL'

test('joinURL', () => {
  const arr1 = [
    'http://localhost:5173',
    'http://localhost:5173/',
    'http://localhost:5173/base',
    'http://localhost:5173/base/',
    'http://localhost:5173/?x=0',
    'http://localhost:5173/?b=0',
  ]

  const arr2 = [
    '',
    '/',
    'app',
    'app/',
    '/app',
    '/app/',
    '?a=1',
    '/?a=1',
    'app?a=1',
    'app/?a=1',
    '/app?a=1',
    '/app/?a=1',
  ]

  const params = { b: 2 }

  expect(
    arr1.flatMap((baseURL) =>
      arr2.flatMap((path) => [
        joinURL(baseURL, path),
        joinURL(baseURL, path, params),
      ])
    )
  ).toEqual([
    'http://localhost:5173/',
    'http://localhost:5173/?b=2',
    'http://localhost:5173/',
    'http://localhost:5173/?b=2',
    'http://localhost:5173/app',
    'http://localhost:5173/app?b=2',
    'http://localhost:5173/app/',
    'http://localhost:5173/app/?b=2',
    'http://localhost:5173/app',
    'http://localhost:5173/app?b=2',
    'http://localhost:5173/app/',
    'http://localhost:5173/app/?b=2',
    'http://localhost:5173/?a=1',
    'http://localhost:5173/?a=1&b=2',
    'http://localhost:5173/?a=1',
    'http://localhost:5173/?a=1&b=2',
    'http://localhost:5173/app?a=1',
    'http://localhost:5173/app?a=1&b=2',
    'http://localhost:5173/app/?a=1',
    'http://localhost:5173/app/?a=1&b=2',
    'http://localhost:5173/app?a=1',
    'http://localhost:5173/app?a=1&b=2',
    'http://localhost:5173/app/?a=1',
    'http://localhost:5173/app/?a=1&b=2',
    'http://localhost:5173/',
    'http://localhost:5173/?b=2',
    'http://localhost:5173/',
    'http://localhost:5173/?b=2',
    'http://localhost:5173/app',
    'http://localhost:5173/app?b=2',
    'http://localhost:5173/app/',
    'http://localhost:5173/app/?b=2',
    'http://localhost:5173/app',
    'http://localhost:5173/app?b=2',
    'http://localhost:5173/app/',
    'http://localhost:5173/app/?b=2',
    'http://localhost:5173/?a=1',
    'http://localhost:5173/?a=1&b=2',
    'http://localhost:5173/?a=1',
    'http://localhost:5173/?a=1&b=2',
    'http://localhost:5173/app?a=1',
    'http://localhost:5173/app?a=1&b=2',
    'http://localhost:5173/app/?a=1',
    'http://localhost:5173/app/?a=1&b=2',
    'http://localhost:5173/app?a=1',
    'http://localhost:5173/app?a=1&b=2',
    'http://localhost:5173/app/?a=1',
    'http://localhost:5173/app/?a=1&b=2',
    'http://localhost:5173/base',
    'http://localhost:5173/base?b=2',
    'http://localhost:5173/base/',
    'http://localhost:5173/base/?b=2',
    'http://localhost:5173/base/app',
    'http://localhost:5173/base/app?b=2',
    'http://localhost:5173/base/app/',
    'http://localhost:5173/base/app/?b=2',
    'http://localhost:5173/base/app',
    'http://localhost:5173/base/app?b=2',
    'http://localhost:5173/base/app/',
    'http://localhost:5173/base/app/?b=2',
    'http://localhost:5173/base?a=1',
    'http://localhost:5173/base?a=1&b=2',
    'http://localhost:5173/base/?a=1',
    'http://localhost:5173/base/?a=1&b=2',
    'http://localhost:5173/base/app?a=1',
    'http://localhost:5173/base/app?a=1&b=2',
    'http://localhost:5173/base/app/?a=1',
    'http://localhost:5173/base/app/?a=1&b=2',
    'http://localhost:5173/base/app?a=1',
    'http://localhost:5173/base/app?a=1&b=2',
    'http://localhost:5173/base/app/?a=1',
    'http://localhost:5173/base/app/?a=1&b=2',
    'http://localhost:5173/base/',
    'http://localhost:5173/base/?b=2',
    'http://localhost:5173/base/',
    'http://localhost:5173/base/?b=2',
    'http://localhost:5173/base/app',
    'http://localhost:5173/base/app?b=2',
    'http://localhost:5173/base/app/',
    'http://localhost:5173/base/app/?b=2',
    'http://localhost:5173/base/app',
    'http://localhost:5173/base/app?b=2',
    'http://localhost:5173/base/app/',
    'http://localhost:5173/base/app/?b=2',
    'http://localhost:5173/base/?a=1',
    'http://localhost:5173/base/?a=1&b=2',
    'http://localhost:5173/base/?a=1',
    'http://localhost:5173/base/?a=1&b=2',
    'http://localhost:5173/base/app?a=1',
    'http://localhost:5173/base/app?a=1&b=2',
    'http://localhost:5173/base/app/?a=1',
    'http://localhost:5173/base/app/?a=1&b=2',
    'http://localhost:5173/base/app?a=1',
    'http://localhost:5173/base/app?a=1&b=2',
    'http://localhost:5173/base/app/?a=1',
    'http://localhost:5173/base/app/?a=1&b=2',
    'http://localhost:5173/?x=0',
    'http://localhost:5173/?x=0&b=2',
    'http://localhost:5173/?x=0',
    'http://localhost:5173/?x=0&b=2',
    'http://localhost:5173/app?x=0',
    'http://localhost:5173/app?x=0&b=2',
    'http://localhost:5173/app/?x=0',
    'http://localhost:5173/app/?x=0&b=2',
    'http://localhost:5173/app?x=0',
    'http://localhost:5173/app?x=0&b=2',
    'http://localhost:5173/app/?x=0',
    'http://localhost:5173/app/?x=0&b=2',
    'http://localhost:5173/?x=0&a=1',
    'http://localhost:5173/?x=0&a=1&b=2',
    'http://localhost:5173/?x=0&a=1',
    'http://localhost:5173/?x=0&a=1&b=2',
    'http://localhost:5173/app?x=0&a=1',
    'http://localhost:5173/app?x=0&a=1&b=2',
    'http://localhost:5173/app/?x=0&a=1',
    'http://localhost:5173/app/?x=0&a=1&b=2',
    'http://localhost:5173/app?x=0&a=1',
    'http://localhost:5173/app?x=0&a=1&b=2',
    'http://localhost:5173/app/?x=0&a=1',
    'http://localhost:5173/app/?x=0&a=1&b=2',
    'http://localhost:5173/?b=0',
    'http://localhost:5173/?b=2',
    'http://localhost:5173/?b=0',
    'http://localhost:5173/?b=2',
    'http://localhost:5173/app?b=0',
    'http://localhost:5173/app?b=2',
    'http://localhost:5173/app/?b=0',
    'http://localhost:5173/app/?b=2',
    'http://localhost:5173/app?b=0',
    'http://localhost:5173/app?b=2',
    'http://localhost:5173/app/?b=0',
    'http://localhost:5173/app/?b=2',
    'http://localhost:5173/?b=0&a=1',
    'http://localhost:5173/?b=2&a=1',
    'http://localhost:5173/?b=0&a=1',
    'http://localhost:5173/?b=2&a=1',
    'http://localhost:5173/app?b=0&a=1',
    'http://localhost:5173/app?b=2&a=1',
    'http://localhost:5173/app/?b=0&a=1',
    'http://localhost:5173/app/?b=2&a=1',
    'http://localhost:5173/app?b=0&a=1',
    'http://localhost:5173/app?b=2&a=1',
    'http://localhost:5173/app/?b=0&a=1',
    'http://localhost:5173/app/?b=2&a=1',
  ])
})
