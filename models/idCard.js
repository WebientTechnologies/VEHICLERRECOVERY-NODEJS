
const mongoose = require("mongoose");

const idcards = new mongoose.Schema(
    {
        cardId:{
            type:String,
            required:[true, "Please Enter Agent Id"],
            maxLength:255,
        },
        agentName: {
            type:String,
            required:false,
            maxLength:255,
        },
        fatherName: {
            type:String,
            required:false,
            maxLength:255,
        },
        mobile: {
            type:String,
            required:false,
            maxLength:255,
        },
        addressLine1: {
            type:String,
            required:false,
            maxLength:255,
        },
        addressLine2: {
            type:String,
            required:false,
            maxLength:255,
        },
        validFrom: {
            type:String,
            required:false,
            maxLength:255,
        },
        validTo: {
            type:String,
            required:false,
            maxLength:255,
        },
        status: {
            type:String,
            enum:["active", "inactive"],
            default:"inactive"
        },
        photo:{
            Bucket:{
                type:String,
                required:false,
                maxLength:255,
            },
            Key:{
                type:String,
                required:false,
                maxLength:255,
            },
            Url:{
                type:String,
                required:false,
                maxLength:255,
            }
        },
        signature:{
            Bucket:{
                type:String,
                required:false,
                maxLength:255,
            },
            Key:{
                type:String,
                required:false,
                maxLength:255,
            },
            Url:{
                type:String,
                required:false,
                maxLength:255,
            }
        },
        qrCode:{
            type:String,
            required:false,
            maxLength:5000,
          
        },
    },
    { timestamps: true,}
);

module.exports = mongoose.model("IdCard", idcards);