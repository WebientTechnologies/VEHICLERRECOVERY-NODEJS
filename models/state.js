
const mongoose = require("mongoose");

const states = new mongoose.Schema(
    {
        name: {
            type:String,
            required:true,
            maxLength:255,
        },
        zoneId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Zone',
            required: false,
        },
    },
    { timestamps: true,}
);

module.exports = mongoose.model("State", states);