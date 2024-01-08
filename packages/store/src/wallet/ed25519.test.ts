import { bytesToHex, hexToBytes } from '@noble/hashes/utils'
import { expect, test } from 'vitest'
import { deriveEd25519 } from './ed25519'

/// Test cases from SLIP-0010 https://github.com/satoshilabs/slips/blob/master/slip-0010.md
/// Just relevant cases, Ed25519, private key

test('deriveEd25519', () => {
  const CASE_1_SEED = hexToBytes('000102030405060708090a0b0c0d0e0f')
  expect(bytesToHex(deriveEd25519(CASE_1_SEED, []))).toEqual(
    '2b4be7f19ee27bbf30c667b642d5f4aa69fd169872f8fc3059c08ebae2eb19e7'
  )

  expect(bytesToHex(deriveEd25519(CASE_1_SEED, [0]))).toEqual(
    '68e0fe46dfb67e368c75379acec591dad19df3cde26e63b93a8e704f1dade7a3'
  )

  expect(bytesToHex(deriveEd25519(CASE_1_SEED, [0, 1]))).toEqual(
    'b1d0bad404bf35da785a64ca1ac54b2617211d2777696fbffaf208f746ae84f2'
  )

  expect(bytesToHex(deriveEd25519(CASE_1_SEED, [0, 1, 2]))).toEqual(
    '92a5b23c0b8a99e37d07df3fb9966917f5d06e02ddbd909c7e184371463e9fc9'
  )

  expect(bytesToHex(deriveEd25519(CASE_1_SEED, [0, 1, 2, 2]))).toEqual(
    '30d1dc7e5fc04c31219ab25a27ae00b50f6fd66622f6e9c913253d6511d1e662'
  )

  expect(
    bytesToHex(deriveEd25519(CASE_1_SEED, [0, 1, 2, 2, 1000000000]))
  ).toEqual('8f94d394a8e8fd6b1bc2f3f49f5c47e385281d5c17e65324b0f62483e37e8793')

  expect(bytesToHex(deriveEd25519(CASE_1_SEED, [0]))).toEqual(
    bytesToHex(deriveEd25519(CASE_1_SEED, [0x80000000]))
  )

  expect(bytesToHex(deriveEd25519(CASE_1_SEED, [1]))).toEqual(
    bytesToHex(deriveEd25519(CASE_1_SEED, [0x80000001]))
  )

  const CASE_2_SEED = hexToBytes(
    'fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542'
  )

  expect(bytesToHex(deriveEd25519(CASE_2_SEED, []))).toEqual(
    '171cb88b1b3c1db25add599712e36245d75bc65a1a5c9e18d76f9f2b1eab4012'
  )

  expect(bytesToHex(deriveEd25519(CASE_2_SEED, [0]))).toEqual(
    '1559eb2bbec5790b0c65d8693e4d0875b1747f4970ae8b650486ed7470845635'
  )

  expect(bytesToHex(deriveEd25519(CASE_2_SEED, [0, 2147483647]))).toEqual(
    'ea4f5bfe8694d8bb74b7b59404632fd5968b774ed545e810de9c32a4fb4192f4'
  )

  expect(bytesToHex(deriveEd25519(CASE_2_SEED, [0, 2147483647, 1]))).toEqual(
    '3757c7577170179c7868353ada796c839135b3d30554bbb74a4b1e4a5a58505c'
  )

  expect(
    bytesToHex(deriveEd25519(CASE_2_SEED, [0, 2147483647, 1, 2147483646]))
  ).toEqual('5837736c89570de861ebc173b1086da4f505d4adb387c6a1b1342d5e4ac9ec72')

  expect(
    bytesToHex(deriveEd25519(CASE_2_SEED, [0, 2147483647, 1, 2147483646, 2]))
  ).toEqual('551d333177df541ad876a60ea71f00447931c0a9da16f227c11ea080d7391b8d')
})
