
const mongoose = require("mongoose");

const vehiclesdata = new mongoose.Schema(
    {
        bankName: {
            type: String,
            required: false,
            maxLength: 255,
        },
        branch: {
            type: String,
            required: false,
            maxLength: 255,
        },
        agreementNo: {
            type: String,
            required: false,
            maxLength: 255,
        },
        customerName: {
            type: String,
            required: false,
            maxLength: 255,
        },
        regNo: {
            type: String,
            required: false,
            maxLength: 255,
        },
        chasisNo: {
            type: String,
            required: false,
            maxLength: 255,
        },
        engineNo: {
            type: String,
            required: false,
            maxLength: 255,
        },
        model: {
            type: String,
            required: false,
            maxLength: 5000,
        },
        maker: {
            type: String,
            required: false,
            maxLength: 5000,
        },
        dlCode: {
            type: String,
            required: false,
            maxLength: 255,
        },
        bucket: {
            type: String,
            required: false,
            maxLength: 255,
        },
        emi: {
            type: String,
            required: false,
            maxLength: 255,
        },
        color: {
            type: String,
            required: false,
            maxLength: 255,
        },
        callCenterNo1: {
            type: String,
            required: false,
            maxLength: 255,
        },
        callCenterNo1Name: {
            type: String,
            required: false,
            maxLength: 255,
        },
        callCenterNo1Email: {
            type: String,
            required: false,
            maxLength: 255,
        },
        callCenterNo2: {
            type: String,
            required: false,
            maxLength: 255,
        },
        callCenterNo2Name: {
            type: String,
            required: false,
            maxLength: 255,
        },
        callCenterNo2Email: {
            type: String,
            required: false,
            maxLength: 255,
        },
        callCenterNo3: {
            type: String,
            required: false,
            maxLength: 255,
        },
        callCenterNo3Name: {
            type: String,
            required: false,
            maxLength: 255,
        },
        callCenterNo3Email: {
            type: String,
            required: false,
            maxLength: 255,
        },
        callCenterNo4: {
            type: String,
            required: false,
            maxLength: 255,
        },
        callCenterNo4Name: {
            type: String,
            required: false,
            maxLength: 255,
        },
        callCenterNo4Email: {
            type: String,
            required: false,
            maxLength: 255,
        },
        lastDigit: {
            type: String,
            required: false,
            maxLength: 255,
        },
        month: {
            type: String,
            required: false,
            maxLength: 255,
        },
        status: {
            type: String,
            enum: ["pending", "search", "hold", "repo", "release"],
            default: "pending"
        },
        seezerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RepoAgent',
            required: false,
        },
        confirmBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },
        confirmDate: {
            type: String,
            required: false,
            maxLength: 255,
        },
        confirmTime: {
            type: String,
            required: false,
            maxLength: 255,
        },
        loadStatus: {
            type: String,
            enum: ["empty", "goods", " "],
            default: " "
        },
        loadItem: {
            type: String,
            required: false,
            maxLength: 255,
        },
        tbrFlag: {
            type: String,
            required: false,
            maxLength: 255,
        },
        executiveName: {
            type: String,
            required: false,
            maxLength: 255,
        },
        sec17: {
            type: String,
            required: false,
            maxLength: 255,
        },
        sec9: {
            type: String,
            required: false,
            maxLength: 255,
        },
        seasoning: {
            type: String,
            required: false,
            maxLength: 255,
        },
        uploadDate: {
            type: Date,
            required: false,
            maxLength: 255,
        },
        latitude: {
            type: String,
            required: false,
            maxLength: 255,
        },
        longitude: {
            type: String,
            required: false,
            maxLength: 255,
        },
        fileName: {
            type: String,
            required: false,
            maxLength: 255,
        },
        vehicleType: {
            type: String,
            required: false,
            maxLength: 255,
        },
        holdAt: {
            type: Date,
            required: false,
            maxLength: 255,
        },
        releaseAt: {
            type: Date,
            required: false,
            maxLength: 255,
        },
        searchedAt: {
            type: Date,
            required: false,
            maxLength: 255,
        },
        repoAt: {
            type: Date,
            required: false,
            maxLength: 255,
        },


    },
    { timestamps: true, }
);

module.exports = mongoose.model("VehicleData", vehiclesdata);