self.addEventListener('install', () => {
  console.log('Orbix Contracts App installed')
})

self.addEventListener('activate', () => {
  console.log('Orbix Contracts App activated')
})

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})
