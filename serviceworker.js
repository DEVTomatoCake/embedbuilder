// Modified by TomatoCake from https://github.com/DEVTomatoCake/dashboard/blob/ed1b41c23b1f3857ecc7f08baf098f1f5212bb42/serviceworker.js

const version = 1

self.addEventListener("install", event => {
	event.waitUntil((async () => {
		(await caches.keys()).forEach(cacheName => {
			if (cacheName != "static" + version && cacheName != "fallback" + version) caches.delete(cacheName)
		})

		const staticCache = await caches.open("static" + version)
		staticCache.addAll([
			"/assets/fonts/ggsans-Bold.ttf",
			"/assets/fonts/ggsans-ExtraBold.ttf",
			"/assets/fonts/ggsans-Medium.ttf",
			"/assets/fonts/ggsans-Normal.ttf",
			"/assets/fonts/ggsans-Semibold.ttf",

			"/assets/manifest.json",
			"/assets/emojis.js",
			"/assets/sockette.js",
			"/assets/twemoji.js"
		])

		const fallbackCache = await caches.open("fallback" + version)
		fallbackCache.addAll([
			"/assets/style.css",
			"/assets/script.js",
			"/"
		])
	})())
})

self.addEventListener("activate", event => {
	event.waitUntil((async () => {
		if ("navigationPreload" in self.registration) await self.registration.navigationPreload.enable()
	})())

	self.clients.claim()
})

self.addEventListener("fetch", event => {
	const url = new URL(event.request.url)
	if (event.request.method == "GET" && url.protocol == "https:" && (event.request.mode == "navigate" || event.request.mode == "no-cors" || event.request.mode == "cors")) {
		event.respondWith((async () => {
			const preloadResponse = await event.preloadResponse
			if (preloadResponse) return preloadResponse

			const staticCache = await caches.open("static" + version)
			const assetResponse = await staticCache.match(event.request)
			if (assetResponse) return assetResponse

			const fallback = await caches.open("fallback" + version)
			try {
				const response = await fetch(event.request)
				if (url.host != "static.cloudflareinsights.com" && url.host != "sus.tomatenkuchen.com" && !url.search.includes("token="))
					fallback.put(event.request, response.clone())
				return response
			} catch (e) {
				console.warn("Cannot fetch " + event.request.url + ", serving from cache", e)
				return await fallback.match(event.request) || await caches.match("/")
			}
		})())
	}
})
