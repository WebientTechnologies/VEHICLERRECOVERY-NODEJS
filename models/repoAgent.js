
const mongoose = require("mongoose");

const repoagents = new mongoose.Schema(
    {
        agentId:{
            type:String,
            required:[true, "Please Enter Agent Id"],
            maxLength:255,
        },
        zoneId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Zone',
            required: false,
        },
        stateId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'State',
            required: false,
        },
        cityId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'City',
            required: false,
        },
        name: {
            type:String,
            required:[true, "Please Enter Name"],
            maxLength:255,
        },
        mobile: {
            type:String,
            required:[true, "Please Enter Mobile"],
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
            required:[true, "Please Enter Pan Number"],
            maxLength:255,
        },
        aadharCard: {
            type:String,
            required:[true, "Please Enter Adhar Number"],
            maxLength:255,
        },
        addressLine1: {
            type:String,
            required:[true, "Please Enter Address"],
            maxLength:500,
        },
        addressLine2: {
            type:String,
            required:false,
            maxLength:500,
        },
        paymentMethod: {
            type:String,
            required:false,
            maxLength:255,
        },     
        bankName: {
            type:String,
            required:false,
            maxLength:255,
        },
        accountHolder: {
            type:String,
            required:false,
            maxLength:255,
        },
        accountNumber: {
            type:String,
            required:false,
            maxLength:255,
        },
        ifscCode: {
            type:String,
            required:false,
            maxLength:255,
        },
        frName1: {
            type:String,
            required:false,
            maxLength:255,
        },
        frRelation1: {
            type:String,
            required:false,
            maxLength:255,
        },
        frMobile1: {
            type:String,
            required:false,
            maxLength:255,
        },
        frName2: {
            type:String,
            required:false,
            maxLength:255,
        },
        frRelation2: {
            type:String,
            required:false,
            maxLength:255,
        },
        frMobile2: {
            type:String,
            required:false,
            maxLength:255,
        },
        endDate: {
            type:String,
            required:false,
            maxLength:255,
        },
        latitude: {
            type:String,
            required:false,
            maxLength:255,
        },
        longitude: {
            type:String,
            required:false,
            maxLength:255,
        },
        state: {
            type:String,
            required:[true, "Please Enter State"],
            maxLength:255,
        },
        city: {
            type:String,
            required:[true, "Please Enter City"],
            maxLength:255,
        },
        pincode: {
            type:Number,
            required:[true, "Please Enter Pincode"],
            maxLength:10,
        },
        username: {
            type:String,
            required:[true, "Please Enter Username"],
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
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'createdByType', 
            required: false,
        },
        createdByType: {
            type: String,
            enum: ['User', 'OfficeStaf'],
            required: false,
        },
        tokenVersion: { type: Number, default: 0 },
    },
    { timestamps: true,}
);

module.exports = mongoose.model("RepoAgent", repoagents);