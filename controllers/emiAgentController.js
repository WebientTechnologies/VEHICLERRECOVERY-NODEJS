const EmiAgent = require('../models/emiAgent');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { options } = require("../routes/route");
const nodemailer = require('nodemailer');
require("dotenv").config();

exports.createAgent = async(req, res) =>{
    try {
        const {zoneId, name, mobile, alternativeMobile, email, panCard, aadharCard, address, state, city, pincode, username, password} =req.body;

        const existingAgent = await EmiAgent.findOne({mobile:mobile});
        if(existingAgent){
            return res.status(409).json({message:"Mobile Number Is Already Exist! Please Try With Another One. Or Log In"});
        }
        const existingPan = await EmiAgent.findOne({panCard:panCard});
        if(existingPan){
            return res.status(409).json({message:"Pan Number Is Already Exist! "});
        }
        const existingAadhar = await EmiAgent.findOne({aadharCard:aadharCard});
        if(existingAadhar){
            return res.status(409).json({message:"Aadhar Number Is Already Exist! "});
        }
        const existingUsername = await EmiAgent.findOne({username:username});
        if(existingUsername){
            return res.status(409).json({message:"Username Is Already Taken! "});
        }
        const latestAgent = await EmiAgent.findOne().sort({ agentId: -1 }).limit(1);

        let nextagentId;
        if (latestAgent) {
        const latestAgentIdNumber = parseInt(latestAgent.agentId.substring(3));
        nextagentId = `A${(latestAgentIdNumber + 1).toString().padStart(4, '0')}`;
        } else {
            nextagentId = 'A0001';
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newAgent = new EmiAgent({
            agentId:nextagentId,
            zoneId, 
            name, 
            mobile, 
            alternativeMobile, 
            email, 
            panCard, 
            aadharCard, 
            address, 
            state, 
            city, 
            pincode, 
            username, 
            password:hashedPassword
        });

        const savedAgent = await newAgent.save();
        return res.status(409).json({message:"Agent Created Successfully", data:savedAgent});
    } catch (error) {
        console.log(error);
        return res.status(409).json({message:"Something Went Worng"});
    }
};

exports.getEmiAgent = async(req, res) =>{
    try {
        const agents = await EmiAgent.find().populate('zoneId', 'name').select('-password').exec();
        return res.status(200).json({agents});
    } catch (error) {
        console.log(error);
        return res.status(409).json({message:"Something Went Worng"});
    }
};

exports.getAgentById = async(req, res) =>{
    try {
        const {id} = req.params;
        const agent = await EmiAgent.findById(id).populate('zoneId', 'name').select('-password').exec();
        return res.status(200).json({agent});
    } catch (error) {
        console.log(error);
        return res.status(409).json({message:"Something Went Worng"});
    }
};

exports.changeStatus = async(req, res) =>{
    try {
        const {id} = req.params;
        const {status} = req.body;

        const agent = await EmiAgent.findById(id);

        if(agent){
            agent.status = status;
            agent.save();

            return res.status(201).json({message:"Status Updated Successfully !"});
        }else{
            return res.status(404).json({message:"No Data Found"});
        }
    } catch (error) {
        return res.status(201).json({message:"Something Went Wrong!"});
    }
};

exports.changePassword = async(req, res) =>{
    try {
        const {id} = req.params;
        const {password, confirmPassword} = req.body;
        if(password != confirmPassword){
            return res.status(201).json({message:"Password and Confirm Password is not match."});
        }
        const agent = await EmiAgent.findById(id);

        if(agent){
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            agent.password = hashedPassword;
            agent.save();

            return res.status(201).json({message:"Password Changed Successfully!"});
        }else{
            return res.status(404).json({message:"No Data Found"});
        }
    } catch (error) {
        return res.status(201).json({message:"Something Went Wrong!"});
    }
};

exports.changeDevice = async(req, res) =>{
    try {
        const {id,} = req.params;
        const deviceId = null;
       
        const agent = await EmiAgent.findById(id);

        if(agent){
            agent.deviceId = deviceId;
            agent.save();

            return res.status(201).json({message:"Device Changed Successfully!"});
        }else{
            return res.status(404).json({message:"No Data Found"});
        }
    } catch (error) {
        return res.status(201).json({message:"Something Went Wrong!"});
    }
};

