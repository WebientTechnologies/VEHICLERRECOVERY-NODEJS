
const mongoose = require("mongoose");

const dashboard = new mongoose.Schema(
    {
        onlineDataCount: {
            type: Number,
            required: true,
            maxLength: 255,
        },

    },
    { timestamps: true, }
);

module.exports = mongoose.model("Dashboard", dashboard);