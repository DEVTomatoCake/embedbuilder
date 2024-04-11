const test = require("node:test")
const assert = require("node:assert")

const encode = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;")

const expectEqual = async (t, name = "", inputs = [], expected = "") => {
	if (!Array.isArray(inputs)) inputs = [inputs]

	let i = 1
	for await (const input of inputs) {
		await t.test(name + (inputs.length > 1 ? (" " + i++) : ""), () => {
			assert.strictEqual(input, expected)
		})
	}
}

const fs = require("node:fs").promises
const main = async () => {
	const scriptFile = await fs.readFile("./assets/script.js", "utf8")

	const emojisFile = await fs.readFile("./assets/emojis.js", "utf8")
	global.emojis = eval("(()=>{" + emojisFile + ";return emojis})()")

	test("Markdown", async t => {
		const funcStart = scriptFile.indexOf("const markup = ")
		const funcEnd = scriptFile.includes("\r\n}", funcStart) ? (scriptFile.indexOf("\r\n}", funcStart) + 3) : (scriptFile.indexOf("\n}", funcStart) + 2)

		const funcStr = scriptFile.substring(funcStart, funcEnd)
		const args = funcStr.split("\n")[0].replace("const markup = ", "").replace(" => {", "").trim().slice(1, -1)
		// eslint-disable-next-line no-new-func
		const markdown = (str, ...arg) => new Function(...args.split(", "), funcStr.split("\n").slice(1, -1).join("\n"))(encode(str), ...arg)

		await expectEqual(t, "Input is trimmed", markdown("   text \t\n\n \r\n"), "text")
		await expectEqual(t, "Empty string", markdown(""), "")

		await expectEqual(t, "Bold", markdown("**text**"), "<strong>text</strong>")
		await expectEqual(t, "Italic", [markdown("*text*"), markdown("_text_")], "<em>text</em>")
		await expectEqual(t, "Strikethrough", markdown("~~text !$=3@Ä🍅~~"), "<s>text !$=3@Ä🍅</s>")
		await expectEqual(t, "Underlined", markdown("_hi__text__"), "_hi<u>text</u>")
		await expectEqual(t, "Bold and italic combined", [markdown("***text***"), markdown("_**text**_")], "<em><strong>text</strong></em>")

		await expectEqual(t, "Bold, italic and underlined combined 1", markdown("***__text__***"), "<em><strong><u>text</u></strong></em>")
		await expectEqual(t, "Bold, italic and underlined combined 2", markdown("__***text***__"), "<u><em><strong>text</strong></em></u>")

		await expectEqual(t, "Spoiler", markdown("|| hello there|| ||"), "<span class='spoiler'> hello there</span> ||")

		await expectEqual(t, "Single quotes", markdown("> text"), "<div class='blockquote'><div class='blockquoteDivider'></div><blockquote>text</blockquote></div>")
		await expectEqual(t, "Block quotes", markdown(">>> text\nmore text\n\nless text D:"),
			"<div class='blockquote'><div class='blockquoteDivider'></div><blockquote>text\nmore text\n\nless text D:</blockquote></div>")

		await expectEqual(t, "Inline code block", markdown("text`code`"), "text<code class='inline'>code</code>")
		await expectEqual(t, "Inline code block requiring escaping", markdown("`code **normal text**`"), "<code class='inline'>code **normal text**</code>")
		await expectEqual(t, "Code block", markdown("```js\ncode\n```"), "<pre><code class='language-js'>code</code></pre>")
		await expectEqual(t, "Code block requiring escaping", markdown("```js\nalert(`42`)\n```"), "<pre><code class='language-js'>alert(`42`)</code></pre>")

		await expectEqual(t, "Heading level 1 with parsing disabled", markdown("# Text! yay "), "# Text! yay")
		await expectEqual(t, "Heading level 1 with allowed whitespaces", [
			markdown("# Text! yay ", { replaceHeaders: true }), markdown("#\tText! yay ", { replaceHeaders: true }),
			markdown("#\u2002Text! yay ", { replaceHeaders: true }), markdown("#\u2003Text! yay ", { replaceHeaders: true }),
			markdown("#\u2004Text! yay ", { replaceHeaders: true }), markdown("#\u2005Text! yay ", { replaceHeaders: true }),
			markdown("#\u2006Text! yay ", { replaceHeaders: true }), markdown("#\u2007Text! yay ", { replaceHeaders: true }),
			markdown("#\u2008Text! yay ", { replaceHeaders: true }), markdown("#\u2009Text! yay ", { replaceHeaders: true }),
			markdown("#\u200AText! yay ", { replaceHeaders: true })
		], "<span class='h1'>Text! yay</span>")
		await expectEqual(t, "Heading level 1 with multiple whitespaces", markdown("#   Text! yay ", { replaceHeaders: true }), "<span class='h1'>Text! yay</span>")
		await expectEqual(t, "Heading level 2", markdown("## Text! yay ", { replaceHeaders: true }), "<span class='h2'>Text! yay</span>")
		await expectEqual(t, "Heading level 3", markdown("### Text! yay ", { replaceHeaders: true }), "<span class='h3'>Text! yay</span>")
		await expectEqual(t, "Headers ignoring invalid without any whitespace", markdown("##Text! yay ", { replaceHeaders: true }), "##Text! yay")
		await expectEqual(t, "Headers ignoring invalid with a zero-width space", markdown("##​Text! yay ", { replaceHeaders: true }), "##​Text! yay")
		await expectEqual(t, "Headers ignoring invalid with a braille-blank character", markdown("##⠀Text! yay ", { replaceHeaders: true }), "##⠀Text! yay")

		await expectEqual(t, "Emoji and emoji alias", markdown(":tomato: :+1:", { replaceEmojis: true }), "🍅 👍")
		await expectEqual(t, "Emoji skin tones", markdown(
			":thumbsup: :thumbsup::skin-tone-1: :thumbsup::skin-tone-2: :thumbsup::skin-tone-3: :thumbsup::skin-tone-4: :thumbsup::skin-tone-5:",
			{ replaceEmojis: true }), "👍 👍🏻 👍🏼 👍🏽 👍🏾 👍🏿")

		await expectEqual(t, "Non-markdown links", markdown("https://tomatenkuchen.com"),
			"<a href='https://tomatenkuchen.com' target='_blank' rel='noopener' class='anchor'>https://tomatenkuchen.com</a>")
		await expectEqual(t, "Markdown links", markdown("[🍅🍰](https://tomatenkuchen.com)"),
			"<a href='https://tomatenkuchen.com' target='_blank' rel='noopener' class='anchor'>🍅🍰</a>")
		await expectEqual(t, "Markdown links with labels", markdown("[🍅🍰](https://tomatenkuchen.com 'hello there .-.')"),
			"<a href='https://tomatenkuchen.com' target='_blank' rel='noopener' class='anchor' title='hello there .-.'>🍅🍰</a>")
	})
}
main()
