/**
 * This script file will (or atleast should) run before the main script file runs.
 * This file should contain stuff like options, global variables (etc.) to be used by the main script.
 */

// Options

// URL options can override the options below.
// Options set through the menu can override both until the page is refreshed.
options = {
	data: null,
	guiTabs: ["description"],
	useJsonEditor: false,
	reverseColumns: false,
	allowPlaceholders: false,
	autoUpdateURL: false
}

// Default JSON object
json = {
	content: "Hello ~~world~~ Discord user :D\n\n# New markdown works too!\n\n## So, what are you waiting for?\n\n### Go ahead and edit this message!\n\nNext steps:\n1. https://tomatenkuchen.eu/invite\n2. Use the `embed` command to send the message",
	embeds: [
		{
			title: "A title",
			description: "A description"
		}
	],
	components: [
		{
			type: 1,
			components: [
				{
					type: 2,
					label: "Button Stil 1",
					style: 1,
					custom_id: "button1"
				},{
					type: 2,
					label: "Button Stil 2",
					style: 2,
					custom_id: "button2"
				},{
					type: 2,
					label: "Button Stil 3",
					style: 3,
					custom_id: "button3"
				},{
					type: 2,
					label: "Button Stil 4",
					style: 4,
					custom_id: "button4"
				},{
					type: 2,
					label: "Button Stil 5",
					style: 5,
					url: "https://tomatenkuchen.eu"
				}
			]
		},{
			type: 1,
			components: [
				{
					type: 3,
					label: "Selectmenü",
					custom_id: "selectmenu",
					options: [
						{
							label: "Option 1",
							value: "option1"
						},{
							label: "Option 2",
							value: "option2"
						},{
							label: "Option 3",
							value: "option3"
						}
					]
				}
			]
		}
	]
}
