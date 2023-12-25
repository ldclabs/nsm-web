import { clientsClaim, type WorkboxPlugin } from 'workbox-core'
import { ExpirationPlugin } from 'workbox-expiration'
import { initialize as googleAnalytics } from 'workbox-google-analytics'
import {
  cleanupOutdatedCaches,
  matchPrecache,
  precacheAndRoute,
  type PrecacheEntry,
} from 'workbox-precaching'
import { registerRoute, setCatchHandler } from 'workbox-routing'
import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
} from 'workbox-strategies'

declare let self: ServiceWorkerGlobalScope

self.skipWaiting()
clientsClaim()

const precaches = self.__WB_MANIFEST
const indexHtml = precaches.find((entry) =>
  (entry as PrecacheEntry).url.endsWith('index.html')
) as PrecacheEntry | undefined

if (indexHtml) {
  precaches.push(Object.assign({}, indexHtml, { url: 'index.html' }))
}
precacheAndRoute(precaches)
cleanupOutdatedCaches()
googleAnalytics()

registerRoute(
  new RegExp('https://cdn\\.namebase\\.cc/.*'),
  new CacheFirst({
    cacheName: 'cdn-res',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 1000,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }) as WorkboxPlugin,
    ],
  })
)

const wwwCapture = 'https://www\\.namebase\\.cc.*'

registerRoute(
  new RegExp(wwwCapture),
  new StaleWhileRevalidate({
    cacheName: 'html-res',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 3 * 24 * 60 * 60,
      }) as WorkboxPlugin,
    ],
    matchOptions: {
      ignoreMethod: false,
      ignoreSearch: true,
      ignoreVary: false,
    },
  })
)

const apiCapture = 'https://(api|wallet|auth)\\.namebase\\.cc/.*'

registerRoute(
  new RegExp(apiCapture),
  new NetworkFirst({
    cacheName: 'api-res',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100000,
        maxAgeSeconds: 3 * 24 * 60 * 60,
      }) as WorkboxPlugin,
    ],
    matchOptions: {
      ignoreMethod: false,
      ignoreSearch: false,
      ignoreVary: false,
    },
  })
)

setCatchHandler(async ({ request }) => {
  let res: Response | undefined
  switch (request.destination) {
    case 'document':
      res = await matchPrecache('index.html')
    // case 'image':
    //   return matchPrecache(FALLBACK_IMAGE_URL)
  }

  return res || Response.error()
})
