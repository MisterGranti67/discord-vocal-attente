const { createAudioPlayer, createAudioResource, entersState, joinVoiceChannel, AudioPlayerStatus, VoiceConnectionStatus, StreamType } = require('@discordjs/voice');
const { Client, Intents } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
  intents: [Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS]
});

const targetVoiceChannelId = '589102132817559553';
const targetGuildId = '451372360134819860';
const player = createAudioPlayer();

let currentTrack = null;
let currentConnection = null;


client.on('messageCreate', async (message) => {
    if (!message.guild || message.channel.type !== 'GUILD_TEXT') return;

    if (message.content === '-attentelody on') {
        currentTrack = 'musique_attente_1.mp3';
        playAudio(message.guild, currentTrack);
    } else if (message.content === '-attentelody off') {
        currentTrack = 'sons_attente.mp3';
        playAudio(message.guild, currentTrack);
    }
});
client.on('voiceStateUpdate', async (oldState, newState) => {
    if (newState.channelId === targetVoiceChannelId && newState.member.id !== client.user.id) {
        const username = newState.member.displayName;

        const targetTextChannel = newState.guild.channels.cache.get('1086413403767181394');

        if (!targetTextChannel || targetTextChannel.type !== 'GUILD_TEXT') return;

        if (currentTrack === 'musique_attente_1.mp3') {
            targetTextChannel.send(`Machin est dans attente d'aide !`);
        } else if (currentTrack === 'sons_attente.mp3') {
            targetTextChannel.send(`@Lody est dans attente d'aide ! @New.Guide-SL @Guide-SL`);
        }
    }
});

const playAudio = async (guild, filePath) => {
    const targetGuild = client.guilds.cache.get(targetGuildId);
    console.log("1"+targetGuild)
    if (!targetGuild) return;
    
    const voiceChannel = targetGuild.channels.cache.get(targetVoiceChannelId);
    console.log(voiceChannel)
    if (!voiceChannel || voiceChannel.type !== 'GUILD_VOICE') return;

    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator
    });

    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    } catch (error) {
        console.error(error);
        connection.destroy();
        return;
    }

    const resource = createAudioResource(fs.createReadStream(filePath), {
        inputType: StreamType.Arbitrary,
    });

    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
        playAudio(guild, filePath);
    });
};
  

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.login(process.env.BOT_TOKEN);
