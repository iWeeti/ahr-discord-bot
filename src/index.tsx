import { Client, Colors, Events, SlashCommandBuilder } from "discord.js";
import { config } from "dotenv";
import { Embed, EmbedField, EmbedTitle, ReacordDiscordJs } from "reacord";
import React, { useEffect, useState } from "react";
import { Database } from "sqlite3";
config();

const db = new Database(process.env.DATABASE_URL ?? ":memory:");

const client = new Client({
    intents: ["Guilds", "GuildMembers", "GuildMessages"],
});
const reacord = new ReacordDiscordJs(client);

client.once(Events.ClientReady, async () => {
    console.log("Ready! Creating commands...");
    await client.application?.commands.create(
        new SlashCommandBuilder()
            .setName("uptime")
            .setDescription("Shows the uptime of the bot.")
    );
    await client.application?.commands.create(
        new SlashCommandBuilder()
            .setName("user")
            .setDescription("Shows the stats of a user.")
            .addStringOption((option) =>
                option
                    .setName("user")
                    .setDescription("The user to show the stats of.")
                    .setRequired(true)
            )
    );
});

client.login(process.env.DISCORD_TOKEN);

function Uptime() {
    const [startTime] = useState(Date.now());
    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return <>this message has been shown for {currentTime - startTime}ms</>;
}

type User = {
    Id: number;
    Name: string;
    MatchesPlayed: number;
    NumberOneResults: number;
    Playtime: number;
};

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === "uptime") {
            const instance = reacord.createInteractionReply(interaction);
            instance.render(<Uptime />);
        }

        if (interaction.commandName === "user") {
            const instance = reacord.createInteractionReply(interaction);
            const username = interaction.options.getString("user");
            if (!username) {
                instance.render(<>No username provided</>);
                return;
            }

            db.serialize(() => {
                db.get<User>(
                    `SELECT * FROM Users WHERE LOWER(Name) = LOWER(?);`,
                    username,
                    async (err, row) => {
                        if (err) {
                            instance.render(<>Something went wrong</>);
                            return;
                        }

                        console.log(row);

                        if (!row) {
                            instance.render(<>User not found</>);
                            return;
                        }

                        const ranks = await new Promise<{
                            matchesPlayedRank: number;
                            numberOneResultsRank: number;
                            playtimeRank: number;
                        }>((resolve, reject) => {
                            db.get<{
                                matchesPlayedRank: number;
                                numberOneResultsRank: number;
                                playtimeRank: number;
                            }>(
                                `SELECT matchesPlayedRank, numberOneResultsRank, playtimeRank FROM (
                                    SELECT 
                                        Id, 
                                        (RANK() OVER (ORDER BY Users.MatchesPlayed DESC)) as matchesPlayedRank,
                                        (RANK() OVER (ORDER BY Users.NumberOneResults DESC)) as numberOneResultsRank,
                                        (RANK() OVER (ORDER BY Users.Playtime DESC)) as playtimeRank
                                    FROM Users
                                ) WHERE Id = ?;`,
                                row.Id,
                                (err, row) => {
                                    if (err) {
                                        reject(err);
                                        return;
                                    }
                                    resolve(row);
                                }
                            );
                        });

                        instance.render(
                            <UserEmbed
                                user={row}
                                matchesPlayedRank={ranks.matchesPlayedRank}
                                numberOneResultsRank={
                                    ranks.numberOneResultsRank
                                }
                                playtimeRank={ranks.playtimeRank}
                            />
                        );
                    }
                );
            });
        }
    }
});

function UserEmbed({
    user,
    matchesPlayedRank,
    numberOneResultsRank,
    playtimeRank,
}: {
    user: User;
    matchesPlayedRank: number;
    numberOneResultsRank: number;
    playtimeRank: number;
}) {
    return (
        <>
            <Embed color={Colors.Blue}>
                <EmbedTitle
                    url={`https://autohostrotate.com/user/${user.Name}`}
                >
                    {user.Name}
                </EmbedTitle>
                <EmbedField
                    inline
                    name="Matches Played"
                    value={`**${user.MatchesPlayed}** (#${matchesPlayedRank})`}
                />
                <EmbedField
                    inline
                    name="#1 Count"
                    value={`**${user.NumberOneResults}** (#${numberOneResultsRank})`}
                />
                <EmbedField
                    inline
                    name="Playtime"
                    value={`**${Math.floor(user.Playtime / 3600)}h ${Math.floor(
                        (user.Playtime % 3600) / 60
                    )}m** (#${playtimeRank})`}
                />
            </Embed>
        </>
    );
}
