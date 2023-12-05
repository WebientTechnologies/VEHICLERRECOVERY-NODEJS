
const mongoose = require("mongoose");

const banks = new mongoose.Schema(
    {
        bankId:{
            type:String,
            required:true,
            maxLength:255,
        },
        bankName: {
            type:String,
            required:true,
            maxLength:255,
        },
        status: {
            type:String,
            required:true,
            maxLength:255,
        },
    },
    { timestamps: true,}
);

module.exports = mongoose.model("Bank", banks);