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
    const {id} = req.params;
    const status = "hold";
    const vehicle = await VehicleData.findByIdAndUpdate({_id:id}, {status:status, seezerId:userId}, {new:true});
    const newRequest = new Request({
        recordId: vehicle._id,
        createdBy : userId,
        createdByType : type,
        requestFor : message,
        bankName : vehicle.bankName,
        branch : vehicle.branch,
        agreementNo : vehicle.agreementNo,
        customerName : vehicle.customerName,
        regNo : vehicle.regNo,
        chasisNo :vehicle.chasisNo,
        engineNo :vehicle.engineNo,
        model:vehicle.model,
        maker :vehicle.maker,
        bucket :vehicle.bucket,
        emi :vehicle.emi,
        status:status
    });

    const savedRequest = await newRequest.save();

    return res.status(200).json({savedRequest});
});

exports.getRequests = catchError(async(req, res) =>{
    const page = parseInt(req.query.page) || 1; 
    const pageSize = 10;
    const skip = (page - 1) * pageSize;
    let query = {status:"hold"};
    if (req.query.search) {
      const searchRegex = new RegExp(escapeRegex(req.query.search), 'gi');
      query = {
        ...query,
        $or: [
          { bankName: searchRegex },
          { branch: searchRegex },
          {agreementNo: searchRegex},
          {customerName: searchRegex},
          {regNo: searchRegex},
          {chasisNo: searchRegex},
          {engineNo: searchRegex},
          {model: searchRegex},   
          { 'createdBy.name': searchRegex },
        ],
      };
    }
    const requests = await Request.find(query).skip(skip).limit(pageSize).populate('createdBy', 'name').populate('recordId').exec();
    return res.status(201).json({requests,
        currentPage: page,
        totalPages: Math.ceil(await Request.countDocuments(query) / pageSize),});
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}