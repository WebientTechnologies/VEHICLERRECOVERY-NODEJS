const Request = require("../models/request");
const VehicleData = require("../models/vehiclesData");
const {catchError} = require("../middlewares/CatchError")

exports.requestToChangeDeice = catchError(async(req, res) =>{
    const userId = req.repoAgent ? req.repoAgent._id : req.officeStaf._id;
    const type = req.repoAgent ? 'RepoAgent' : 'OfficeStaf';
    const message = "Request To Change Device";
    const newRequest = new Request({
        createdBy : userId,
        createdByType : type,
        requestFor : message
    });

    const savedRequest = await newRequest.save();

    return res.status(200).json({savedRequest});
});

exports.requestToRepoVehicle = catchError(async(req, res) =>{
    const userId = req.repoAgent._id ;
    const type = 'RepoAgent' ;
    const message = "Request To Hold Vehicle";
    const {regNo} = req.body;
    const status = "hold";
    const vehicle = await VehicleData.findOneAndUpdate({regNo:regNo}, {status:status, seezerId:userId}, {new:true});
    const newRequest = new Request({
        createdBy : userId,
        createdByType : type,
        requestFor : message,
        bankName : vehicle.bankName,
        branch : vehicle.branch,
        agreementNo : vehicle.agreementNo,
        customerName : vehicle.customerName,
        regNo : regNo,
        chasisNo :vehicle.chasisNo,
        engineNo :vehicle.engineNo,
        model:vehicle.model,
        maker :vehicle.maker,
        bucket :vehicle.bucket,
        emi :vehicle.emi,
    });

    const savedRequest = await newRequest.save();

    return res.status(200).json({savedRequest});
})