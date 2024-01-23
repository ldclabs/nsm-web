import { AesGcmKey } from '@ldclabs/cose-ts/aesgcm'
import { Ed25519Key } from '@ldclabs/cose-ts/ed25519'
import { Encrypt0Message } from '@ldclabs/cose-ts/encrypt0'
import { hmac, sha3_256 } from '@ldclabs/cose-ts/hash'
import { type RawMap } from '@ldclabs/cose-ts/map'
import { Sign1Message } from '@ldclabs/cose-ts/sign1'
import { Sign1MessagePrefix, withTag } from '@ldclabs/cose-ts/tag'
import {
  base64ToBytes,
  bytesToBase64Url,
  bytesToHex,
  compareBytes,
  decodeCBOR,
  encodeCBOR,
  hexToBytes,
  utf8ToBytes,
} from '@ldclabs/cose-ts/utils'
import { HDKey } from '@scure/bip32'
import * as btc from '@scure/btc-signer'
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { derivePath } from './derivePath'
import { deriveEd25519 } from './ed25519'

const DEFAULT_PASS = utf8ToBytes('NS:COSE/Derive.KEK')
const NS_TRANS_KEY_AAD = utf8ToBytes('NS:COSE/Transfer.Key')
const NS_SIGN_MESSAGE_AAD = utf8ToBytes('NS:COSE/Sign.Mesage')
const NS_KEY_PATH_PREFIX = "m/42'/0'/0'/1/"
const BTC_KEY_PATH_PREFIX = "m/44'/0'/0'/1/"
// const BTC_SIGNED_MSG_PREFIX = 'Bitcoin Signed Message:\n'

export interface KEKRequest extends KEKSig {
  renew?: boolean
}

export interface KEKResponse {
  key: RawMap // ed25519 private key in COSE Key format
  state: Uint8Array
  iss_at: number // unix timestamp ms
  next_key?: RawMap // ed25519 private key in COSE Key format
  next_state?: Uint8Array
  synced_at?: 0
}

export interface SeedInfo {
  pk: string // ed25519 public of seed key in HEX
  created_at: number // unix timestamp ms
  updated_at: number // unix timestamp ms
  alias: string
  ns_paths: KeyPath[] // ed25519 keys
  btc_paths: KeyPath[] // secp256k1 keys
}

export interface KeyPK {
  pk: string // seed public key in HEX
  path: string // derivation path
}

interface KEKSig {
  state: Uint8Array
  sig: Uint8Array
}

interface KEKState extends KEKSig {
  pk: string // ed25519 public of KEK in HEX
  created_at: number // unix timestamp ms
  synced_at: number // unix timestamp ms, 0 means never
  with_password: boolean // with a custom password
}

interface SeedEntry {
  pk: string // ed25519 public of seed key in HEX
  kek_pk: string // ed25519 public of KEK in HEX
  created_at: number // unix timestamp ms
  updated_at: number // unix timestamp ms
  synced_at: number // unix timestamp ms, 0 means never
  alias: string
  seed: Uint8Array // sealed by Encrypt0Message
  ns_paths: KeyPath[] // ed25519 keys
  btc_paths: KeyPath[] // secp256k1 keys
}

// reserved
interface COSEKeyEntry {
  pk: string // ed25519 public of cose key in HEX
  kek_pk: string // ed25519 public of KEK in HEX
  created_at: number // unix timestamp ms
  updated_at: number // unix timestamp ms
  synced_at: number // unix timestamp ms, 0 means never
  alias: string
  disc: string
  cose: Uint8Array // sealed by Encrypt0Message
}

interface KeyPath {
  alias: string
  path: string
  address: string
  created_at: number // unix timestamp ms
  deprecated: boolean
}

interface KeysEntry {
  readonly sealed: SeedEntry
  seed_raw: Uint8Array
  seed_key: Ed25519Key
}

