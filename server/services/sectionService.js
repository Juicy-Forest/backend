const SectionInfo = require('../models/Section');

const getSectionsByGarden = async function (gardenId) {
    return SectionInfo.find({ garden: gardenId }).populate('garden').populate('assignedTo');
};

const createSection = async function (data) {
    const section = new SectionInfo(data);
    return section.save();
};

const getSectionById = async function (id) {
    return SectionInfo.findOne({ id });
};

const updateSection = async function (id, data) {
    return SectionInfo.findOneAndUpdate({ id }, data, { new: true });
};

const deleteSection = async function(id) {
    return SectionInfo.findOneAndDelete({ id });
};

module.exports = {
    getSectionsByGarden,
    createSection,
    getSectionById,
    updateSection,
    deleteSection
};
