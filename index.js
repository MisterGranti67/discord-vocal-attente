const { Client, Intents } = require('discord.js');
const { createAudioResource, createAudioPlayer, joinVoiceChannel, AudioPlayerStatus, StreamType } = require('@discordjs/voice');
const fs = require('fs');

const client = new Client({
  intents: [Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS]
});

const token = 'NDgwODA3NzY5MzM1NzkxNjI2.GrX9_1.yroNtNosnp2wfggbIB_ILfjWPa8Eo0fIK1yD6Y';
const targetVoiceChannelId = '589102132817559553';

let audioPlayer = createAudioPlayer();
let currentConnection;
let currentTrack;

const playAudio = (channel, filePath) => {
  if (currentConnection) currentConnection.destroy();

  currentConnection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator
  });

  audioPlayer.stop();
  audioPlayer = createAudioPlayer();

  const audioResource = createAudioResource(fs.createReadStream(filePath), {
    inputType: StreamType.Arbitrary
  });

  audioPlayer.play(audioResource);
  currentConnection.subscribe(audioPlayer);

  audioPlayer.on(AudioPlayerStatus.Idle, () => {
    currentConnection.destroy();
  });

  audioPlayer.on('error', (error) => {
    console.error('Error playing audio:', error);
    currentConnection.destroy();
  });
};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  if (!message.guild) return; // Ignore DMs

  const voiceChannel = message.guild.channels.cache.get(targetVoiceChannelId);
  if (!voiceChannel || voiceChannel.type !== 'GUILD_VOICE') return; // Ignore if target channel is not found or not a voice channel

  if (message.content === '-attentelody on') {
    currentTrack = 'musique_attente_1.mp3';
    playAudio(voiceChannel, currentTrack);
  } else if (message.content === '-attentelody off') {
    currentTrack = 'sons_attente.mp3';
    playAudio(voiceChannel, currentTrack);
  }
});

client.on('voiceStateUpdate', (oldState, newState) => {
  if (newState.channelId === targetVoiceChannelId && newState.member.id !== client.user.id) {
    const username = newState.member.displayName;
    if (currentTrack === 'musique_attente_1.mp3') {
      newState.guild.systemChannel.send(`Machin est dans attente d'aide !`);
    } else if (currentTrack === 'sons_attente.mp3') {
      newState.guild.systemChannel.send(`@Lody est dans attente d'aide ! @New.Guide-SL @Guide-SL`);
    }
  }
});

client.login(token);
