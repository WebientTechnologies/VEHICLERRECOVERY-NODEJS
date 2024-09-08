
const mongoose = require("mongoose");

const searchData = new mongoose.Schema(
    {

        vehicleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VehicleData',
            required: false,
        },
        seezerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RepoAgent',
            required: false,
        },

        createdAt: {
            type: Date,
            required: false,
            maxLength: 255,
        },
        updatedAt: {
            type: Date,
            required: false,
            maxLength: 255,
        },


    },
    { timestamps: true, }
);

module.exports = mongoose.model("SearchData", searchData);