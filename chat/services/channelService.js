import Channel from '../models/Channel.js';

export async function saveChannel(name, gardenId) {
  return await Channel.create({
    name: name,
    gardenId: gardenId,
  });
}

export async function getChannels() {
  return await Channel.find({});
}

export async function getFormattedChannels(){
  const channels = await getChannels();
  return channels.map(channel => formatChannel(channel));
}

export function formatChannel(channel) {
  return {
    _id:channel._id,
    name: channel.name,
  };
}
