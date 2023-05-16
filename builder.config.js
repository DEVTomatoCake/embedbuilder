/**
 * This script file will (or atleast should) run before the main script file runs.
 * This file should contain stuff like options, global variables (etc.) to be used by the main script.
 */

// Options

// URL options can override the options below.
// Options set through the menu can override both until the page is refreshed.
options = {
	username: "TomatenKuchen",
	avatar: "https://tomatenkuchen.eu/assets/images/background_192.webp",
	verified: true,
	data: null,
	guiTabs: ["description"],
	useJsonEditor: false,
	reverseColumns: false,
	allowPlaceholders: false,
	autoUpdateURL: false,
	hideEditor: false,
	hidePreview: false,
	hideMenu: false,
	sourceOption: true // Display link to source code in menu.
}

// Default JSON object
json = {
	content: "Hello world",
	embeds: [
		{
			title: "A title",
			description: "A description",
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
					custom_id: "button5"
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
