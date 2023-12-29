const RepoAgent = require('../models/repoAgent');
const bcrypt = require('bcryptjs');
const { catchError } = require("../middlewares/CatchError");

exports.createRepoAgent = catchError(async (req, res) => {
    
      const {zoneId, stateId, cityId, name, mobile,alternativeMobile, email, panCard, aadharCard, addressLine1, addressLine2, state, city, pincode, username, password } = req.body;
  
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const existingAgent = await RepoAgent.findOne({mobile:mobile});
        if(existingAgent){
            return res.status(409).json({message:"Mobile Number Is Already Exist! Please Try With Another One. Or Log In"});
        }
        const existingPan = await RepoAgent.findOne({panCard:panCard});
        if(existingPan){
            return res.status(409).json({message:"Pan Number Is Already Exist! "});
        }
        const existingAadhar = await RepoAgent.findOne({aadharCard:aadharCard});
        if(existingAadhar){
            return res.status(409).json({message:"Aadhar Number Is Already Exist! "});
        }
        const existingUsername = await RepoAgent.findOne({username:username});
        if(existingUsername){
            return res.status(409).json({message:"Username Is Already Taken! "});
        }
        const latestAgent = await RepoAgent.findOne().sort({ agentId: -1 }).limit(1);

        let nextagentId;
        if (latestAgent) {
        const latestAgentIdNumber = parseInt(latestAgent.agentId.substring(3));
        nextagentId = `S${(latestAgentIdNumber + 1).toString().padStart(4, '0')}`;
        } else {
            nextagentId = 'S0001';
        }
     const userId = req.user ? req.user._id : req.officeStaf._id;
     const type = req.user ? 'User' : 'OfficeStaf'
      const newRepoAgent = new RepoAgent({
        agentId:nextagentId,
        zoneId, 
        stateId, 
        cityId,
        name,
        mobile,
        alternativeMobile, 
        email, 
        panCard, 
        aadharCard, 
        addressLine1,
        addressLine2, 
        state, 
        city, 
        pincode, 
        username, 
        password:hashedPassword,
        createdBy:userId,
        createdByType: type
      });
  
      const savedRepoAgent = await newRepoAgent.save();
      console.log("Repo Agent Created:", savedRepoAgent);
     return res.status(201).json({savedRepoAgent});
    
  });
  

  exports.changeStatus = async(req, res) =>{
    try {
        const {id} = req.params;
        const {status} = req.body;

        const agent = await RepoAgent.findById(id);

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
        const agent = await RepoAgent.findById(id);

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
       
        const agent = await RepoAgent.findById(id);

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

exports.getAllRepoAgents = catchError(async(req, res) =>{
    const agents = await RepoAgent.find()
                    .populate('zoneId', 'name')
                    .populate('stateId', 'name')
                    .populate('cityId', 'name')
                    .populate('createdBy', 'name')
                    .exec();
    return res.status(201).json({agents});
});

exports.getAgentById = catchError(async(req, res) =>{
    const {id} = req.params
    const agent = await RepoAgent.findById(id)
                    .populate('zoneId', 'name')
                    .populate('stateId', 'name')
                    .populate('cityId', 'name')
                    .populate('createdBy', 'name')
                    .exec();
    return res.status(201).json({agent});
});

exports.getNewAgentId = catchError(async(req, res) =>{
    const latestAgent = await RepoAgent.findOne().sort({ agentId: -1 }).limit(1);

    let nextagentId;
    if (latestAgent) {
    const latestAgentIdNumber = parseInt(latestAgent.agentId.substring(3));
    nextagentId = `S${(latestAgentIdNumber + 1).toString().padStart(4, '0')}`;
    } else {
        nextagentId = 'S0001';
    }

    res.status(200).json({
        success: true,
        agentId: nextagentId,
    });
})