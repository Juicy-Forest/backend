const mongoose = require('mongoose');

function initDatabase(){
    const dbUri = process.env.MONGODB_URI || "mongodb://localhost:27017/juicy-forest";
    return mongoose.connect(dbUri);
}

module.exports = initDatabase;
