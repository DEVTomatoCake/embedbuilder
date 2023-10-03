/**
 * Discord Embed Builder
 * Contribute or report issues at
 * https://github.com/Glitchii/embedbuilder
 * https://github.com/DEVTomatoCake/embedbuilder
 */

const params = new URLSearchParams(location.search)
const hasParam = param => params.get(param) !== null
const username = params.has("mb") ? "Manage Bot" : "TomatenKuchen"
const avatar = "./assets/images/" + (params.has("mb") ? "managebot_40" : "background_192") + ".webp"
const dataSpecified = params.get("data")
const guiTabs = params.get("guitabs") || ["description"]
const useJsonEditor = params.get("editor") == "json"
let reverseColumns = hasParam("reverse")
let autoUpdateURL = localStorage.getItem("autoUpdateURL"),
	lastActiveGuiEmbedIndex = -1, lastGuiJson, colNum = 1, num = 0, buildGui

const guiEmbedIndex = guiEl => {
	const guiEmbed = guiEl?.closest(".guiEmbed")
	const gui = guiEmbed?.closest(".gui")

	return gui ? Array.from(gui.querySelectorAll(".guiEmbed")).indexOf(guiEmbed) : -1
}
const guiActionRowIndex = guiRo => {
	const guiActionRow = guiRo?.closest(".guiActionRow")
	const gui = guiActionRow?.closest(".gui")

	return gui ? Array.from(gui.querySelectorAll(".guiActionRow")).indexOf(guiActionRow) : -1
}
const guiComponentIndex = guiRo => {
	const guiComponent = guiRo?.closest(".guiComponent")
	const gui = guiComponent?.closest(".guiActionRow")

	return gui ? Array.from(gui.querySelectorAll(".guiComponent")).indexOf(guiComponent) : -1
}

const toggleStored = item => {
	const found = localStorage.getItem(item)
	if (!found) return localStorage.setItem(item, true)

	localStorage.removeItem(item)
	return found
}

const createElement = object => {
	let element
	for (const tag in object) {
		element = document.createElement(tag)

		for (const attr in object[tag])
			if (attr == "children") for (const child of object[tag][attr])
				element.appendChild(createElement(child))
			else element[attr] = object[tag][attr]
	}

	return element
}

const encodeJson = (jsonCode, withURL = false, redirect = false) => {
	let data = btoa(encodeURIComponent(JSON.stringify(typeof jsonCode === "object" ? jsonCode : json)))
	const url = new URL(location.href)

	if (withURL) {
		url.searchParams.set("data", data)
		if (redirect) return top.location.href = url

		data = url.href
			// Replace %3D ('=' url encoded) with '='
			.replace(/data=\w+(?:%3D)+/g, "data=" + data)
	}

	return data
}

const decodeJson = data => {
	if (!data && dataSpecified) data = dataSpecified
	data = data.replace(/ /g, "+")
	const jsonData = decodeURIComponent(atob(data))
	return typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData
}

const toRGB = (hex, reversed, integer) => {
	if (reversed) return "#" + hex.match(/\d+/g).map(x => parseInt(x).toString(16).padStart(2, "0")).join("")
	if (integer) return parseInt(hex.match(/\d+/g).map(x => parseInt(x).toString(16).padStart(2, "0")).join(""), 16)
	if (hex.includes(",")) return hex.match(/\d+/g)
	hex = hex.replace("#", "").match(/.{1,2}/g)
	return [parseInt(hex[0], 16), parseInt(hex[1], 16), parseInt(hex[2], 16), 1]
}

const reverse = reversed => {
	const side = document.querySelector(reversed ? ".side2" : ".side1")
	if (side.nextElementSibling) side.parentElement.insertBefore(side.nextElementSibling, side)
	else side.parentElement.insertBefore(side, side.parentElement.firstElementChild)
}

const urlOptions = ({ remove, set }) => {
	const url = new URL(location.href)
	if (remove) url.searchParams.delete(remove)
	if (set) url.searchParams.set(set[0], set[1])

	try {
		history.replaceState(null, null, url.href.replace(/(?<!data=[^=]+|=)=(&|$)/g, x => x === "=" ? "" : "&"))
	} catch (e) {
		// 'SecurityError' when trying to change the url of a different origin
		// e.g. when trying to change the url of the parent window from an iframe
		console.info(e)
	}
}

const buttonStyles = {
	1: "primary",
	2: "secondary",
	3: "success",
	4: "danger",
	5: "url"
}

const animateGuiEmbedNameAt = (i, text) => {
	const guiEmbedName = document.querySelectorAll(".gui .guiEmbedName")?.[i]
	// Shake animation
	guiEmbedName?.animate(
		[{ transform: "translate(0, 0)" },
		{ transform: "translate(10px, 0)" },
		{ transform: "translate(0, 0)" }],
		{ duration: 100, iterations: 3 }
	)

	if (text) guiEmbedName?.style.setProperty("--text", `"${text}"`)

	guiEmbedName?.scrollIntoView({ behavior: "smooth", block: "center" })
	guiEmbedName?.classList.remove("empty")
	setTimeout(() => guiEmbedName?.classList.add("empty"), 10)
}

const indexOfEmptyGuiEmbed = text => {
	for (const [i, element] of document.querySelectorAll(".msgEmbed>.container .embed").entries())
		if (element.classList.contains("emptyEmbed")) {
			if (text !== false) animateGuiEmbedNameAt(i, text)
			return i
		}

	for (const [i, embedObj] of (json.embeds || []).entries())
		if (!(0 in Object.keys(embedObj))) {
			if (text !== false) animateGuiEmbedNameAt(i, text)
			return i
		}

	return -1
}

const changeLastActiveGuiEmbed = index => {
	const pickerEmbedText = document.querySelector(".colors .cTop .embedText>span")

	if (index === -1) {
		lastActiveGuiEmbedIndex = -1
		return pickerEmbedText.textContent = ""
	}

	lastActiveGuiEmbedIndex = index

	if (pickerEmbedText) {
		pickerEmbedText.textContent = index + 1

		const guiEmbedNames = document.querySelectorAll(".gui .item.guiEmbedName")
		pickerEmbedText.onclick = () => {
			const newIndex = parseInt(prompt("Enter an embed number" + (guiEmbedNames.length > 1 ? `, 1 - ${guiEmbedNames.length}` : ""), index + 1))
			if (isNaN(newIndex)) return
			if (newIndex < 1 || newIndex > guiEmbedNames.length)
				return error(guiEmbedNames.length === 1 ? `'${newIndex}' is not a valid embed number` : `'${newIndex}' doesn't seem like a number between 1 and ${guiEmbedNames.length}`)

			changeLastActiveGuiEmbed(newIndex - 1)
		}
	}
}

