const Garden = require('../models/Garden');

async function createGarden(ownerId, name, description, location, grid) {
    // Generate unique join code
    let joinCode;
    do {
        joinCode = Math.random().toString(36).substring(2, 11).toUpperCase();
    } while (await Garden.findOne({ joinCode }));
    const garden = await Garden.create({
        name,
        description,
        location,
        joinCode,
        owner: ownerId,
        members: [ownerId], // Owner is also a member
        grid
    });
    return garden;
}

async function getAllGardens() {
    return await Garden.find().populate('owner', 'username email').populate('members', 'username email');
}

async function getGardensByUserId(userId) {
    return await Garden.find({ members: userId }).populate('owner', 'firstName lastName email').populate('members', 'firstName lastName email');
}

async function getGardenById(id) {
    return await Garden.findById(id).populate('owner', 'username email').populate('members', 'username email');
}


async function joinGarden(gardenId, userId) {
    const garden = await Garden.findById(gardenId);
    if (!garden) {
        throw new Error('Garden not found');
    }

    if (garden.members.includes(userId)) {
        throw new Error('Already a member of this garden');
    }

    garden.members.push(userId);
    await garden.save();
    return garden;
}

async function joinGardenByCode(joinCode, userId) {
    const garden = await Garden.findOne({ joinCode: joinCode.toUpperCase() });
    if (!garden) {
        throw new Error('Invalid join code');
    }

    if (garden.members.includes(userId)) {
        throw new Error('Already a member of this garden');
    }

    if (garden.members.length >= garden.maxMembers) {
        throw new Error('Garden is full');
    }

    garden.members.push(userId);
    await garden.save();
    return garden;
}

async function leaveGarden(gardenId, userId) {
    const garden = await Garden.findById(gardenId);
    if (!garden) {
        throw new Error('Garden not found');
    }

    if (!garden.members.includes(userId)) {
        throw new Error('Not a member of this garden');
    }

    if (garden.owner.toString() === userId) {
        throw new Error('Owner cannot leave the garden');
    }

    garden.members = garden.members.filter(id => id.toString() !== userId);
    await garden.save();
    return garden;
}

async function updateGarden(id, data, userId) {
    const garden = await Garden.findById(id);
    if (!garden) {
        throw new Error('Garden not found');
    }

    if (garden.owner.toString() !== userId) {
        throw new Error('Only owner can update the garden');
    }

    if ("name" in data) {
        garden.name = data.name;
    }

    if ("description" in data) {
        garden.description = data.description;
    }

    if (data.maxMembers) { // wont be 0 so works like this
        garden.maxMembers = data.maxMembers;
    }
    console.log(data.grid)
    if("grid" in data) {
        console.log("Reaching here")
        garden.grid = data.grid
    }

    await garden.save();
    return garden;
}

async function deleteGarden(id, userId) {
    const garden = await Garden.findById(id);
    if (!garden) {
        throw new Error('Garden not found');
    }

    if (garden.owner.toString() !== userId) {
        throw new Error('Only owner can delete the garden');
    }

    await Garden.findByIdAndDelete(id);
}

const removeMember = async (gardenId, memberId, userId) => {
    const garden = await Garden.findById(gardenId);
    if (!garden) {
        throw new Error('Garden not found');
    }
    if (garden.owner.toString() !== userId.toString()) {
        throw new Error('Only owner can remove members');
    }
    if (!garden.members.includes(memberId)) {
        throw new Error('Member not found in garden');
    }
    garden.members = garden.members.filter(m => m.toString() !== memberId.toString());
    return await garden.save();
};

module.exports = {
    createGarden,
    getAllGardens,
    getGardensByUserId,
    getGardenById,
    joinGarden,
    joinGardenByCode,
    leaveGarden,
    updateGarden,
    deleteGarden,
    removeMember
};
