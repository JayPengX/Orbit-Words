// Orbit Words: the family's one service worker (Shared-Proxy/kit/sw.js),
// with this app's settings. It keeps the page's own files so the app opens
// without a connection and can be installed, and never keeps a file that
// isn't the one its address names (GitHub's CDN can answer a new address
// with the old file for a while after a deploy).
// A word's recording (data/audio/, never re-recorded) from the cache first,
// each one kept, so a word heard before plays without asking the network.
// Pictures from other sites: the kit's shared picture cache (sw-images.js).
const isAudio = url => url.pathname.includes('/data/audio/');
self.QUADRA_SW = {
  cache: 'quadra-hub-v1',
  title: 'Orbit Words',
  route: (request, url) => (isAudio(url) ? 'cacheFirst' : null),
  prune: url => !isAudio(url)
};
importScripts('../Shared-Proxy/kit/sw-images.js');
importScripts('../Shared-Proxy/kit/sw.js');
