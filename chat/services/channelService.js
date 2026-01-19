import Channel from '../models/Channel.js';

export async function saveChannel(name, gardenId) {
    return await Channel.create({
        name: name,
        gardenId: gardenId,
    });
}

export async function getChannels(gardenId) {
    return await Channel.find({ gardenId: gardenId });
}

export async function getFormattedChannelsByGardenId(gardenId) {
    const channels = await getChannels(gardenId);
    return channels.map(channel => formatChannel(channel));
}

export function formatChannel(channel) {
    return {
        _id:channel._id,
        name: channel.name,
    };
}
