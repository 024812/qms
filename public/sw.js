self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    self.registration
      .unregister()
      .then(() => {
        // Notify clients to reload
        return self.clients.matchAll({ type: 'window' });
      })
      .then(clients => {
        for (const client of clients) {
          client.navigate(client.url);
        }
      })
  );
});
