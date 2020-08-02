//jshint esversion:6
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose"); // Creates Salts and Hash strings
const findOrCreate = require("mongoose-findorcreate");

const UserSchema = new mongoose.Schema({
    email: {type:String,},
    password: {type:String},
    googleId: String,
    secret: String
});

UserSchema.plugin(passportLocalMongoose);
UserSchema.plugin(findOrCreate);

module.exports = mongoose.model("User",UserSchema);

