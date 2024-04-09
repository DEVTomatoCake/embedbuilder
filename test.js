/* eslint-disable no-new-func */

const test = require("node:test")
const assert = require("node:assert")

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
	const emojisFile = await fs.readFile("./assets/twemoji.js", "utf8")

	test("Markdown", async t => {
		const funcStart = scriptFile.indexOf("const markup = ")
		const funcEnd = scriptFile.includes("\r\n}", funcStart) ? (scriptFile.indexOf("\r\n}", funcStart) + 3) : (scriptFile.indexOf("\n}", funcStart) + 2)

		const funcStr = scriptFile.substring(funcStart, funcEnd)
		const args = funcStr.split("\n")[0].replace("const markup = ", "").replace(" => {", "").trim().slice(1, -1)
		const markdown = new Function(...args.split(", "), funcStr.split("\n").slice(1, -1).join("\n"))

		await expectEqual(t, "Input is trimmed", markdown("   text \t\n\n \r\n"), "text")
		await expectEqual(t, "Empty string", markdown(""), "")

		await expectEqual(t, "Bold", markdown("**text**"), "<strong>text</strong>")
		await expectEqual(t, "Italic", [markdown("*text*"), markdown("_text_")], "<em>text</em>")
		await expectEqual(t, "Strikethrough", markdown("~~text !$=3@Ä🍅~~"), "<s>text !$=3@Ä🍅</s>")
		await expectEqual(t, "Underlined", markdown("_hi__text__"), "_hi<u>text</u>")
		await expectEqual(t, "Bold and italic combined", [markdown("***text***"), markdown("_**text**_")], "<em><strong>text</strong></em>")

		await expectEqual(t, "Bold, italic and underlined combined 1", markdown("***__text__***"), "<em><strong><u>text</u></strong></em>")
		await expectEqual(t, "Bold, italic and underlined combined 2", markdown("__***text***__"), "<u><em><strong>text</strong></em></u>")

		await expectEqual(t, "Spoiler", markdown("text|| hello there|| ||"), "text<span class='spoiler'> hello there</span> ||")

		await expectEqual(t, "Headers level 1 with parsing disabled", markdown("# Text! yay "), "# Text! yay")
		await expectEqual(t, "Headers level 1 with allowed whitespaces", [
			markdown("# Text! yay ", { replaceHeaders: true }), markdown("#\tText! yay ", { replaceHeaders: true }),
			markdown("# Text! yay ", { replaceHeaders: true }), markdown("# Text! yay ", { replaceHeaders: true }),
			markdown("# Text! yay ", { replaceHeaders: true }), markdown("# Text! yay ", { replaceHeaders: true }),
			markdown("# Text! yay ", { replaceHeaders: true }), markdown("# Text! yay ", { replaceHeaders: true }),
			markdown("# Text! yay ", { replaceHeaders: true }), markdown("# Text! yay ", { replaceHeaders: true }),
			markdown("# Text! yay ", { replaceHeaders: true })
		], "<span class='h1'>Text! yay</span>")
		await expectEqual(t, "Headers level 3", markdown("### Text! yay ", { replaceHeaders: true }), "<span class='h3'>Text! yay</span>")
		await expectEqual(t, "Headers ignoring invalid without any whitespace", markdown("##Text! yay ", { replaceHeaders: true }), "##Text! yay")
		await expectEqual(t, "Headers ignoring invalid with a zero-width space", markdown("##​Text! yay ", { replaceHeaders: true }), "##​Text! yay")
		await expectEqual(t, "Headers ignoring invalid with a braille-blank character", markdown("##⠀Text! yay ", { replaceHeaders: true }), "##⠀Text! yay")

		await expectEqual(t, "Emojis", markdown(":tomato:", { replaceEmojis: true }), "🍅")
	})
}
main()
