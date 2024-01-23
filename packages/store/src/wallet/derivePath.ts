export const HARDENED_OFFSET = 0x80000000

export function derivePath(path: string): number[] {
  if (!/^[mM]'?\/?/.test(path)) {
    throw new Error('path must start with "m" or "M"')
  }
  const p = path.replace(/^[mM]'?\/?/, '')
  if (p === '') return []

  const parts = p.split('/')

  const idxs = new Array(parts.length)
  for (let i = 0; i < parts.length; i++) {
    const m = /^(\d+)('?)$/.exec(parts[i] as string)
    const m1 = m && m[1]
    if (!m || m.length !== 3 || typeof m1 !== 'string') {
      throw new Error(`invalid child index: ${parts[i]}`)
    }

    let idx = +m1
    if (!Number.isSafeInteger(idx) || idx >= HARDENED_OFFSET) {
      throw new Error('invalid index')
    }
    // hardened key
    if (m[2] === "'") {
      idx += HARDENED_OFFSET
    }
    idxs[i] = idx
  }

  return idxs
}
