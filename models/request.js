
const mongoose = require("mongoose");

const requests = new mongoose.Schema(
    {  
        recordId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VehicleData',
            required: false,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'createdByType', 
            required: false,
        },
        createdByType: {
            type: String,
            enum: ['RepoAgent', 'OfficeStaf'],
            required: false,
        },
        requestFor: {
            type:String,
            required:false,
            maxLength:255,
        },
        bankName: {
            type:String,
            required:false,
            maxLength:255,
        },
        branch: {
            type:String,
            required:false,
            maxLength:255,
        },
        agreementNo: {
            type:String,
            required:false,
            maxLength:255,
        },
        customerName: {
            type:String,
            required:false,
            maxLength:255,
        },
        regNo: {
            type:String,
            required:false,
            maxLength:255,
        },
        chasisNo: {
            type:String,
            required:false,
            maxLength:255,
        },
        engineNo: {
            type:String,
            required:false,
            maxLength:255,
        },
        model: {
            type:String,
            required:false,
            maxLength:255,
        },
        maker: {
            type:String,
            required:false,
            maxLength:255,
        },
        bucket: {
            type:String,
            required:false,
            maxLength:255,
        },
        emi: {
            type:String,
            required:false,
            maxLength:255,
        },        
        status: {
            type:String,
            enum:["hold", "repo", "release"],
            required:false
        },
        loadStatus: {
            type:String,
            enum:["empty", "goods", " "],
            default:" "
        },
        loadItem: {
            type:String,
            required:false,
            maxLength:255,
        },

    },
    { timestamps: true,}
);

module.exports = mongoose.model("Request", requests);