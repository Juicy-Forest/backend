import { Schema, model } from 'mongoose';

const channelSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        gardenId: {
            type: Schema.Types.ObjectId,
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

channelSchema.index({ gardenId: 1, name: 1 }, { unique: true });

const Channel = model('Channel', channelSchema);

export default Channel;

