const mongoose = require('mongoose');


//TODO: CHANGE DB LINK

function initDatabase(){
    return mongoose.connect("mongodb://mongo:27017/juicy-forest")
}

module.exports = initDatabase;