interface KeysDB extends DBSchema {
  KEKState: {
    key: string
    value: KEKState
    indexes: { 'by_created_at': number }
  }
  SeedEntry: {
    key: string
    value: SeedEntry
    indexes: { 'by_alias': string }
  }
  SeedEntryBK: {
    key: string
    value: SeedEntry
  }
  COSEKeyEntry: {
    // reserved
    key: string
    value: COSEKeyEntry
    indexes: { 'by_alias': string }
  }
  COSEKeyEntryBK: {
    // reserved
    key: string
    value: COSEKeyEntry
  }
}

export class KeyStore {
  private static readonly DBPrefix = 'ns:keys:'
  private static readonly VERSION = 1
  private static readonly KEKStateKey = 'latest'
  private _db: IDBPDatabase<KeysDB> | null = null
  private _kek: AesGcmKey | null = null
  private kek_pk = ''
  private _name = ''

  readonly utils = {
    base64ToBytes,
    bytesToBase64Url,
    bytesToHex,
    compareBytes,
    decodeCBOR,
    encodeCBOR,
    hexToBytes,
    utf8ToBytes,
  }

  constructor() {}

  async connect(uid: string) {
    if (!uid) {
      throw new Error('missing user id')
    }

    this._name = KeyStore.DBPrefix + uid
    this._kek = null
    this._db = null
    this._db = await openDB<KeysDB>(this._name, KeyStore.VERSION, {
      upgrade(db) {
        const stateStore = db.createObjectStore('KEKState')
        stateStore.createIndex('by_created_at', 'created_at')

        const keyStore = db.createObjectStore('SeedEntry', { keyPath: 'pk' })
        keyStore.createIndex('by_alias', 'alias')
        db.createObjectStore('SeedEntryBK', { keyPath: 'pk' })

        const coseStore = db.createObjectStore('COSEKeyEntry', {
          keyPath: 'pk',
        })
        coseStore.createIndex('by_alias', 'alias')
        db.createObjectStore('COSEKeyEntryBK', { keyPath: 'pk' })
      },
    })
    return this
  }

  get ready() {
    return this._kek != null
  }

  get name() {
    return this._name
  }

  private get db(): IDBPDatabase<KeysDB> {
    if (!this._db) {
      throw new Error('KeyStore not connected')
    }
    return this._db
  }

  private get kek(): AesGcmKey {
    if (!this._kek) {
      throw new Error('KeyStore not opened')
    }
    return this._kek
  }

  async generateSeed(alias: string): Promise<SeedInfo> {
    if (!alias.trim()) {
      throw new Error('missing alias')
    }

    const key = Ed25519Key.generate()
    const pk = key.getPublicKey()
    key.setKid(pk)
    const entry: SeedEntry = {
      pk: bytesToHex(pk),
      kek_pk: this.kek_pk,
      created_at: Date.now(),
      updated_at: Date.now(),
      synced_at: 0,
      alias,
      seed: await new Encrypt0Message(key.toBytes()).toBytes(this.kek),
      ns_paths: [],
      btc_paths: [],
    }
    await this.sealSeed(entry)
    return toSeedInfo(entry)
  }

  async deriveEd25519(pk: string, alias: string): Promise<SeedInfo> {
    if (!alias.trim()) {
      throw new Error('missing alias')
    }

    const seed = await this.openSeed(pk)
    const path = `${NS_KEY_PATH_PREFIX}${seed.sealed.ns_paths.length}`
    const secret = deriveEd25519(seed.seed_key.getSecretKey(), derivePath(path))
    const key = Ed25519Key.fromSecret(secret)
    seed.sealed.ns_paths.push({
      alias,
      path,
      address: '0x' + bytesToHex(key.getPublicKey()),
      created_at: Date.now(),
      deprecated: false,
    })
    await this.sealSeed(seed.sealed)
    return toSeedInfo(seed.sealed)
  }

  async deprecateEd25519(pk: string, path: string): Promise<SeedInfo> {
    throw new Error('Method not implemented.')
  }

