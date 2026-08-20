/* iSCARB service worker — Web Push receiver (motivation feature P1-4).
 * Displays pushed notifications and focuses/opens the app on click. The
 * payload is produced by src/lib/notify-push.ts. RTL-safe: prefers the Arabic
 * title/body when the browser UI language is Arabic. */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "iSCARB", body: event.data ? event.data.text() : "" };
  }

  const lang = (self.navigator && self.navigator.language) || "en";
  const isAr = String(lang).toLowerCase().startsWith("ar");
  const title = (isAr && data.titleAr) || data.title || "iSCARB";
  const body = (isAr && data.bodyAr) || data.body || "";

  const options = {
    body: body,
    icon: "/icon-192.png",
    badge: "/badge-72.png",
    dir: isAr ? "rtl" : "ltr",
    lang: isAr ? "ar" : "en",
    tag: data.trigger || "iscarb",
    data: { view: data.view || "home" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const view = (event.notification.data && event.notification.data.view) || "home";
  const target = "/?view=" + encodeURIComponent(view);
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.postMessage({ type: "iscarb-notification-click", view: view });
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
