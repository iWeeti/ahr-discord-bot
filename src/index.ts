import { Client, Events } from "discord.js";
import { config } from "dotenv";
import { ReacordDiscordJs } from "reacord";
config();

const client = new Client({
    intents: ["Guilds", "GuildMembers", "GuildMessages"],
});
const reacord = new ReacordDiscordJs(client);

client.once(Events.ClientReady, () => {
    console.log("Ready!");
});

client.login(process.env.DISCORD_TOKEN);