  async deriveSecp256k1(pk: string, alias: string): Promise<SeedInfo> {
    if (!alias.trim()) {
      throw new Error('missing alias')
    }

    const seed = await this.openSeed(pk)
    const master = HDKey.fromMasterSeed(seed.seed_key.getSecretKey())
    const path = `${BTC_KEY_PATH_PREFIX}${seed.sealed.btc_paths.length}`
    const key = master.derive(path)
    seed.sealed.btc_paths.push({
      alias,
      path,
      address: btc.p2wpkh(key.publicKey as Uint8Array).address as string,
      created_at: Date.now(),
      deprecated: false,
    })
    await this.sealSeed(seed.sealed)
    return toSeedInfo(seed.sealed)
  }

  async deprecateSecp256k1(pk: string, path: string): Promise<SeedInfo> {
    throw new Error('Method not implemented.')
  }

  async importSeed(
    alias: string,
    encryptedKey: string,
    password: string
  ): Promise<SeedInfo> {
    if (!alias.trim()) {
      throw new Error('missing alias')
    }

    const aes_key = AesGcmKey.fromSecret(sha3_256(utf8ToBytes(password)))
    const msg = await Encrypt0Message.fromBytes(
      aes_key,
      base64ToBytes(encryptedKey),
      NS_TRANS_KEY_AAD
    )
    const key = new Ed25519Key(decodeCBOR(msg.payload))
    const pk = bytesToHex(key.getPublicKey())
    let entry = await this.loadSeed(pk)
    if (entry != null) {
      throw new Error(`seed ${pk} already exists`)
    }

    entry = {
      pk,
      kek_pk: this.kek_pk,
      created_at: Date.now(),
      updated_at: Date.now(),
      synced_at: 0,
      alias,
      seed: await new Encrypt0Message(key.toBytes()).toBytes(this.kek),
      ns_paths: [],
      btc_paths: [],
    }
    await this.sealSeed(entry)
    return {
      pk: entry.pk,
      created_at: entry.created_at,
      updated_at: entry.updated_at,
      alias: entry.alias,
      ns_paths: entry.ns_paths,
      btc_paths: entry.btc_paths,
    }
  }

  async exportSeed(pk: string, password: string): Promise<string> {
    const seed = await this.openSeed(pk)
    const aes_key = AesGcmKey.fromSecret(sha3_256(utf8ToBytes(password)))
    const data = await new Encrypt0Message(seed.seed_raw).toBytes(
      aes_key,
      NS_TRANS_KEY_AAD
    )
    return bytesToBase64Url(Encrypt0Message.withTag(data))
  }

  async importCOSE(alias: string): Promise<SeedInfo> {
    throw new Error('Method not implemented.')
  }

  async exportCOSE(pk: string): Promise<string> {
    throw new Error('Method not implemented.')
  }

  async listSeed(): Promise<SeedInfo[]> {
    const seeds = await this.loadSeedEntries()
    return seeds.map(toSeedInfo)
  }

  async ed25519SignData(kps: KeyPK[], data: Uint8Array): Promise<Uint8Array[]> {
    const sigs: Uint8Array[] = []
    const seeds: Map<string, KeysEntry> = new Map()
    const kset: Set<string> = new Set()
    for (const kp of kps) {
      if (kset.has(kp.pk + ':' + kp.path)) {
        throw new Error(`key path ${kp.path} already exists`)
      }
      kset.add(kp.pk + ':' + kp.path)

      if (!seeds.has(kp.pk)) {
        seeds.set(kp.pk, await this.openSeed(kp.pk))
      }

      const seed = seeds.get(kp.pk) as KeysEntry
      const keyPath = seed.sealed.ns_paths.find((p) => p.path == kp.path)
      if (!keyPath) {
        throw new Error(`key path ${kp.path} not exists`)
      }

      const secret = deriveEd25519(
        seed.seed_key.getSecretKey(),
        derivePath(keyPath.path)
      )

      const key = Ed25519Key.fromSecret(secret)
      const sig = key.sign(data)
      sigs.push(sig)
    }
    return sigs
  }

