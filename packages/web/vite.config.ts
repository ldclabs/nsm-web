import svgr from '@svgr/rollup'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { checker } from 'vite-plugin-checker'
import { VitePWA } from 'vite-plugin-pwa'

const buildEnv = process.env['npm_package_scripts_build'] || ''
const scope =
  buildEnv.includes('testing') || !buildEnv.includes('--mode')
    ? 'http://127.0.0.1'
    : 'https://www.ns.top'
const cdnPrefix =
  buildEnv.includes('testing') || !buildEnv.includes('--mode')
    ? 'https://cdn.ns.top/dev/web/'
    : buildEnv.includes('staging')
    ? 'https://cdn.ns.top/beta/web/'
    : 'https://cdn.ns.top/web/'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: 'es2020',
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
    },
  },
  plugins: [
    react({
      babel: {
        rootMode: 'upward',
        configFile: true,
      },
    }),
    checker({ typescript: true }),
    svgr({ ref: true, titleProp: true }),
    VitePWA({
      scope,
      buildBase: cdnPrefix,
      injectRegister: null,
      useCredentials: true,
      registerType: 'prompt',
      strategies: 'injectManifest', // default to generateSW
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        // for injectManifest strategies
        maximumFileSizeToCacheInBytes: 3000000,
        globIgnores: ['*/*-legacy*'],
        globPatterns: ['**/*.{js,css,html,txt,webmanifest,svg,png,ico}'],
        modifyURLPrefix: {
          '': cdnPrefix,
        },
      },
      devOptions: {
        enabled: true,
      },
      includeManifestIcons: true,
      manifest: {
        'name': 'NS Top',
        'short_name': 'NS Top',
        'start_url': scope,
        'display': 'standalone',
        'theme_color': '#FF9F40',
        'background_color': '#002FA7',
        'description':
          'NS.Top — Inscribing naming trusted database on Bitcoin network (Implementation of NS-Protocol).',
        'icons': [
          {
            'src': cdnPrefix + 'android-chrome-192x192.png',
            'sizes': '192x192',
            'type': 'image/png',
          },
          {
            'src': cdnPrefix + 'android-chrome-384x384.png',
            'sizes': '384x384',
            'type': 'image/png',
            'purpose': 'any',
          },
          {
            'src': cdnPrefix + 'apple-touch-icon.png',
            'sizes': '180x180',
            'type': 'image/png',
            'purpose': 'maskable',
          },
        ],
      },
    }),
  ],
})
