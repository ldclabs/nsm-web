import { createUseLogger } from '@ldclabs/util'

export const useLogger = createUseLogger<{
  'accessibility': string
  'failed to load icon': { error: unknown }
}>()

export type Logger = ReturnType<typeof useLogger>
