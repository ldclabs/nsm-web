import svgr from '@svgr/rollup'
import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { checker } from 'vite-plugin-checker'
import { VitePWA } from 'vite-plugin-pwa'

const buildEnv = process.env['npm_package_scripts_build'] || ''

const scope =
  buildEnv.includes('testing') || !buildEnv.includes('--mode')
    ? 'https://www.namebase.top'
    : 'https://www.namebase.cc'
const cdnPrefix =
  buildEnv.includes('testing') || !buildEnv.includes('--mode')
    ? 'https://cdn.namebase.cc/dev/web/'
    : buildEnv.includes('staging')
    ? 'https://cdn.namebase.cc/beta/web/'
    : 'https://cdn.namebase.cc/web/'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({ babel: { rootMode: 'upward', configFile: true } }),
    legacy(),
    checker({ typescript: true }),
    svgr({ ref: true, titleProp: true }),
    VitePWA({
      scope,
      buildBase: cdnPrefix,
      injectRegister: null,
      useCredentials: true,
      registerType: 'autoUpdate',
      strategies: 'injectManifest', // default to generateSW
      srcDir: 'src',
      filename: 'sw.ts',
      // workbox: { // for generateSW strategies
      //   clientsClaim: true,
      //   skipWaiting: true,
      //   navigateFallback: cdnPrefix + 'index.html',
      //   maximumFileSizeToCacheInBytes: 3000000,
      //   globIgnores: ['*/*-legacy*'],
      //   globPatterns: ['**/*.{js,css,html,txt,webmanifest,svg,png,ico}'],
      //   modifyURLPrefix: {
      //     '': cdnPrefix,
      //   },
      // },
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
        'name': 'NS Protocol',
        'short_name': 'NS',
        'start_url': scope,
        'display': 'standalone',
        'theme_color': '#ffffff',
        'background_color': '#ffffff',
        'description': 'AI-based Translingual Knowledge Content Platform.',
        'icons': [
          {
            'src': cdnPrefix + 'favicon-64x64.png',
            'sizes': '64x64',
            'type': 'image/png',
          },
          {
            'src': cdnPrefix + 'favicon-192x192.png',
            'sizes': '192x192',
            'type': 'image/png',
          },
          {
            'src': cdnPrefix + 'favicon-512x512.png',
            'sizes': '512x512',
            'type': 'image/png',
            'purpose': 'any',
          },
          {
            'src': cdnPrefix + 'favicon-512x512-maskable.png',
            'sizes': '512x512',
            'type': 'image/png',
            'purpose': 'maskable',
          },
        ],
      },
    }),
  ],
})