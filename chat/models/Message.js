import { Schema, model } from 'mongoose';

const messageSchema = new Schema(
    {
        author: {
            _id: {
                type: Schema.Types.ObjectId,
                required: true,
            },
            username: {
                type: String,
                required: true,
            },
            avatarColor: {
                type: String,
                required: true,
            },
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 3000,
        },
        channel: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'Channel',
            index: true
        },
        gardenId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

messageSchema.index({ channel: 1, createdAt: -1 });
messageSchema.index({ gardenId: 1, createdAt: -1 });
messageSchema.index({ author: 1, createdAt: -1 });

const Message = model('Message', messageSchema);

export default Message;
