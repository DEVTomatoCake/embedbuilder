// Default JSON object
json = {
	content: "Hello ~~world~~ Discord user :D\n\n# New markdown works too!\n\n## So, what are you waiting for?\n\n### Go ahead and edit this message!",
	embeds: [
		{
			title: "Next steps",
			description: "1. https://tomatenkuchen.com/invite\n2. Use the bot to import a message\n3. Send it using TomatenKuchen or a webhook!"
		}
	],
	components: [
		{
			type: 1,
			components: [
				{
					type: 2,
					label: "Primary Button",
					style: 1,
					custom_id: "button1"
				},{
					type: 2,
					label: "Secondary Button",
					style: 2,
					custom_id: "button2"
				},{
					type: 2,
					label: "Success Button",
					style: 3,
					custom_id: "button3"
				},{
					type: 2,
					label: "Danger Button",
					style: 4,
					custom_id: "button4"
				},{
					type: 2,
					label: "URL Button",
					style: 5,
					url: "https://tomatenkuchen.com"
				}
			]
		},{
			type: 1,
			components: [
				{
					type: 3,
					placeholder: "Select a value!",
					custom_id: "selectmenu",
					min_values: 1,
					max_values: 2,
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
