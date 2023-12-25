
const mongoose = require("mongoose");

const emiagents = new mongoose.Schema(
    {
        agentId:{
            type:String,
            required:true,
            maxLength:255,
        },
        zoneId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Zone',
            required: true,
        },
        name: {
            type:String,
            required:true,
            maxLength:255,
        },
        mobile: {
            type:String,
            required:true,
            maxLength:255,
        },
        alternativeMobile: {
            type:String,
            required:false,
            maxLength:255,
        },
        email: {
            type:String,
            required:false,
            maxLength:255,
        },
        panCard: {
            type:String,
            required:true,
            maxLength:255,
        },
        aadharCard: {
            type:String,
            required:true,
            maxLength:255,
        },
        address: {
            type:String,
            required:true,
            maxLength:500,
        },
        state: {
            type:String,
            required:true,
            maxLength:255,
        },
        city: {
            type:String,
            required:true,
            maxLength:255,
        },
        pincode: {
            type:Number,
            required:true,
            maxLength:10,
        },
        username: {
            type:String,
            required:true,
            maxLength:255,
        },
        password: {
            type:String,
            required:true,
            maxLength:255,
        },
        status: {
            type:String,
            enum:["active", "inactive"],
            default:"inactive"
        },
        deviceId: {
            type:String,
            required:false,
            maxLength:255,
        },
    },
    { timestamps: true,}
);

module.exports = mongoose.model("EmiAgent", emiagents);