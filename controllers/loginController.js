const OfficeStaf = require('../models/officeStaf');
const RepoAgent = require('../models/repoAgent');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { options } = require("../routes/route");
const nodemailer = require('nodemailer');
require("dotenv").config();
const { catchError } = require("../middlewares/CatchError");

exports.login = async (req,res) => {
    try {

      const {username, password, deviceId} = req.body;
      if(!username || !password) {
          return res.status(400).json({
              success:false,
              message:'PLease fill all the details carefully',
          });
      }

      let staf = await OfficeStaf.findOne({username});
        if(!staf) {

            let agent = await RepoAgent.findOne({username});
            if(!agent) {
                return res.status(401).json({
                    success:false,
                    message:'User Not registered',
                });
            }
            if (agent.deviceId === deviceId || !agent.deviceId) {
                const payload = {
                    username:agent.username,
                    _id:agent._id,
                    tokenVersion:agent.tokenVersion,
                };
                if(await bcrypt.compare(password,agent.password) ) {
                    let token =  jwt.sign(payload, 
                                        process.env.JWT_SECRET,
                                        {
                                            expiresIn:"15d",
                                        });
                    if(!agent.deviceId){
                        agent.deviceId = deviceId;
                    }
                    await agent.save();
                    agent = agent.toObject();
                    agent.token = token;
                    agent.password = undefined;
    
                    const options = {
                        expires: new Date( Date.now() + 15 * 24 * 60 * 60 * 1000),
                        httpOnly:true,
                        sameSite: 'none',
                        secure: true,
                    }
    
                    res.cookie("token", token, options).status(200).json({
                        success:true,
                        agent,
                        role: "repo-agent",
                        message:'Repo Agent Logged in successfully',
                    });
                }
                else {
                    return res.status(403).json({
                        success:false,
                        message:"Password Incorrect",
                    });
                }
            }else {
                return res.status(403).json({
                success: false,
                message: 'You have already logged In to other device! Ask Admin to change device.',
                });
            }

        }
      else{
        if (staf.deviceId === deviceId || !staf.deviceId) {
            const payload = {
                username:staf.username,
                _id:staf._id,
                tokenVersion:staf.tokenVersion,
            };
            if(await bcrypt.compare(password,staf.password) ) {
                let token =  jwt.sign(payload, 
                                    process.env.JWT_SECRET,
                                    {
                                        expiresIn:"15d",
                                    });
                if(!staf.deviceId){
                    staf.deviceId = deviceId;
                }
                await staf.save();
                staf = staf.toObject();
                staf.token = token;
                staf.password = undefined;

                const options = {
                    expires: new Date( Date.now() + 15 * 24 * 60 * 60 * 1000),
                    httpOnly:true,
                    sameSite: 'none',
                    secure: true,
                }

                res.cookie("token", token, options).status(200).json({
                    success:true,
                    staf,
                    role: "office-staff",
                    message:'Office Staf Logged in successfully',
                });
            }
            else {
                return res.status(403).json({
                    success:false,
                    message:"Password Incorrect",
                });
            }
        }else {
            return res.status(403).json({
            success: false,
            message: 'You have already logged In to other device! Ask Admin to change device.',
            });
        }
      }
      
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:'Login Failure',
        });

    }
}