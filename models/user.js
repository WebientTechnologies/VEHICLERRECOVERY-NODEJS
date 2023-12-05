
const mongoose = require("mongoose");

const users = new mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
            maxLength:255,
        },
        email: {
            type:String,
            required:true,
            maxLength:255,
        },
        password: {
            type:String,
            required:true,
            maxLength:255,
        },
        mobile: {
            type:String,
            required:true,
            maxLength:50,
        },
    },
    { timestamps: true,}
);

module.exports = mongoose.model("User", users);