import { createUseLogger } from '@nsm-web/util'

export const useLogger = createUseLogger<{
  'accessibility': string
  'failed to load icon': { error: unknown }
}>()

export type Logger = ReturnType<typeof useLogger>
