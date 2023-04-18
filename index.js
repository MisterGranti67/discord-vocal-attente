const { createAudioPlayer, createAudioResource, entersState, joinVoiceChannel, AudioPlayerStatus, VoiceConnectionStatus, StreamType } = require('@discordjs/voice');
const { Client, Intents } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
  intents: [Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS]
});

const targetVoiceChannelId = '589102132817559553';
const guildmessage = '1084535636222017546';
const targetGuildId = '451372360134819860';
const player = createAudioPlayer();

let currentTrack = null;
let currentConnection = null;


client.on('messageCreate', async (message) => {
    if (!message.guild || message.channel.type !== 'GUILD_TEXT') return;

    if (message.content === '-attentelody on') {
        currentTrack = 'musique_attente_1.mp3';
        playAudio(message.guild, currentTrack);
        message.reply('Musique d\'attente activée !')
    } else if (message.content === '-attentelody off') {
        currentTrack = 'sons_attente.mp3';
        playAudio(message.guild, currentTrack);
        message.reply('Musique d\'attente désactivée !')
    }
});
client.on('voiceStateUpdate', async (oldState, newState) => {
    const targetGuild = client.guilds.cache.get(guildmessage);
    if (newState.channelId === targetVoiceChannelId && newState.member.id !== client.user.id && oldState.channelId !== newState.channelId) {
        const userId = newState.member.id;

        const targetTextChannel = targetGuild.channels.cache.get('1086413403767181394');

        if (!targetTextChannel || targetTextChannel.type !== 'GUILD_TEXT') return;

        if (currentTrack === 'sons_attente.mp3') {
            targetTextChannel.send(`<@${userId}> est dans attente d'aide !`);
        } else if (currentTrack === 'musique_attente_1.mp3') {
            targetTextChannel.send(`<@${userId}> est dans attente d'aide ! <@&1084556184725508147> <@&1084555956995756137>`);
        }

        // Check if the bot is not in the voice channel and connect it
        const botInVoiceChannel = newState.guild.members.cache.get(client.user.id).voice.channelId;
        if (!botInVoiceChannel || botInVoiceChannel !== targetVoiceChannelId) {
            await playAudio(newState.guild, currentTrack);
        }
    }
});


const playAudio = async (guild, filePath) => {
    const targetGuild = client.guilds.cache.get(targetGuildId);
    if (!targetGuild) return;
    
    const voiceChannel = targetGuild.channels.cache.get(targetVoiceChannelId);
    if (!voiceChannel || voiceChannel.type !== 'GUILD_VOICE') return;

    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator
    });

    try {
        console.log('Trying to join voice channel...')
        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    } catch (error) {
        console.error(error);
        connection.destroy();
        console.log('Failed to join voice channel within 30 seconds, destroying the connection.')
        return;
    }

    console.log("Playing audio file: " + filePath);
    const resource = createAudioResource(fs.createReadStream(filePath), {
        
        inputType: StreamType.Arbitrary,
    });

    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
        console.log('Audio player is idle, destroying the connection.')
        playAudio(guild, filePath);
    });
};
  

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Set a default audio file for currentTrack if it's null
    if (!currentTrack) {
        currentTrack = 'sons_attente.mp3';
    }
});

client.login(process.env.BOT_TOKEN);