  async ed25519SignMessage(
    kp: KeyPK,
    message: Uint8Array // should be CBOR encoded
  ): Promise<Uint8Array> {
    const seed = await this.openSeed(kp.pk)
    const keyPath = seed.sealed.ns_paths.find((p) => p.path == kp.path)
    if (!keyPath) {
      throw new Error(`key path ${kp.path} not exists`)
    }
    const secret = deriveEd25519(
      seed.seed_key.getSecretKey(),
      derivePath(keyPath.path)
    )

    const key = Ed25519Key.fromSecret(secret)
    key.setKid(encodeCBOR(key.getPublicKey()))
    const data = new Sign1Message(message).toBytes(key, NS_SIGN_MESSAGE_AAD)
    return withTag(Sign1MessagePrefix, data)
  }

  async ed25519VerifyMessage(
    kp: KeyPK,
    signedMessage: Uint8Array
  ): Promise<Uint8Array> {
    const seed = await this.loadSeed(kp.pk)
    if (!seed) {
      throw new Error(`seed ${kp.pk} not exists`)
    }
    const keyPath = seed.ns_paths.find((p) => p.path == kp.path)
    if (!keyPath) {
      throw new Error(`key path ${kp.path} not exists`)
    }
    const pub = hexToBytes(keyPath.address.slice(2))
    const key = Ed25519Key.fromPublic(pub)
    const msg = Sign1Message.fromBytes(key, signedMessage, NS_SIGN_MESSAGE_AAD)
    return msg.payload
  }

  async secp256k1SignBTCTx(key: KeyPK, tx: Uint8Array): Promise<Uint8Array> {
    throw new Error('Method not implemented.')
  }

  async secp256k1SignBTCMessage(key: KeyPK, message: string): Promise<string> {
    throw new Error('Method not implemented.')
  }

  async secp256k1VerifyBTCMessage(
    key: KeyPK,
    message: string,
    signature: string
  ): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  async open(kr: KEKResponse, pass: Uint8Array = DEFAULT_PASS): Promise<void> {
    const key = new Ed25519Key(kr.key)
    this._kek = AesGcmKey.fromSecret(getKEKFromSeed(pass, key.getSecretKey()))
    const sealed_seeds = await this.loadSeedEntries()
    // open all seeds to validate the KEK
    await this.openSeeds(this._kek, sealed_seeds)

    this.kek_pk = bytesToHex(key.getPublicKey())
    let state = await this.loadKEKState()
    if (state == null) {
      state = {
        pk: this.kek_pk,
        created_at: Date.now(),
        synced_at: 0,
        with_password: compareBytes(pass, DEFAULT_PASS) != 0,
        state: kr.state,
        sig: key.sign(kr.state),
      }

      await this.saveKEKState(state)
    } else if (compareBytes(state.state, kr.state) != 0) {
      throw new Error(
        `invalid kek state, expected ${bytesToHex(
          state.state
        )}, got ${bytesToHex(kr.state)}`
      )
    }
  }

  async renew(kr: KEKResponse, pass: Uint8Array = DEFAULT_PASS): Promise<void> {
    if (!kr.next_key || !kr.next_state) {
      throw new Error('missing next key or next state')
    }

    let state = await this.loadKEKState()
    if (!state) {
      throw new Error('KEK not exists')
    }

    if (compareBytes(state.state, kr.state) != 0) {
      throw new Error(
        `invalid kek state, expected ${bytesToHex(
          state.state
        )}, got ${bytesToHex(kr.state)}`
      )
    }

    const sealed_seeds = await this.loadSeedEntries()
    // open all seeds to validate the KEK
    const seeds = await this.openSeeds(this.kek, sealed_seeds)

    const key = new Ed25519Key(kr.next_key)
    const kek = AesGcmKey.fromSecret(getKEKFromSeed(pass, key.getSecretKey()))

    state = {
      pk: bytesToHex(key.getPublicKey()),
      created_at: Date.now(),
      synced_at: 0,
      with_password: compareBytes(pass, DEFAULT_PASS) != 0,
      state: kr.next_state,
      sig: key.sign(kr.next_state),
    }
    await this.saveKEKState(state)
    await this.reSealSeeds(state.pk, kek, seeds)
    this._kek = kek
    this.kek_pk = state.pk
  }

