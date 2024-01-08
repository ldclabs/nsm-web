import { expect, test } from 'vitest'
import { HARDENED_OFFSET, derivePath } from './derivePath'

test('derivePath', () => {
  expect(() => derivePath('42')).toThrow()
  expect(() => derivePath("n/0'/0")).toThrow()
  expect(() => derivePath('4/m/5')).toThrow()
  expect(() => derivePath("m//3/0'")).toThrow()
  expect(() => derivePath('m/0h/0x')).toThrow()
  expect(() => derivePath('m/2147483648')).toThrow()

  expect(derivePath('m')).toEqual([])
  expect(derivePath("m/0'")).toEqual([0 + HARDENED_OFFSET])
  expect(derivePath("m/0'/1")).toEqual([0 + HARDENED_OFFSET, 1])
  expect(derivePath("m/0'/1/2'")).toEqual([
    0 + HARDENED_OFFSET,
    1,
    2 + HARDENED_OFFSET,
  ])
  expect(derivePath("m/0'/1/2'/2")).toEqual([
    0 + HARDENED_OFFSET,
    1,
    2 + HARDENED_OFFSET,
    2,
  ])
  expect(derivePath("m/0'/1/2'/2/1000000000")).toEqual([
    0 + HARDENED_OFFSET,
    1,
    2 + HARDENED_OFFSET,
    2,
    1000000000,
  ])
  expect(derivePath("m/0'/50/3'/5/545456")).toEqual([
    0 + HARDENED_OFFSET,
    50,
    3 + HARDENED_OFFSET,
    5,
    545456,
  ])
})