// Called after building embed for extra work.
const afterBuilding = () => autoUpdateURL && urlOptions({ set: ["data", encodeJson(json)] })
// Parses emojis to images and adds code highlighting.
const externalParsing = ({ noEmojis, element } = {}) => {
	if (!noEmojis) twemoji.parse(element || document.querySelector(".msgEmbed"), { base: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/" })
	for (const block of document.querySelectorAll(".markup pre > code"))
		hljs.highlightBlock(block)

	const embed = element?.closest(".embed")
	if (embed?.innerText.trim()) embed.classList.remove("emptyEmbed")

	afterBuilding()
}

const url = str => /^(https?:)?\/\//g.test(str) ? str : "//" + str
const hide = el => el.style.removeProperty("display")
const imgSrc = (elm, src, remove) => remove ? elm.style.removeProperty("content") : elm.style.content = "url(" + src + ")"
const encode = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;")

const timestamp = stringISO => {
	const date = stringISO ? new Date(stringISO) : new Date()
	const dateArray = date.toLocaleString(void 0, { hour: "numeric", hour12: false, minute: "numeric" })
	const today = new Date()
	const yesterday = new Date(new Date().setDate(today.getDate() - 1))
	const tomorrow = new Date(new Date().setDate(today.getDate() + 1))

	if (today.toDateString() == date.toDateString()) return "Today at " + dateArray
	if (yesterday.toDateString() == date.toDateString()) return "Yesterday at " + dateArray
	if (tomorrow.toDateString() == date.toDateString()) return "Tomorrow at " + dateArray
	return new Date().toLocaleDateString() + " " + dateArray
}

const markup = (txt, { replaceEmojis, replaceHeaders, inlineBlock }) => {
	if (replaceEmojis)
		txt = txt.replace(/(?<!code(?: \w+=".+")?>[^>]+)(?<!\/[^\s"]+?):((?!\/)\w+):/g, (match, p) => p && emojis[p] ? emojis[p] : match)

	let listType
	txt = txt
		/** Markdown */
		.replace(/&lt;:\w+:(\d{17,21})&gt;/g, '<img class="emoji" src="https://cdn.discordapp.com/emojis/$1.webp"/>')
		.replace(/&lt;a:\w+:(\d{17,21})&gt;/g, '<img class="emoji" src="https://cdn.discordapp.com/emojis/$1.gif"/>')
		.replace(/~~(.+?)~~/g, "<s>$1</s>")
		.replace(/\*\*\*(.+?)\*\*\*/g, "<em><strong>$1</strong></em>")
		.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
		.replace(/__(.+?)__/g, "<u>$1</u>")
		.replace(/\*(.+?)\*/g, "<em>$1</em>")
		.replace(/_(.+?)_/g, "<em>$1</em>")
		// Replace non-markdown links
		.replace(/(^| )(https?:\/\/[-a-z0-9/.äöü]+)/gim, "$1<a href='$2' target='_blank' rel='noopener' class='anchor'>$2</a>")

	if (replaceHeaders) txt = txt
		.replace(/^### ([\S 	]+)/gm, "<span class='h3'>$1</span>")
		.replace(/^## ([\S 	]+)/gm, "<span class='h2'>$1</span>")
		.replace(/^# ([\S 	]+)/gm, "<span class='h1'>$1</span>")

	txt = txt
		.replace(/^(-|\*|\d\.) ?([\S 	]+)/gm, (match, p1, p2) => {
			let prefix = ""
			if (!listType) {
				if (p1 == "-" || p1 == "*") listType = "ul"
				else listType = "ol"
				prefix += "<" + listType + ">"
			}

			let suffix = ""
			const splitted = txt.split("\n")
			if (
				(listType == "ul" && splitted[splitted.indexOf(match) + 1] && !splitted[splitted.indexOf(match) + 1].startsWith("-") && !splitted[splitted.indexOf(match) + 1].startsWith("*")) ||
				(listType == "ol" && splitted[splitted.indexOf(match) + 1] && !/^\d+\./.test(splitted[splitted.indexOf(match) + 1].split(" ")[0])) ||
				!splitted[splitted.indexOf(match) + 1]
			) {
				suffix += "</" + listType + ">"
				listType = void 0
			}

			return prefix + "<li>" + p2 + "</li>" + suffix
		})
		// Replace >>> and > with block-quotes. &gt; is HTML code for >
		.replace(/^(?: *&gt;&gt;&gt; ([\s\S]*))|(?:^ *&gt;(?!&gt;&gt;) +.+\n)+(?:^ *&gt;(?!&gt;&gt;) .+\n?)+|^(?: *&gt;(?!&gt;&gt;) ([^\n]*))(\n?)/mg, (all, match1, match2, newLine) => {
			return `<div class="blockquote"><div class="blockquoteDivider"></div><blockquote>${match1 || match2 || newLine ? match1 || match2 : all.replace(/^ *&gt; /gm, "")}</blockquote></div>`
		})

		/** Mentions */
		.replace(/&lt;id:(customize|home|browse)&gt;/g, "<span class='mention channel'>$1</span>")
		.replace(/&lt;#(\d{17,21})&gt;/g, "<span class='mention channel interactive'>channel: $1</span>")
		.replace(/&lt;@&amp;(\d{17,21})&gt;/g, "<span class='mention interactive'>@role: $1</span>")
		.replace(/&lt;@(\d+)&gt;|@(?:everyone|here)/g, (all, match1) => {
			if (all.startsWith("@")) return "<span class='mention'>" + all + "</span>"
			return "<span class='mention interactive'>@user: " + match1 + "</span>"
		})
		.replace(/\[([^[\]]+)\]\((.+?)\)/g, "<a title='$1' href='$2' target='_blank' rel='noopener' class='anchor'>$1</a>")
		.replace(/&lt;t:([0-9]{1,13})(:[a-z])?&gt;/gi, (all, match1) => {
			return "<span class='spoiler'>" + new Date(parseInt(match1) * 1000).toLocaleString() + "</span>"
		})

	if (inlineBlock)
		// Treat both inline code and code blocks as inline code
		txt = txt.replace(/`([^`]+?)`|``([^`]+?)``|```((?:\n|.)+?)```/g, (m, x, y, z) => {
			if (x || y || z) return "<code class='inline'>" + (x || y || z) + "</code>"
			return m
		})
	else {
		// Code block
		txt = txt.replace(/```(?:([a-z0-9_+\-.]+?)\n)?\n*([^\n][^]*?)\n*```/ig, (m, w, x) => {
			if (w) return "<pre><code class='" + w + "'>" + x.trim() + "</code></pre>"
			else return "<pre><code class='hljs nohighlight'>" + x.trim() + "</code></pre>"
		})
		// Inline code
		txt = txt.replace(/`([^`]+?)`|``([^`]+?)``/g, (m, x, y) => {
			if (x || y) return "<code class='inline'>" + (x || y) + "</code>"
			return m
		})
	}

	return txt
}

const display = (el, data, displayType) => {
	if (data) el.innerHTML = data
	el.style.display = displayType || "unset"
}

const uploadError = (message, browse, sleepTime = 7000) => {
	browse.classList.remove("loading")
	browse.classList.add("error")

	const p = browse.parentElement.querySelector(".browse.error>p")
	p.dataset.error = encode(message)

	setTimeout(() => {
		browse.classList.remove("error")
		delete p.dataset.error
	}, sleepTime)
}

const embedKeys = ["author", "footer", "color", "thumbnail", "image", "fields", "title", "description", "url", "timestamp"]
const componentKeys = ["label", "style", "emoji", "options", "placeholder", "custom_id", "url", "disabled", "type", "value", "min_values", "max_values"]
const mainKeys = ["embed", "embeds", "content", "components"]
const allJsonKeys = [...mainKeys, ...embedKeys, ...componentKeys]

// 'jsonObject' is used internally, do not change it's value. Assign to 'json' instead.
// 'json' is the object that is used to build the embed. Assigning to it also updates the editor.
let jsonObject = window.json ?? {}

if (dataSpecified) jsonObject = decodeJson()

if (!jsonObject.embeds?.length) jsonObject.embeds = []
if (!jsonObject.components?.length) jsonObject.components = []

delete jsonObject.embed

addEventListener("DOMContentLoaded", () => {
	if (reverseColumns || localStorage.getItem("reverseColumns")) reverse()

	if (autoUpdateURL) {
		document.body.classList.add("autoUpdateURL")
		document.querySelector(".item.auto > input").checked = true
	}

	document.querySelector(".side1.noDisplay")?.classList.remove("noDisplay")
	if (useJsonEditor) document.body.classList.remove("gui")

	if (username) document.querySelector(".username").textContent = username
	if (avatar) document.querySelector(".avatar").src = avatar

	for (const e of document.querySelectorAll(".clickable > img"))
		e.parentElement.addEventListener("mouseup", el => window.open(el.target.src))

	const editorHolder = document.querySelector(".editorHolder"),
		guiParent = document.querySelector(".top"),
		embedContent = document.querySelector(".messageContent"),
		embedCont = document.querySelector(".msgEmbed>.container"),
		actionRowCont = document.querySelector(".components"),
		gui = guiParent.querySelector(".gui:first-of-type")

	editor = CodeMirror(elt => editorHolder.parentNode.replaceChild(elt, editorHolder), {
		value: JSON.stringify(json, null, 4),
		gutters: ["CodeMirror-foldgutter", "CodeMirror-lint-markers"],
		scrollbarStyle: "overlay",
		mode: "application/json",
		theme: "material-darker",
		matchBrackets: true,
		foldGutter: true,
		lint: true,
		extraKeys: {
			// Fill in indent spaces on a new line when enter (return) key is pressed.
			Enter: () => {
				const cursor = editor.getCursor()
				const end = editor.getLine(cursor.line)
				const leadingSpaces = end.replace(/\S($|.)+/g, "") || "    \n"
				const nextLine = editor.getLine(cursor.line + 1)

				if ((nextLine === void 0 || !nextLine.trim()) && !end.substr(cursor.ch).trim())
					editor.replaceRange("\n", { line: cursor.line, ch: cursor.ch })
				else
					editor.replaceRange(`\n${end.endsWith("{") ? leadingSpaces + "    " : leadingSpaces}`, {
						line: cursor.line,
						ch: cursor.ch
					})
			}
		}
	})
	editor.focus()

	const notif = document.querySelector(".notification")

	const error = (msg, time = "5s") => {
		notif.innerText = msg
		notif.style.removeProperty("--startY")
		notif.style.removeProperty("--startOpacity")
		notif.style.setProperty("--time", time)
		notif.onanimationend = () => notif.style.display = null

		// If notification element is not already visible, (no other message is already displayed), display it.
		if (!notif.style.display) return notif.style.display = "block"

		// If there's a message already displayed, update it and delay animating out.
		notif.style.setProperty("--startY", 0)
		notif.style.setProperty("--startOpacity", 1)
		notif.style.display = null
		setTimeout(() => notif.style.display = "block", 0.5)

		return false
	}

	const socket = sockette("wss://api.tomatenkuchen.com/embedbuilder", {
		onClose: event => console.log("Disconnected!", event),
		onOpen: event => console.log("Connected!", event),
		onMessage: wsjson => {
			if (wsjson.action == "error") error(wsjson.message, wsjson.time)
			else if (wsjson.action == "result_importcode") alert("Send the code " + wsjson.code + " while replying to the message you want to import. The bot must be able to see the channel!")
			else if (wsjson.action == "result_sendcode") alert("Send the code " + wsjson.code + " in the channel you want to send the message in!")
			else if (wsjson.action == "result_import") json = {
				content: wsjson.content,
				embeds: wsjson.embeds,
				components: wsjson.components
			}
			else if (wsjson.action == "result_send") error(wsjson.success ? "The message was sent successfully!" : "The message couldn't be sent: " + wsjson.error)
		}
	})

	const createEmbedFields = (fields, embedFields) => {
		embedFields.innerHTML = ""
		let index, gridCol

		for (const [i, f] of fields.entries()) {
			if (f.name && f.value) {
				const fieldElement = embedFields.insertBefore(document.createElement("div"), null)
				// Figuring out if there are only two fields on a row to give them more space.
				// e.fields = json.embeds.fields.

				// if both the field of index 'i' and the next field on it's right are inline and -
				if (fields[i].inline && fields[i + 1]?.inline &&
					// it's the first field in the embed or -
					((i === 0 && fields[i + 2] && !fields[i + 2].inline) || ((
						// it's not the first field in the embed but the previous field is not inline or -
						i > 0 && !fields[i - 1].inline ||
						// it has 3 or more fields behind it and 3 of those are inline except the 4th one back if it exists -
						i >= 3 && fields[i - 1].inline && fields[i - 2].inline && fields[i - 3].inline && (fields[i - 4] ? !fields[i - 4].inline : !fields[i - 4])
						// or it's the first field on the last row or the last field on the last row is not inline or it's the first field in a row and it's the last field on the last row.
					) && (i == fields.length - 2 || !fields[i + 2].inline))) || i % 3 === 0 && i == fields.length - 2) {
					// then make the field halfway (and the next field will take the other half of the embed).
					index = i
					gridCol = "1 / 7"
				}
				// The next field.
				if (index == i - 1) gridCol = "7 / 13"

				if (f.inline) {
					if (i && !fields[i - 1].inline) colNum = 1

					fieldElement.outerHTML = `
						<div class="embedField ${num}${gridCol ? " colNum-2" : ""}" style="grid-column: ${gridCol || (colNum + " / " + (colNum + 4))};">
							<div class="embedFieldName">${markup(encode(f.name), { replaceEmojis: true, inlineBlock: true })}</div>
							<div class="embedFieldValue">${markup(encode(f.value), { replaceEmojis: true })}</div>
						</div>`

					if (index != i) gridCol = false
				} else fieldElement.outerHTML = `
					<div class="embedField" style="grid-column: 1 / 13;">
						<div class="embedFieldName">${markup(encode(f.name), { replaceEmojis: true, inlineBlock: true })}</div>
						<div class="embedFieldValue">${markup(encode(f.value), { replaceEmojis: true })}</div>
					</div>`

				colNum = (colNum == 9 ? 1 : colNum + 4)
				num++
			}
		}


		for (const e of document.querySelectorAll('.embedField[style="grid-column: 1 / 5;"]'))
			if (!e.nextElementSibling || e.nextElementSibling.style.gridColumn === "1 / 13") e.style.gridColumn = "1 / 13"
		colNum = 1

		display(embedFields, void 0, "grid")
	}

	const smallerScreen = matchMedia("(max-width: 1015px)")

	const [guiFragment, fieldFragment, componentFragment, embedFragment, guiEmbedAddFragment, guiActionRowAddFragment, actionRowFragment] = Array.from({ length: 7 }, () => document.createDocumentFragment())
	fieldFragment.appendChild(document.querySelector(".edit>.fields>.field").cloneNode(true))
	componentFragment.appendChild(document.querySelector(".guiActionRow>.guiComponent").cloneNode(true))
	embedFragment.appendChild(document.querySelector(".embed.markup").cloneNode(true))
	actionRowFragment.appendChild(document.querySelector(".actionrow.markup").cloneNode(true))
	guiEmbedAddFragment.appendChild(document.querySelector(".guiEmbedAdd").cloneNode(true))
	guiActionRowAddFragment.appendChild(document.querySelector(".guiActionRowAdd").cloneNode(true))

	document.querySelector(".embed.markup").remove()
	gui.querySelector(".edit>.fields>.field").remove()

	for (const child of gui.childNodes) guiFragment.appendChild(child.cloneNode(true))

	// Renders the GUI editor with json data from 'jsonObject'.
	buildGui = (object = jsonObject, opts = {}) => {
		gui.innerHTML = ""
		gui.appendChild(guiEmbedAddFragment.firstChild.cloneNode(true))
			.addEventListener("click", () => {
				if (indexOfEmptyGuiEmbed("(empty embed)") !== -1) return
				jsonObject.embeds.push({})
				buildGui()
			})
		gui.appendChild(guiActionRowAddFragment.firstChild.cloneNode(true))
			.addEventListener("click", () => {
				jsonObject.components.push({})
				buildGui()
			})

		for (const child of Array.from(guiFragment.childNodes)) {
			if (child.classList?.[1] == "content")
				gui.insertBefore(gui.appendChild(child.cloneNode(true)), gui.appendChild(child.nextElementSibling.cloneNode(true))).nextElementSibling.firstElementChild.value = object.content || ""
			else if (child.classList?.[1] == "guiEmbedName") {
				for (const [i, embed] of (object.embeds.length ? object.embeds : [{}]).entries()) {
					const guiEmbedName = gui.appendChild(child.cloneNode(true))

					guiEmbedName.querySelector(".text").innerHTML = `Embed ${i + 1}${embed.title ? `: <span>${embed.title}</span>` : ""}`
					guiEmbedName.querySelector(".icon").addEventListener("click", () => {
						object.embeds.splice(i, 1)
						buildGui()
						buildEmbed()
					})

					const guiEmbed = gui.appendChild(createElement({ div: { className: "guiEmbed" } }))
					const guiEmbedTemplate = child.nextElementSibling

					for (const child2 of Array.from(guiEmbedTemplate.children)) {
						if (!child2?.classList.contains("edit")) {
							const row = guiEmbed.appendChild(child2.cloneNode(true))
							const edit = child2.nextElementSibling?.cloneNode(true)
							if (edit?.classList.contains("edit")) guiEmbed.appendChild(edit)

							switch (child2.classList[1]) {
								case "author":
									const authorURL = embed?.author?.icon_url || ""
									if (authorURL)
										edit.querySelector(".imgParent").style.content = "url(" + encode(authorURL) + ")"
									edit.querySelector(".editAuthorLink").value = authorURL
									edit.querySelector(".editAuthorName").value = embed?.author?.name || ""
									break
								case "title":
									row.querySelector(".editTitle").value = embed?.title || ""
									break
								case "description":
									edit.querySelector(".editDescription").value = embed?.description || ""
									break
								case "thumbnail":
									const thumbnailURL = embed?.thumbnail?.url || ""
									if (thumbnailURL)
										edit.querySelector(".imgParent").style.content = "url(" + encode(thumbnailURL) + ")"
									edit.querySelector(".editThumbnailLink").value = thumbnailURL
									break
								case "image":
									const imageURL = embed?.image?.url || ""
									if (imageURL)
										edit.querySelector(".imgParent").style.content = "url(" + encode(imageURL) + ")"
									edit.querySelector(".editImageLink").value = imageURL
									break
								case "footer":
									const footerURL = embed?.footer?.icon_url || ""
									if (footerURL)
										edit.querySelector(".imgParent").style.content = "url(" + encode(footerURL) + ")"
									edit.querySelector(".editFooterLink").value = footerURL
									edit.querySelector(".editFooterText").value = embed?.footer?.text || ""
									break
								case "fields":
									for (const f of embed?.fields || []) {
										const fields = edit.querySelector(".fields")
										const field = fields.appendChild(createElement({ div: { className: "field" } }))

										for (const child3 of Array.from(fieldFragment.firstChild.children)) {
											const newChild = field.appendChild(child3.cloneNode(true))

											if (child.classList.contains("inlineCheck"))
												newChild.querySelector("input").checked = Boolean(f.inline)
											else if (f.value && child3.classList?.contains("fieldInner")) {
												newChild.querySelector(".designerFieldName input").value = f.name || ""
												newChild.querySelector(".designerFieldValue textarea").value = f.value || ""
											}
										}
									}
									break
							}
						}
					}
				}
			} else if (child.classList?.[1] == "guiActionRowName") {
				for (const [i, component] of (object.components && object.components.length ? object.components : [{}]).entries()) {
					const guiActionRowName = gui.appendChild(child.cloneNode(true))

					guiActionRowName.querySelector(".text").innerHTML = `Action Row ${i + 1}${component.custom_id ? `: <span>${component.custom_id}</span>` : ""}`
					guiActionRowName.querySelector(".icon").addEventListener("click", () => {
						object.components.splice(i, 1)
						buildGui()
						buildEmbed()
					})

					const guiActionRow = gui.appendChild(createElement({ div: { className: "guiActionRow" } }))
					const guiActionRowTemplate = child.nextElementSibling

					for (const child2 of Array.from(guiActionRowTemplate.children)) {
						if (child2 && child2.classList.contains("guiComponent")) {
							for (const f of component?.components || []) {
								const edit = child2.cloneNode(true)
								guiActionRow.appendChild(edit)

								const editRow = edit.querySelector(".componentInner")
								const componentElem = editRow.appendChild(createElement({ div: { className: "button" } }))

								for (const child3 of Array.from(componentFragment.querySelector(".edit .componentInnerTemplate").children)) {
									const newChild = componentElem.appendChild(child3.cloneNode(true))

									if (newChild.classList.contains("disableCheck")) newChild.querySelector("input").checked = Boolean(f.disabled)
									else if (newChild.classList?.contains("custom_id")) newChild.querySelector(".custom_id input").value = f?.custom_id || ""
									else if (newChild.classList?.contains("label")) newChild.querySelector(".label input").value = f?.label || ""
									else if (newChild.classList?.contains("placeholder")) newChild.querySelector(".placeholder input").value = f?.placeholder || ""
									else if (newChild.classList?.contains("editComponentStyle")) newChild.value = f?.style || 1
									else if (newChild.classList?.contains("url")) newChild.querySelector(".url input").value = f?.url || ""
									else if (newChild.classList?.contains("emoji")) newChild.querySelector(".emoji input").value = f?.emoji?.id || f?.emoji?.name || ""

									/*
									edit.querySelector(".editSelectMenuMinValues").value = component?.min_values || 1
									edit.querySelector(".editSelectMenuMaxValues").value = component?.max_values || 1
									edit.querySelector(".editSelectMenuOptions").value = component?.options?.map(o => `${o.label}:${o.value}:${o.description}:${o.emoji?.id || ""}:${o.emoji?.name || ""}`).join("\n") || ""
									*/
								}
							}
						}
					}

					guiActionRow.appendChild(guiActionRowTemplate.querySelector(".addComponent").cloneNode(true))
				}
			}
		}

		const addComponentClickListener = e => {
			e.addEventListener("click", () => {
				if (e?.classList.contains("active")) {
					if (getSelection().anchorNode != e) e.classList.remove("active")
				} else if (e) {
					const inlineField = e.closest(".inlineField")
					const input = e.nextElementSibling?.querySelector("input[type='text']")
					const txt = e.nextElementSibling?.querySelector("textarea")

					e.classList.add("active")
					if (e.classList.contains("guiEmbedName")) return changeLastActiveGuiEmbed(guiEmbedIndex(e))

					else if (inlineField) inlineField.querySelector(".ttle~input").focus()

					else if (e.classList.contains("footer")) {
						const date = new Date(jsonObject.embeds[guiEmbedIndex(e)]?.timestamp || new Date())
						const textElement = e.nextElementSibling.querySelector("svg>text")
						const dateInput = textElement.closest(".footerDate").querySelector("input")

						return (
							textElement.textContent = (date.getDate() + "").padStart(2, 0),
							dateInput.value = date.toISOString().substring(0, 19)
						)
					} else if (input) {
						if (!smallerScreen.matches) input.focus()
						input.selectionStart = input.selectionEnd = input.value.length
					} else if (txt && !smallerScreen.matches) txt.focus()

					if (e.classList.contains("fields")) {
						if (reverseColumns && smallerScreen.matches) return e.parentNode.scrollTop = e.offsetTop

						e.scrollIntoView({ behavior: "smooth", block: "center" })
					}
				}
			})
		}
		for (const e of document.querySelectorAll(".top>.gui .item")) addComponentClickListener(e)

		// Scroll into view when tabs are opened in the GUI.
		const lastTabs = new Set(Array.from(document.querySelectorAll(".footer.rows2, .image.largeImg")))
		const requiresView = matchMedia(`${smallerScreen.media}, (max-height: 845px)`)
		const addGuiEventListeners = () => {
			for (const e of document.querySelectorAll(".gui .item:not(.fields)"))
				e.onclick = () => {
					if (lastTabs.has(e) || requiresView.matches) {
						if (!reverseColumns || !smallerScreen.matches)
							e.scrollIntoView({ behavior: "smooth", block: "center" })
						else if (e.nextElementSibling.classList.contains("edit") && e.classList.contains("active"))
							e.parentNode.scrollTop = e.offsetTop
					}
				}

			for (const e of document.querySelectorAll(".addField"))
				e.onclick = () => {
					const guiEmbed = e.closest(".guiEmbed")
					const indexOfGuiEmbed = Array.from(gui.querySelectorAll(".guiEmbed")).indexOf(guiEmbed)
					if (indexOfGuiEmbed == -1) return error("Could not find the embed to add the field to.")

					const fieldsObj = (jsonObject.embeds[indexOfGuiEmbed] ??= {}).fields ??= []
					if (fieldsObj.length >= 25) return error("An embed cannot have more than 25 fields!")
					fieldsObj.push({ name: "Field name", value: "Field value", inline: false })

					const newField = guiEmbed?.querySelector(".item.fields+.edit>.fields")?.appendChild(fieldFragment.firstChild.cloneNode(true))

					buildEmbed()
					addGuiEventListeners()

					newField.scrollIntoView({ behavior: "smooth", block: "center" })
					if (!smallerScreen.matches) {
						const firstFieldInput = newField.querySelector(".designerFieldName input")

						firstFieldInput?.setSelectionRange(firstFieldInput.value.length, firstFieldInput.value.length)
						firstFieldInput?.focus()
					}
				}

			for (const e of document.querySelectorAll(".addComponent"))
				e.onclick = () => {
					const guiActionRow = e.closest(".guiActionRow")
					const indexOfGuiActionRow = Array.from(gui.querySelectorAll(".guiActionRow")).indexOf(guiActionRow)
					if (indexOfGuiActionRow == -1) return error("Could not find the row to add the field to.")

					const componentsObj = jsonObject.components ? (jsonObject.components[indexOfGuiActionRow] ??= {}).components ??= [] : []
					if (componentsObj.length >= 5) return error("An action row cannot have more than 5 components!")
					componentsObj.push({custom_id: "custom_", label: "Button", type: 1, style: 1, disabled: false})
					if (!jsonObject.components) jsonObject.components = [{components: componentsObj}]

					const newComponent = guiActionRow.insertBefore(componentFragment.firstChild.cloneNode(true), guiActionRow.querySelector(".addComponent"))
					newComponent.querySelector(".edit .componentInnerTemplate").removeAttribute("hidden")

					buildEmbed()
					addGuiEventListeners()
					for (const item of newComponent.querySelectorAll(".top>.gui .item")) addComponentClickListener(item)

					newComponent.scrollIntoView({ behavior: "smooth", block: "center" })
					if (!smallerScreen.matches) {
						const firstFieldInput = newComponent.querySelector(".editComponentLabel")

						firstFieldInput?.setSelectionRange(firstFieldInput.value.length, firstFieldInput.value.length)
						firstFieldInput?.focus()
					}
				}

			for (const e of document.querySelectorAll(".fields .field .removeBtn"))
				e.onclick = () => {
					const embedIndex = guiEmbedIndex(e)
					const fieldIndex = Array.from(e.closest(".fields").children).indexOf(e.closest(".field"))

					if (jsonObject.embeds[embedIndex]?.fields[fieldIndex] == -1)
						return error("Failed to the field to remove.")

					jsonObject.embeds[embedIndex].fields.splice(fieldIndex, 1)

					buildEmbed()
					e.closest(".field").remove()
				}

			for (const e of document.querySelectorAll(".guiActionRow .guiComponent .removeBtn"))
				e.onclick = () => {
					const rowIndex = guiActionRowIndex(e)
					const componentIndex = Array.from(e.closest(".guiActionRow").children).indexOf(e.closest(".guiComponent"))

					if (jsonObject.components[rowIndex]?.components[componentIndex] == -1)
						return error("Failed to find the component to remove.")

					jsonObject.components[rowIndex].components.splice(componentIndex, 1)

					buildEmbed()
					e.closest(".guiComponent").remove()
				}

			for (const e of gui.querySelectorAll("textarea, input, select"))
				e.oninput = el => {
					const value = el.target.value
					const index = guiEmbedIndex(el.target)
					const field = el.target.closest(".field")
					const fields = field?.closest(".fields")
					const embedObj = jsonObject.embeds[index] ??= {}

					const rowindex = guiActionRowIndex(el.target)
					const componentindex = guiComponentIndex(el.target)
					const actionRowObj = jsonObject.components && rowindex >= 0 ? jsonObject.components[rowindex] ??= {} : {}
					let componentObj = {}
					if (actionRowObj.components) actionRowObj.components.forEach((component, i) => {
						if (i == componentindex) componentObj = component
					})

					if (field) {
						const fieldIndex = Array.from(fields.children).indexOf(field)
						const jsonField = embedObj.fields[fieldIndex]
						const embedFields = document.querySelectorAll(".container>.embed")[index]?.querySelector(".embedFields")

						if (jsonField) {
							if (el.target.type === "text") jsonField.name = value
							else if (el.target.type === "textarea") jsonField.value = value
							else jsonField.inline = el.target.checked
							createEmbedFields(embedObj.fields, embedFields)
						}
					} else {
						switch (el.target.classList?.[0]) {
							case "editContent":
								jsonObject.content = value
								buildEmbed({ only: "content" })
								break

							case "editTitle":
								embedObj.title = value
								const guiEmbedName = el.target.closest(".guiEmbed")?.previousElementSibling
								if (guiEmbedName?.classList.contains("guiEmbedName"))
									guiEmbedName.querySelector(".text").innerHTML = `${guiEmbedName.innerText.split(":")[0]}${value ? `: <span>${value}</span>` : ""}`
								buildEmbed({ only: "embedTitle", index: guiEmbedIndex(el.target) })
								break
							case "editAuthorName":
								embedObj.author ??= {}
								embedObj.author.name = value
								buildEmbed({ only: "embedAuthorName", index: guiEmbedIndex(el.target) })
								break
							case "editAuthorLink":
								embedObj.author ??= {}
								embedObj.author.icon_url = value
								imgSrc(el.target.previousElementSibling, value)
								buildEmbed({ only: "embedAuthorLink", index: guiEmbedIndex(el.target) })
								break
							case "editDescription":
								embedObj.description = value
								buildEmbed({ only: "embedDescription", index: guiEmbedIndex(el.target) })
								break
							case "editThumbnailLink":
								embedObj.thumbnail ??= {}
								embedObj.thumbnail.url = value
								imgSrc(el.target.closest(".editIcon").querySelector(".imgParent"), value)
								buildEmbed({ only: "embedThumbnail", index: guiEmbedIndex(el.target) })
								break
							case "editImageLink":
								embedObj.image ??= {}
								embedObj.image.url = value
								imgSrc(el.target.closest(".editIcon").querySelector(".imgParent"), value)
								buildEmbed({ only: "embedImageLink", index: guiEmbedIndex(el.target) })
								break
							case "editFooterText":
								embedObj.footer ??= {}
								embedObj.footer.text = value
								buildEmbed({ only: "embedFooterText", index: guiEmbedIndex(el.target) })
								break
							case "editFooterLink":
								embedObj.footer ??= {}
								embedObj.footer.icon_url = value
								imgSrc(el.target.previousElementSibling, value)
								buildEmbed({ only: "embedFooterLink", index: guiEmbedIndex(el.target) })
								break
							case "embedFooterTimestamp":
								const date = new Date(value)
								if (isNaN(date.getTime())) return error("Invalid date")

								embedObj.timestamp = date.getTime()
								el.target.parentElement.querySelector("svg>text").textContent = (date.getDate() + "").padStart(2, 0)
								buildEmbed({ only: "embedFooterTimestamp", index: guiEmbedIndex(el.target) })
								break

							case "editComponentLabel":
								componentObj.label = value
								buildEmbed({ only: "componentLabel", index: guiComponentIndex(el.target) })
								break
							case "editComponentStyle":
								componentObj.style = parseInt(value)
								buildEmbed({ only: "componentStyle", index: guiComponentIndex(el.target) })
								break
							case "editComponentEmoji":
								componentObj.emoji = value
								buildEmbed({ only: "componentEmoji", index: guiComponentIndex(el.target) })
								break
							case "editComponentURL":
								componentObj.url = value
								buildEmbed({ only: "componentURL", index: guiComponentIndex(el.target) })
								break
							case "disableCheck":
								componentObj.disabled = el.target.checked
								buildEmbed({ only: "componentDisabled", index: guiComponentIndex(el.target) })
								break
						}

						// Find and filter out any empty objects ({}) in the embeds array as Discord doesn't like them.
						const nonEmptyEmbedObjects = json.embeds?.filter(o => 0 in Object.keys(o))
						if (nonEmptyEmbedObjects?.length) json.embeds = nonEmptyEmbedObjects

						const nonEmptyComponentObjects = json.components?.filter(o => 0 in Object.keys(o))
						if (nonEmptyComponentObjects?.length) json.components = nonEmptyComponentObjects
					}

					// Display embed elements hidden due to not having content. '.msgEmbed>.container' is embed container.
					document.querySelectorAll(".msgEmbed>.container")[guiEmbedIndex(el.target)]?.querySelector(".emptyEmbed")?.classList.remove("emptyEmbed")
				}

			for (const browse of document.querySelectorAll(".browse"))
				browse.onclick = () => {
					const formData = new FormData()
					const fileInput = createElement({ input: { type: "file", accept: "image/*" } })
					const edit = browse.closest(".edit")
					const expiration = 7 * 24 * 60 * 60

					fileInput.onchange = el => {
						if (el.target.files[0].size > 32 * 1024 * 1024)
							return uploadError("File is too large. Maximum size is 32 MB.", browse, 5000)

						formData.append("expiration", expiration) // Expire after 7 days. Discord caches files.
						formData.append("key", "247664c78b4606093dc9a510037483e0")
						formData.append("image", el.target.files[0])

						browse.classList.add("loading")

						fetch("https://api.imgbb.com/1/upload", { method: "POST", body: formData })
							.then(res => res.json())
							.then(res => {
								browse.classList.remove("loading")
								if (!res.success) {
									console.log("Upload failed:", res.data?.error || res.error?.message || res)
									return uploadError(res.data?.error || res.error?.message || "Request failed. (Check dev-console)", browse)
								}

								imgSrc(edit.querySelector(".editIcon > .imgParent"), res.data.url)
								const linkInput = edit.querySelector("input[type=text]")
								const textInput = edit.querySelector("input[class$=Name], input[class$=Text]")

								linkInput.value = res.data.url
								// focus on the next empty input if the field requires a name or text to display eg. footer or author.
								if (!textInput?.value) textInput?.focus()

								console.info(`${res.data.url} will be deleted in ${expiration / 60 / 60} hours. To delete it now, visit ${res.data.delete_url} and scroll down to find the delete button.`)

								linkInput.dispatchEvent(new Event("input"))
							}).catch(err => {
								browse.classList.remove("loading")
								error(`Request failed with error: ${err}`)
							})
					}

					fileInput.click()
				}

			for (const e of document.querySelectorAll(".guiEmbed"))
				e.onclick = () => {
					const guiEmbed = e.closest(".guiEmbed")
					const indexOfGuiEmbed = Array.from(gui.querySelectorAll(".guiEmbed")).indexOf(guiEmbed)
					if (indexOfGuiEmbed == -1) return error("Could not find the embed to add the field to.")

					changeLastActiveGuiEmbed(indexOfGuiEmbed)
				}
			for (const e of document.querySelectorAll(".guiActionRow"))
				e.onclick = () => {
					const guiActionRow = e.closest(".guiActionRow")
					const indexOfGuiActionRow = Array.from(gui.querySelectorAll(".guiActionRow")).indexOf(guiActionRow)
					if (indexOfGuiActionRow == -1) return error("Could not find the action row to add the component to.")
				}

			if (!jsonObject.embeds[lastActiveGuiEmbedIndex])
				changeLastActiveGuiEmbed(
					jsonObject.embeds[lastActiveGuiEmbedIndex - 1] ?
						lastActiveGuiEmbedIndex - 1 :
						(jsonObject.embeds.length ? 0 : -1)
				)
		}

		addGuiEventListeners()

		if (opts.guiEmbedIndex) {
			const activeGuiEmbed = Array.from(document.querySelectorAll(".gui .item.guiEmbedName"))[opts.guiEmbedIndex]
			activeGuiEmbed?.classList.add("active")
		}
		if (opts.guiActionRowIndex) {
			const activeGuiActionRow = Array.from(document.querySelectorAll(".gui .item.guiActionRowName"))[opts.guiActionRowIndex]
			activeGuiActionRow?.classList.add("active")
		}

		if (opts.activateClassNames)
			for (const cName of opts.activateClassNames)
				for (const e of document.getElementsByClassName(cName)) e.classList.add("active")

		else if (opts.guiTabs) {
			const tabs = opts.guiTabs.split?.(/, */) || opts.guiTabs
			const bottomKeys = new Set(["footer", "image"])
			const topKeys = new Set(["author", "content"])

			// Deactivate the default activated GUI fields
			for (const e of gui.querySelectorAll(".item:not(.guiEmbedName).active")) e.classList.remove("active")

			// Activate wanted GUI fields
			for (const e of document.querySelectorAll(`.${tabs.join(", .")}`)) e.classList.add("active")

			// Autoscroll GUI to the bottom if necessary.
			if (!tabs.some(item => topKeys.has(item)) && tabs.some(item => bottomKeys.has(item))) {
				const gui2 = document.querySelector(".top .gui")
				gui2.scrollTo({ top: gui2.scrollHeight })
			}
		} else if (opts.activate)
			for (const clss of Array.from(opts.activate).map(el => el.className).map(cls => "." + cls.split(" ").slice(0, 2).join(".")))
				for (const e of document.querySelectorAll(clss))
					e.classList.add("active")

		else for (const clss of document.querySelectorAll(".item.author, .item.description"))
			clss.classList.add("active")
	}

	buildGui(jsonObject, { guiTabs })
	gui.classList.remove("hidden")

	// Renders embed and message content.
	buildEmbed = ({ jsonData, only, index = 0 } = {}) => {
		if (jsonData) json = jsonData
		if (!jsonObject.embeds?.length) document.body.classList.add("emptyEmbed")

		try {
			// If there's no message content, hide the message content HTML element.
			if (jsonObject.content) {
				embedContent.innerHTML = markup(encode(jsonObject.content), { replaceEmojis: true, replaceHeaders: true })
				document.body.classList.remove("emptyContent")
			} else document.body.classList.add("emptyContent")

			const embed = document.querySelectorAll(".container>.embed")[index]
			const embedObj = jsonObject.embeds[index]

			if (only && (!embed || !embedObj)) return buildEmbed()

			switch (only) {
				// If only updating the message content and nothing else, return here.
				case "content": return externalParsing({ element: embedContent })
				case "embedTitle":
					const embedTitle = embed?.querySelector(".embedTitle")
					if (!embedTitle) return buildEmbed()
					if (embedObj.title) display(embedTitle, markup(embedObj.url ? '<a class="anchor" target="_blank" href="' + encode(url(embedObj.url)) + '">' + encode(embedObj.title) + "</a>" :
						encode(embedObj.title), { replaceEmojis: true, inlineBlock: true }))
					else hide(embedTitle)

					return externalParsing({ element: embedTitle })
				case "embedAuthorName":
				case "embedAuthorLink":
					const embedAuthor = embed?.querySelector(".embedAuthor")
					if (!embedAuthor) return buildEmbed()
					if (embedObj.author?.name) display(embedAuthor, `
						${embedObj.author.icon_url ? '<img class="embedAuthorIcon embedAuthorLink" src="' + encode(url(embedObj.author.icon_url)) + '">' : ""}
						${embedObj.author.url ? '<a class="embedAuthorNameLink embedLink embedAuthorName" href="' + encode(url(embedObj.author.url)) + '" target="_blank">' +
							encode(embedObj.author.name) + "</a>" : '<span class="embedAuthorName">' + encode(embedObj.author.name) + "</span>"}`, "flex")
					else hide(embedAuthor)

					return externalParsing({ element: embedAuthor })
				case "embedDescription":
					const embedDescription = embed?.querySelector(".embedDescription")
					if (!embedDescription) return buildEmbed()
					if (embedObj.description) display(embedDescription, markup(encode(embedObj.description), { replaceEmojis: true, replaceHeaders: true }))
					else hide(embedDescription)

					return externalParsing({ element: embedDescription })
				case "embedThumbnail":
					const embedThumbnailLink = embed?.querySelector(".embedThumbnailLink")
					if (!embedThumbnailLink) return buildEmbed()
					const pre = embed.querySelector(".embedGrid .markup pre")
					if (embedObj.thumbnail?.url) {
						embedThumbnailLink.src = "https://api.tomatenkuchen.com/image-proxy?url=" + encode(url(embedObj.thumbnail.url))
						embedThumbnailLink.parentElement.style.display = "block"
						if (pre) pre.style.maxWidth = "90%"
					} else {
						hide(embedThumbnailLink.parentElement)
						pre?.style.removeProperty("max-width")
					}

					return afterBuilding()
				case "embedImage":
					const embedImageLink = embed?.querySelector(".embedImageLink")
					if (!embedImageLink) return buildEmbed()
					if (embedObj.image?.url) {
						embedImageLink.src = "https://api.tomatenkuchen.com/image-proxy?url=" + encode(url(embedObj.image.url))
						embedImageLink.parentElement.style.display = "block"
					} else hide(embedImageLink.parentElement)

					return afterBuilding()
				case "embedFooterText":
				case "embedFooterLink":
				case "embedFooterTimestamp":
					const embedFooter = embed?.querySelector(".embedFooter")
					if (!embedFooter) return buildEmbed()
					if (embedObj.footer?.text || embedObj.timestamp) display(embedFooter, `
						${embedObj.footer.icon_url ? '<img class="embedFooterIcon embedFooterLink" src="' + encode(url(embedObj.footer.icon_url)) + '">' : ""}<span class="embedFooterText">
						${encode(embedObj.footer.text)}
						${embedObj.timestamp ? '<span class="embedFooterSeparator">•</span>' + encode(timestamp(embedObj.timestamp)) : ""}</span></div>`, "flex")
					else hide(embedFooter)

					return externalParsing({ element: embedFooter })
			}

			embedCont.innerHTML = ""
			for (const currentObj of jsonObject.embeds) {
				const embedElement = embedCont.appendChild(embedFragment.firstChild.cloneNode(true))
				const embedGrid = embedElement.querySelector(".embedGrid")
				const embedTitle = embedElement.querySelector(".embedTitle")
				const embedDescription = embedElement.querySelector(".embedDescription")
				const embedAuthor = embedElement.querySelector(".embedAuthor")
				const embedFooter = embedElement.querySelector(".embedFooter")
				const embedImage = embedElement.querySelector(".embedImage > img")
				const embedThumbnail = embedElement.querySelector(".embedThumbnail > img")
				const embedFields = embedElement.querySelector(".embedFields")

				if (currentObj.title) display(embedTitle, markup(`${currentObj.url ? '<a class="anchor" target="_blank" href="' + encode(url(currentObj.url)) + '">' + encode(currentObj.title) + "</a>" : encode(currentObj.title)}`, { replaceEmojis: true, inlineBlock: true }))
				else hide(embedTitle)

				if (currentObj.description) display(embedDescription, markup(encode(currentObj.description), { replaceEmojis: true, replaceHeaders: true }))
				else hide(embedDescription)

				if (currentObj.color) embedGrid.closest(".embed").style.borderColor = typeof currentObj.color == "number" ? "#" + currentObj.color.toString(16).padStart(6, "0") : currentObj.color
				else embedGrid.closest(".embed").style.removeProperty("border-color")

				if (currentObj.author?.name) display(embedAuthor, `
					${currentObj.author.icon_url ? '<img class="embedAuthorIcon embedAuthorLink" src="' + encode(url(currentObj.author.icon_url)) + '">' : ""}
					${currentObj.author.url ? '<a class="embedAuthorNameLink embedLink embedAuthorName" href="' + encode(url(currentObj.author.url)) + '" target="_blank">' +
					encode(currentObj.author.name) + "</a>" : '<span class="embedAuthorName">' + encode(currentObj.author.name) + "</span>"}`, "flex")
				else hide(embedAuthor)

				const pre = embedGrid.querySelector(".markup pre")
				if (currentObj.thumbnail?.url) {
					embedThumbnail.src = "https://api.tomatenkuchen.com/image-proxy?url=" + encode(url(currentObj.thumbnail.url))
					embedThumbnail.parentElement.style.display = "block"
					if (pre) pre.style.maxWidth = "90%"
				} else {
					hide(embedThumbnail.parentElement)
					if (pre) pre.style.removeProperty("max-width")
				}

				if (currentObj.image?.url) {
					embedImage.src = "https://api.tomatenkuchen.com/image-proxy?url=" + encode(url(currentObj.image.url))
					embedImage.parentElement.style.display = "block"
				} else hide(embedImage.parentElement)

				if (currentObj.footer?.text) display(embedFooter, `
					${currentObj.footer.icon_url ? '<img class="embedFooterIcon embedFooterLink" src="https://api.tomatenkuchen.com/image-proxy?url=' + encode(url(currentObj.footer.icon_url)) + '">' : ""}
					<span class="embedFooterText">${encode(currentObj.footer.text)}
					${currentObj.timestamp ? '<span class="embedFooterSeparator">•</span>' + encode(timestamp(currentObj.timestamp)) : ""}</span></div>`, "flex")
				else if (currentObj.timestamp)
					display(embedFooter, `<span class="embedFooterText">${encode(timestamp(currentObj.timestamp))}</span></div>`, "flex")
				else hide(embedFooter)

				if (currentObj.fields) createEmbedFields(currentObj.fields, embedFields)
				else hide(embedFields)

				document.body.classList.remove("emptyEmbed")
				externalParsing()

				if (embedElement.innerText.trim() || embedElement.querySelector(".embedGrid > [style*=display] img"))
					embedElement.classList.remove("emptyEmbed")
				else embedElement.classList.add("emptyEmbed")
			}

			actionRowCont.innerHTML = ""
			if (jsonObject.components) for (const actionRow of jsonObject.components) {
				const actionRowElement = actionRowCont.appendChild(actionRowFragment.firstChild.cloneNode(true))

				if (actionRow.components) for (const component of actionRow.components) {
					if (component.style == 5 && component.url) {
						const buttonElement = document.createElement("button")
						buttonElement.classList.add("b-" + buttonStyles[component.style])
						buttonElement.dataset.style = component.style
						buttonElement.title = encode(url(component.url))

						if (component.disabled) buttonElement.classList.add("disabled")
						else buttonElement.onclick = () => window.open(url(component.url), "_blank", "noopener")

						buttonElement.innerHTML = encode(component.label) +
							// From Discord's client source code
							"<svg aria-hidden='true' role='img' width='16' height='16' viewBox='0 0 24 24'>" +
							"<path fill='currentColor' d='M10 5V3H5.375C4.06519 3 3 4.06519 3 5.375V18.625C3 19.936 4.06519 21 5.375 21H18.625C19.936 21 21 19.936 21 18.625V14H19V19H5V5H10Z'></path>" +
							"<path fill='currentColor' d='M21 2.99902H14V4.99902H17.586L9.29297 13.292L10.707 14.706L19 6.41302V9.99902H21V2.99902Z'></path></svg>"

						actionRowElement.appendChild(buttonElement)
					} else {
						const buttonElement = document.createElement("button")

						if (component.style) {
							buttonElement.classList.add("b-" + buttonStyles[component.style])
							buttonElement.dataset.style = component.style
						}
						if (component.disabled) buttonElement.classList.add("disabled")
						if (component.custom_id && component.style != 5) buttonElement.dataset.custom_id = component.custom_id
						if (component.emoji) {
							let emojiElement
							if (/^[0-9]{17,21}$/.test(component.emoji.id || component.emoji)) {
								emojiElement = document.createElement("img")
								emojiElement.src = "https://cdn.discordapp.com/emojis/" + encode(component.emoji.id || component.emoji) + ".webp?size=16"
							} else if (component.emoji.name) {
								emojiElement = document.createElement("span")
								emojiElement.innerText = component.emoji.name
							}
							if (emojiElement) buttonElement.appendChild(emojiElement)
						}
						if (component.label) {
							const label = document.createElement("span")
							label.innerText = component.label
							buttonElement.appendChild(label)
						}

						if (component.type == 3 || (component.type >= 5 && component.type <= 8)) {
							buttonElement.classList.add("select")

							const svgSelect = document.createElement("div")
							svgSelect.innerHTML = "<svg aria-hidden='true' role='img' width='24' height='24' viewBox='0 0 24 24'><path fill='currentColor' d='M16.59 8.59003L12 13.17L7.41 8.59003L6 " +
								"10L12 16L18 10L16.59 8.59003Z'></path></svg>" + encode(component.placeholder)
							buttonElement.appendChild(svgSelect)
						}

						actionRowElement.appendChild(buttonElement)
					}
				}
			}

			afterBuilding()
		} catch (e) {
			console.error(e)
			error(e)
		}
	}

	editor.on("change", editor => {
		// If the editor value is not set by the user, return.
		if (JSON.stringify(json, null, 4) == editor.getValue()) return

		try {
			// Autofill when " is typed on new line
			const line = editor.getCursor().line
			const text = editor.getLine(line)

			if (text.trim() == '"') {
				editor.replaceRange(text.trim() + ":", { line, ch: line.length })
				editor.setCursor(line, text.length)
			}

			json = JSON.parse(editor.getValue())
			const dataKeys = Object.keys(json)

			if (dataKeys.length && !allJsonKeys.some(key => dataKeys.includes(key))) {
				const usedKeys = dataKeys.filter(key => !allJsonKeys.includes(key))
				if (usedKeys.length > 2)
					return error(`'${usedKeys[0] + "', '" + usedKeys.slice(1, -1).join("', '")}', and '${usedKeys.at(-1)}' are invalid keys.`)
				return error(`'${usedKeys.length == 2 ? usedKeys[0] + "' and '" + usedKeys.at(-1) + "' are invalid keys." : usedKeys[0] + "' is an invalid key."}`)
			}

			buildEmbed()
		} catch {
			if (editor.getValue()) return
			document.body.classList.add("emptyEmbed")
			embedContent.innerHTML = ""
		}
	})

	const picker = new CP(document.querySelector(".picker"), state = { parent: document.querySelector(".cTop") })

	picker.fire?.("change", toRGB("#41f097"))

	const colors = document.querySelector(".colors")
	const hexInput = colors?.querySelector(".hex>div input")

	let typingHex = true
	let exit = false

	removePicker = () => {
		if (exit) return exit = false
		if (typingHex) picker.enter()
		else {
			typingHex = false
			exit = true
			colors.classList.remove("picking")
			picker.exit()
		}
	}

	document.querySelector(".colBack")?.addEventListener("click", () => {
		picker.self.remove()
		typingHex = false
		removePicker()
	})

	picker.on?.("exit", removePicker)
	picker.on?.("enter", () => {
		const embedIndex = lastActiveGuiEmbedIndex == -1 ? 0 : lastActiveGuiEmbedIndex
		if (jsonObject?.embeds[embedIndex]?.color) {
			hexInput.value = jsonObject.embeds[embedIndex].color.toString(16).padStart(6, "0")
			document.querySelector(".hex.incorrect")?.classList.remove("incorrect")
		}
		colors.classList.add("picking")
	})

	document.querySelectorAll(".color").forEach(e => e.addEventListener("click", el => {
		const embedIndex = lastActiveGuiEmbedIndex == -1 ? 0 : lastActiveGuiEmbedIndex
		const embed = document.querySelectorAll(".msgEmbed .container>.embed")[embedIndex]
		const embedObj = jsonObject.embeds[embedIndex] ??= {}
		const color = el.target.closest(".color")

		embedObj.color = toRGB(color.style.backgroundColor, false, true)
		if (embed) embed.style.borderColor = color.style.backgroundColor
		picker.source.style.removeProperty("background")
	}))

	hexInput?.addEventListener("focus", () => typingHex = true)
	setTimeout(() => {
		picker.on?.("change", (r, g, b) => {
			const embedIndex = lastActiveGuiEmbedIndex == -1 ? 0 : lastActiveGuiEmbedIndex
			const embed = document.querySelectorAll(".msgEmbed .container>.embed")[embedIndex]
			const embedObj = jsonObject.embeds[embedIndex]

			const hex = r.toString(16) + g.toString(16) + b.toString(16)
			embedObj.color = parseInt(hex, 16)
			picker.source.style.background = "#" + hex.padStart(6, "0")
			embed.style.borderColor = "#" + hex.padStart(6, "0")
			hexInput.value = "#" + hex.padStart(6, "0")
		})
	}, 1000)

	document.querySelector(".timeText").innerText = timestamp()

	for (const block of document.querySelectorAll(".markup pre > code")) hljs.highlightBlock(block)

	let pickInGuiMode = false
	document.querySelector(".opt.gui").addEventListener("click", () => {
		if (lastGuiJson && lastGuiJson !== JSON.stringify(json, null, 4)) buildGui()
		lastGuiJson = false

		document.body.classList.add("gui")
		if (pickInGuiMode) {
			pickInGuiMode = false
			togglePicker()
		}
	})

	document.querySelector(".opt.json").addEventListener("click", () => {
		const emptyEmbedIndex = indexOfEmptyGuiEmbed(false)
		if (emptyEmbedIndex !== -1)
			// Clicked GUI tab while a blank embed is added from GUI.
			return error(gui.querySelectorAll(".item.guiEmbedName")[emptyEmbedIndex].innerText.split(":")[0] + " should not be empty.", "3s")

		const jsonStr = JSON.stringify(json, null, 4)
		lastGuiJson = jsonStr

		document.body.classList.remove("gui")
		editor.setValue(jsonStr === "{}" ? "{\n\t\n}" : jsonStr)
		editor.refresh()
		editor.focus()

		if (document.querySelector("section.side1.low")) togglePicker(true)
	})

	document.querySelector(".clear").addEventListener("click", () => {
		json = {}

		picker.source.style.removeProperty("background")
		document.querySelector(".msgEmbed .container>.embed")?.remove()

		buildEmbed()
		buildGui()

		const jsonStr = JSON.stringify(json, null, 4)
		editor.setValue(jsonStr === "{}" ? "{\n\t\n}" : jsonStr)

		for (const e of document.querySelectorAll(".gui .item")) e.classList.add("active")

		if (!smallerScreen.matches) document.getElementsByClassName("editContent")[0].focus()
	})
	document.querySelector(".import").addEventListener("click", () => socket.send(JSON.stringify({action: "import"})))
	document.querySelector(".sendbot").addEventListener("click", () => socket.send(JSON.stringify({action: "send", content: json.content, embeds: json.embeds, components: json.components})))

	document.querySelector(".copy").addEventListener("click", () => {
		const jsonData = JSON.stringify(json, null, 4)

		if (!navigator.clipboard?.writeText(jsonData).catch(err => console.log("Could not copy to clipboard: " + err.message))) {
			const textarea = document.body.appendChild(document.createElement("textarea"))

			textarea.value = jsonData
			textarea.select()
			textarea.setSelectionRange(0, 50000)
			document.execCommand("copy")
			document.body.removeChild(textarea)
		}
	})

	document.querySelector(".top-btn.menu")?.addEventListener("click", async e => {
		if (e.target.closest(".item.dataLink")) {
			let data = encodeJson(json, true).replace(/(?<!data=[^=]+|=)=(&|$)/g, x => x === "=" ? "" : "&")
			if (data.length > 2000) {
				const name = Math.random().toString(36).slice(5)
				const shorterres = await fetch("https://shorter.cf", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						name,
						url: data,
						date: Date.now() + 1000 * 60 * 60 * 24 * 5
					})
				})
				const shorterjson = await shorterres.json()
				console.log("Response from https://shorter.cf:", shorterjson)
				data = "https://shorter.cf/" + shorterjson.name
			}

			try {
				// Clipboard API might only work on HTTPS protocol.
				navigator.clipboard.writeText(data)
			} catch {
				const input = document.body.appendChild(document.createElement("input"))
				input.value = data
				input.select()
				document.setSelectionRange(0, 30000)
				document.execCommand("copy")
				document.body.removeChild(input)
			}

			setTimeout(() => alert("Copied to clipboard." + (data.length > 2000 ? " URL was shortened to work in the embed command." : "")), 1)
			return
		}

		if (e.target.closest(".item.sendwebhook")) {
			const webhook = prompt("Enter webhook URL to send the message to.")

			if (webhook) {
				const webhookres = await fetch(webhook, {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify(json)
				})
				if (!webhookres.ok) {
					const webhookjson = await webhookres.json()
					console.error(webhookjson)
					return error("Request failed with error: " + webhookres.statusText)
				}
			}
		}

		if (e.target.closest(".item.download"))
			return createElement({ a: { download: "embed-" + new Date().toLocaleTimeString() + ".json", href: "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json, null, 4)) } }).click()

		const input = e.target.closest(".item")?.querySelector("input")
		if (input) input.checked = !input.checked

		if (e.target.closest(".item.auto")) {
			autoUpdateURL = document.body.classList.toggle("autoUpdateURL")
			if (autoUpdateURL) localStorage.setItem("autoUpdateURL", true)
			else localStorage.removeItem("autoUpdateURL")
			urlOptions({ set: ["data", encodeJson(json)] })
		} else if (e.target.closest(".item.reverse")) {
			reverse(reverseColumns)
			reverseColumns = !reverseColumns
			toggleStored("reverseColumns")
		} else if (e.target.closest(".toggles>.item")) {
			const win = input.closest(".item").classList[2]

			if (input.checked) {
				document.body.classList.remove("no-" + win)
				localStorage.removeItem("hide" + win)
			} else {
				document.body.classList.add("no-" + win)
				localStorage.setItem("hide" + win, true)
			}
		}

		e.target.closest(".top-btn")?.classList.toggle("active")
	})

	document.querySelectorAll(".img").forEach(e => {
		if (e.nextElementSibling?.classList.contains("spinner-container"))
			e.addEventListener("error", el => {
				el.target.style.removeProperty("display")
				el.target.nextElementSibling.style.display = "block"
			})
	})

	togglePicker = pickLater => {
		colors.classList.toggle("display")
		document.querySelector(".side1").classList.toggle("low")
		if (pickLater) pickInGuiMode = true
	}

	document.querySelector(".pickerToggle").addEventListener("click", () => togglePicker())
	buildEmbed()

	document.body.addEventListener("click", e => {
		if (e.target.classList.contains("low") || (e.target.classList.contains("top") && colors.classList.contains("display")))
			togglePicker()
	})

	document.querySelector(".colors .hex>div")?.addEventListener("input", e => {
		let inputValue = e.target.value

		if (inputValue.startsWith("#")) {
			e.target.value = inputValue.slice(1)
			inputValue = e.target.value
		}
		if (inputValue.length !== 6 || !/^[a-zA-Z0-9]{6}$/g.test(inputValue))
			return e.target.closest(".hex").classList.add("incorrect")

		e.target.closest(".hex").classList.remove("incorrect")

		const embedIndex = lastActiveGuiEmbedIndex == -1 ? 0 : lastActiveGuiEmbedIndex
		jsonObject.embeds[embedIndex].color = parseInt(inputValue, 16)
		picker.fire?.("change", toRGB(inputValue))

		buildEmbed()
	})

	const menuMore = document.querySelector(".item.section .inner.more")
	if (menuMore.childElementCount < 2) menuMore?.classList.add("invisible")
	if (menuMore.parentElement.childElementCount < 1) menuMore?.parentElement.classList.add("invisible")
})

// Don't assign to 'jsonObject', assign to 'json' instead.
// 'jsonObject' is used to store the final json object and used internally.
// Below is the getter and setter for 'json' which formats the value properly into and out of 'jsonObject'.
Object.defineProperty(window, "json", {
	configurable: true,
	// Getter to format 'jsonObject' properly depending on options and other factors
	get() {
		const json = {}

		if (jsonObject.content) json.content = jsonObject.content

		// If 'jsonObject.embeds' array is set and has content. Empty braces ({}) will be filtered as not content.
		if (jsonObject.embeds?.length) json.embeds = jsonObject.embeds.map(cleanEmbed)

		if (jsonObject.components?.length) json.components = jsonObject.components

		return json
	},

	// Setter for 'json' which formats the value properly into 'jsonObject'.
	set(val) {
		// Filter out items which are not objects and not empty objects.
		const embedObjects = val.embeds?.filter(j => j.constructor === Object && 0 in Object.keys(j))
		// Convert 'embed' to 'embeds' and delete 'embed' or validate and use 'embeds' if provided.
		const embeds = val.embed ? [val.embed] : (embedObjects?.length ? embedObjects : [])
		// Convert objects used as values to string and trim whitespace.
		const content = val.content?.toString().trim()

		jsonObject = {
			...(content && { content }),
			embeds: embeds.map(cleanEmbed),
			components: val.components
		}

		buildEmbed()
		buildGui()
	}
})

const embedObjectsProps = {
	author: ["name", "url", "icon_url"],
	thumbnail: ["url", "proxy_url", "height", "width"],
	image: ["url", "proxy_url", "height", "width"],
	fields: { items: ["name", "value", "inline"] },
	footer: ["text", "icon_url"]
}

function cleanEmbed(obj, recursing = false) {
	if (!recursing)
		// Remove all invalid properties from embed object.
		for (const key in obj) {
			if (!embedKeys.includes(key)) delete obj[key]
			else if (obj[key].constructor === Object)
				// Remove items that are not in the props of the current key.
				for (const item in obj[key]) if (!embedObjectsProps[key].includes(item)) delete obj[key][item]
			else if (obj[key].constructor === Array)
				// Remove items that are not in the props of the current key.
				for (const field of obj[key])
					for (const i in field) if (!embedObjectsProps[key].items.includes(i)) delete field[i]
		}

	// Remove empty properties from embed object.
	for (const [key, val] of Object.entries(obj)) {
		if (val === void 0 || val.trim?.() == "")
			// Remove the key if value is empty
			delete obj[key]
		else if (val.constructor === Object) {
			// Remove object (val) if it has no keys or recursively remove empty keys from objects.
			if (Object.keys(val).length) obj[key] = cleanEmbed(val, true)
			else delete obj[key]
		} else if (val.constructor === Array) {
			// Remove array (val) if it has no keys or recursively remove empty keys from objects in array.
			if (val.length) obj[key] = val.map(k => cleanEmbed(k, true))
			else delete obj[key]
		} else
			// If object isn't a string, boolean, number, array or object, convert it to string.
			if (!["string", "boolean", "number"].includes(typeof val))
				obj[key] = val.toString()
	}

	return obj
}