  async loadKEKState(): Promise<KEKState | undefined> {
    return this.db.get('KEKState', KeyStore.KEKStateKey)
  }

  private async saveKEKState(state: KEKState): Promise<void> {
    const tx = this.db.transaction('KEKState', 'readwrite', {
      durability: 'strict',
    })

    await Promise.all([
      tx.store.put(state, KeyStore.KEKStateKey),
      tx.store.put(state, state.pk),
      tx.done,
    ])
  }

  private async loadSeedEntries(): Promise<SeedEntry[]> {
    const seeds: SeedEntry[] = []
    const tx = this.db.transaction('SeedEntry')
    for await (const cursor of tx.store) {
      seeds.push(cursor.value)
    }
    return seeds
  }

  private async openSeeds(
    key: AesGcmKey,
    seeds: SeedEntry[]
  ): Promise<KeysEntry[]> {
    const entries: KeysEntry[] = []
    for (const seed of seeds) {
      const msg = await Encrypt0Message.fromBytes(key, seed.seed)
      entries.push({
        sealed: seed,
        seed_raw: msg.payload,
        seed_key: new Ed25519Key(decodeCBOR(msg.payload)),
      })
    }
    return entries
  }

  private async reSealSeeds(
    kek_pk: string,
    kek: AesGcmKey,
    entries: KeysEntry[]
  ): Promise<void> {
    const seeds_bk: SeedEntry[] = []
    const seeds: SeedEntry[] = []
    for (const entry of entries) {
      seeds_bk.push(entry.sealed)
      seeds.push({
        ...entry.sealed,
        kek_pk,
        seed: await new Encrypt0Message(entry.seed_raw).toBytes(kek),
      })
    }

    const txBK = this.db.transaction('SeedEntryBK', 'readwrite', {
      durability: 'strict',
    })
    await Promise.all(
      seeds_bk
        .map((seed) => txBK.store.put(seed) as Promise<unknown>)
        .concat([txBK.done])
    )
    const tx = this.db.transaction('SeedEntry', 'readwrite', {
      durability: 'strict',
    })
    await Promise.all(
      seeds
        .map((seed) => tx.store.put(seed) as Promise<unknown>)
        .concat([tx.done])
    )
  }

  private async openSeed(pk: string): Promise<KeysEntry> {
    const entry = await this.loadSeed(pk)
    if (entry == null) {
      throw new Error(`seed ${pk} not exists`)
    }

    const msg = await Encrypt0Message.fromBytes(this.kek, entry.seed)
    return {
      sealed: entry,
      seed_raw: msg.payload,
      seed_key: new Ed25519Key(decodeCBOR(msg.payload)),
    }
  }

  private async loadSeed(pk: string): Promise<SeedEntry | undefined> {
    return this.db.get('SeedEntry', pk)
  }

  private async sealSeed(seed: SeedEntry): Promise<void> {
    const tx = this.db.transaction('SeedEntry', 'readwrite', {
      durability: 'strict',
    })
    await Promise.all([tx.store.put(seed), tx.done])
  }
}

function getKEKFromSeed(key: Uint8Array, seed: Uint8Array): Uint8Array {
  return hmac(sha3_256, key, seed)
}

function toSeedInfo(entry: SeedEntry): SeedInfo {
  return {
    pk: entry.pk,
    created_at: entry.created_at,
    updated_at: entry.updated_at,
    alias: entry.alias,
    ns_paths: entry.ns_paths.slice(),
    btc_paths: entry.btc_paths.slice(),
  }
}
