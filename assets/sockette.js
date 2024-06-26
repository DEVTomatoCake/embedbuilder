// Unmodified from https://github.com/DEVTomatoCake/dashboard/blob/ed1b41c23b1f3857ecc7f08baf098f1f5212bb42/assets/js/sockette.js


// Original source: https://raw.githubusercontent.com/lukeed/sockette/66bf604bd51f914680a69600099ba7060bc10c09/src/index.js
// Modified by booky10 and TomatoCake

// eslint-disable-next-line no-unused-vars
const sockette = (url, opts = {}) => {
	let reconnectAttempts = 0
	let reconnectTimer = 1

	const object = {}
	let websocket

	object.open = () => {
		websocket = new WebSocket(url, [])

		websocket.onmessage = event => {
			console.log("Received message: " + event.data)

			if (opts.onMessage) {
				let json
				try {
					json = JSON.parse(event.data)
				} catch (e) {
					console.error(e, event)
					return websocket.send({
						status: "error",
						message: "Invalid json: " + e,
						debug: event.data
					})
				}
				console.log(json)

				opts.onMessage(json)
			}
		}

		websocket.onopen = event => {
			reconnectAttempts = 0
			if (opts.onOpen) opts.onOpen(event)
		}

		websocket.onclose = event => {
			console.log("Closed", event)

			if (event.code != 1000 && event.code != 1001 && event.code != 1005) object.reconnect(event)
			if (opts.onClose) opts.onClose(event)
		}

		websocket.onerror = event => {
			if (event && event.code == "ECONNREFUSED") object.reconnect(event)
			if (opts.onError) opts.onError(event)
			else console.error("[WS] Error", event)
		}
	}

	object.reconnect = event => {
		if (reconnectTimer && reconnectAttempts++ < 7) {
			reconnectTimer = setTimeout(() => {
				console.log("Reconnecting...", event)
				object.open()
			}, 3500)
		} else console.warn("[WS] Stopped reconnection attempts", event)
	}

	object.send = data => {
		if (typeof data == "object") data = JSON.stringify(data)
		websocket.send(data)
	}

	object.close = (code, reason) => {
		reconnectTimer = clearTimeout(reconnectTimer)
		websocket.close(code || 1000, reason)
	}

	object.open()
	return object
}
