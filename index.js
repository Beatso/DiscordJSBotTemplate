const fs = require("fs")
const Discord = require("discord.js")
const dotenv = require("dotenv")
const express = require("express")

dotenv.config()

express()
	.all("/", (req, res) => res.send("bot kept alive"))
	.listen(3000, () => console.log("server running"))

const client = new Discord.Client()
module.exports.client = client
client.login(process.env.bottoken)

client.commands = new Discord.Collection()
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"))

const cooldowns = new Discord.Collection()
for (file of commandFiles) {
	const command = require("./commands").filter(file => file.endsWith(".js"))
	client.comands.set(command.name, command)
}

client.once("ready", () => {
	console.log("bot running")
	client.user.setActivity("r/TextureCraft", {type:"WATCHING"})
})

client.on("message", message => {
	if (!message.content.startsWith(prefix)) return
	const args = message.content.slice(prefix.length).split(/ +/)
	const command = args.shift().toLowerCase()
	if (!client.commands.has(command)) return

	// cooldown stuff
	if (!cooldowns.has(command.name)) cooldowns.set(command.name, new Discord.Collection())
	const now = Date.now()
	const timestamps = cooldowns.get(command.name)
	const cooldownAmount = (command.cooldown || 3) * 1000
	if (timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount
		if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000
			return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing that command.`)
		}
	}
	timestamps.set(message.author.id, now)
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount)

	try {
		client.commands.get(command).execute(message, args)
	} catch (error) {
		console.error(error)
		message.reply('there was an error trying to execute that command!')
	}
})
