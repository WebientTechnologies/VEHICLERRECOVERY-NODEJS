
const mongoose = require("mongoose");

const officestafs = new mongoose.Schema(
    {
        stafId: {
            type: String,
            required: [true, "Please Enter Staf Id"],
            maxLength: 255,
        },
        name: {
            type: String,
            required: [true, "Please Enter Name"],
            maxLength: 255,
        },
        mobile: {
            type: String,
            required: [true, "Please Enter Mobile"],
            maxLength: 255,
        },
        alternativeMobile: {
            type: String,
            required: false,
            maxLength: 255,
        },
        email: {
            type: String,
            required: false,
            maxLength: 255,
        },
        panCard: {
            type: String,
            required: [true, "Please Enter Pan Number"],
            maxLength: 255,
        },
        aadharCard: {
            type: String,
            required: [true, "Please Enter Adhar Number"],
            maxLength: 255,
        },
        addressLine1: {
            type: String,
            required: [true, "Please Enter Address"],
            maxLength: 500,
        },
        addressLine2: {
            type: String,
            required: false,
            maxLength: 500,
        },
        state: {
            type: String,
            required: [true, "Please Enter State"],
            maxLength: 255,
        },
        city: {
            type: String,
            required: [true, "Please Enter City"],
            maxLength: 255,
        },
        pincode: {
            type: Number,
            required: [true, "Please Enter Pincode"],
            maxLength: 10,
        },
        username: {
            type: String,
            required: [true, "Please Enter Username"],
            maxLength: 255,
        },
        password: {
            type: String,
            required: true,
            maxLength: 255,
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "inactive"
        },
        deviceId: {
            type: String,
            required: false,
            maxLength: 255,
        },
        photo: {
            type: String,
            required: false,
            maxLength: 255,
        },
        signature: {
            type: String,
            required: false,
            maxLength: 255,
        },
        aadhar: {
            type: String,
            required: false,
            maxLength: 255,
        },
        pancard: {
            type: String,
            required: false,
            maxLength: 255,
        },
        cheque: {
            type: String,
            required: false,
            maxLength: 255,
        },
        licence: {
            type: String,
            required: false,
            maxLength: 255,
        },
        otp: {
            type: String,
            required: false,
            maxLength: 255,
        },
        tokenVersion: { type: Number, default: 0 },
    },
    { timestamps: true, }
);

module.exports = mongoose.model("OfficeStaf", officestafs);