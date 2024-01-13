
const xlsx = require("xlsx");
const VehicleData = require("../models/vehiclesData"); 
const {catchError} = require('../middlewares/CatchError')

exports.uploadFile = catchError(async (req, res) => {
  
    // Check if the file is provided
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Parse the Excel file
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Get the month from the request
    const month = req.body.month; 
    const loadStatus = "Success";
    const latestRecord = await VehicleData.findOne({
        month: month,
      }).sort({ fileName: -1 });
  
      // Extract the suffix number from the latest fileName
      let fileNameSuffix = 1;
      if (latestRecord && latestRecord.fileName) {
        const match = latestRecord.fileName.match(/(\d+)/);
        fileNameSuffix = match ? parseInt(match[0]) + 1 : 1;
      }
  
      // Process each row and create records in the database
    for (const row of data) {
      const fileName = `${month}${fileNameSuffix}.xlsx`;
      const lastDigit = row.LastDigit || (row.Regdno ? row.Regdno.slice(-4) : '');

      const vehicleData = new VehicleData({
        bankName: row.Bankname,
        branch: row.Branch,
        agreementNo: row.Agreementno,
        customerName: row.Custname,
        regNo: row.Regdno,
        chasisNo: row.Chasisno,
        engineNo: row.Engineno,
        model: row.Model,
        dlCode: row.Dlcode,
        bucket: row.BUCKET,
        emi: row.EMI,
        color: row.COLOR,
        callCenterNo1: row.Callcenterno1,
        callCenterNo1Name: row.Callcenterno1name,
        callCenterNo1Email: row.Callcenterno1mailid,
        callCenterNo2: row.Callcenterno2,
        callCenterNo2Name: row.Callcenterno2name,
        callCenterNo2Email: row.Callcenterno2mailid,
        callCenterNo3: row.Callcenterno3,
        callCenterNo3Name: row.Callcenterno3name,
        callCenterNo3Email: row.Callcenterno3mailid,
        callCenterNo4: row.Callcenterno4,
        callCenterNo4Name: row.Callcenterno4name,
        callCenterNo4Email: row.Callcenterno4mailid,
        lastDigit: lastDigit,
        month: month,
        loaStatus: loadStatus,
        fileName: fileName,
      });

      await vehicleData.save();
    }

    res.status(200).json({ message: "File uploaded successfully" });
 
});

exports.uploadBankWiseData = catchError(async (req, res) => {
  
    // Check if the file is provided
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Parse the Excel file
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const month = req.body.month; 
    const bank = req.body.bank; 
    const latestRecord = await VehicleData.findOne({
        month: month,
      }).sort({ fileName: -1 });
  
    const latestRecordByBank = await VehicleData.findOne({
      month: month,
    }).sort({ bankName: -1 });

  
    let fileNameSuffix = 1;
    if (latestRecord && latestRecord.fileName) {
      const match = latestRecord.fileName.match(/(\d+)/);
      fileNameSuffix = match ? parseInt(match[0]) + 1 : 1;
    }
    let bankNameSuffix = 1;
    const simplifiedBankName = bank.split(' ')[0];
    if (latestRecordByBank && latestRecordByBank.bankName) {
      const trimmedBankName = latestRecordByBank.bankName.slice(0, -1);
      const reqBankName = `${simplifiedBankName } ${month}`;
      if(trimmedBankName == reqBankName ){
        const match = latestRecordByBank.bankName.match(/(\d+)$/);
        bankNameSuffix = match ? parseInt(match[0]) + 1 : 1;
      }else{
        bankNameSuffix = 1;
      }
    }
   
    for (const row of data) {
      const fileName = `${month}${fileNameSuffix}.xlsx`;

      
      let bankName = `${simplifiedBankName } ${month}${bankNameSuffix}`;

      const lastDigit = row.LastDigit || (row.Regdno ? row.Regdno.slice(-4) : '');
      const vehicleData = new VehicleData({
        bankName: bankName,
        branch: row.Branch,
        agreementNo: row.Agreementno,
        customerName: row.Custname,
        regNo: row.Regdno,
        chasisNo: row.Chasisno,
        engineNo: row.Engineno,
        model: row.Model,
        dlCode: row.Dlcode,
        bucket: row.BUCKET,
        emi: row.EMI,
        color: row.COLOR,
        callCenterNo1: row.Callcenterno1,
        callCenterNo1Name: row.Callcenterno1name,
        callCenterNo1Email: row.Callcenterno1mailid,
        callCenterNo2: row.Callcenterno2,
        callCenterNo2Name: row.Callcenterno2name,
        callCenterNo2Email: row.Callcenterno2mailid,
        callCenterNo3: row.Callcenterno3,
        callCenterNo3Name: row.Callcenterno3name,
        callCenterNo3Email: row.Callcenterno3mailid,
        callCenterNo4: row.Callcenterno4,
        callCenterNo4Name: row.Callcenterno4name,
        callCenterNo4Email: row.Callcenterno4mailid,
        lastDigit: lastDigit,
        month: month,
        fileName: fileName,
      });

      await vehicleData.save();
    }

    res.status(200).json({ message: "File uploaded successfully" });
 
});

exports.getUploadedData = catchError(async (req, res) => {
  const { search, page = 1, pageSize = 10 } = req.query;

  const filterCriteria = {};
 

  const searchRegex = new RegExp(search, 'i');
  const searchFields = ['fileName', 'month', 'count', 'createdAt'];

  if (search) {
    filterCriteria.$or = searchFields.map(field => ({ [field]: searchRegex }));
  }

  const skip = (page - 1) * pageSize;

  const aggregationPipeline = [
    {
      $match: filterCriteria,
    },
    {
      $group: {
        _id: {
          fileName: "$fileName",
          month: "$month",
          createdAt: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
        },
        count: { $sum: 1 },
        status: { $first: "Success" },
      },
    },
    {
      $project: {
        _id: 0,
        fileName: "$_id.fileName",
        month: "$_id.month",
        createdAt: "$_id.createdAt",
        count: 1,
        status: "$status",
      },
    },
    {
      $skip: skip,
    },
    {
      $limit: pageSize,
    },
  ];

  const result = await VehicleData.aggregate(aggregationPipeline);

  const totalRecords = await VehicleData.aggregate([
    { $match: filterCriteria },
    {
      $group: {
        _id: {
          fileName: "$fileName",
          month: "$month",
          createdAt: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
        },
        count: { $sum: 1 },
        status: { $first: "Success" },
      },
    },
    {
      $project: {
        _id: 0,
        fileName: "$_id.fileName",
        month: "$_id.month",
        createdAt: "$_id.createdAt",
        count: 1,
        status: "$status",
      },
    },
  ]);

  const totalPages = Math.ceil(totalRecords.length > pageSize ? totalRecords.length / pageSize : 1);

  res.status(200).json({
    data: result,
    totalPages: totalPages,
    currentPage: page,
  });
});

  
exports.getVehicleStatusCounts = catchError(async (req, res) => {
 
    const totalCount = await VehicleData.countDocuments();
    
    const holdCount = await VehicleData.countDocuments({ status: "hold" });
    
    const repoCount = await VehicleData.countDocuments({ status: "repo" });
    
    const releaseCount = await VehicleData.countDocuments({ status: "release" });

    const confirmationCount = await VehicleData.countDocuments({ status: "pending" });

    res.status(200).json({
      totalCount: totalCount,
      holdCount: holdCount,
      repoCount: repoCount,
      releaseCount: releaseCount,
      confirmationCount: confirmationCount,
    });
});

exports.staffDashboard = catchError(async (req, res) => {
 
 
  const holdCount = await VehicleData.countDocuments({ status: "hold" });
  
  const repoCount = await VehicleData.countDocuments({ status: "repo" });
  
  const releaseCount = await VehicleData.countDocuments({ status: "release" });
  const searchCount = await VehicleData.countDocuments({ status: "search" });


  res.status(200).json({
    holdCount: holdCount,
    repoCount: repoCount,
    releaseCount: releaseCount,
    searchCount: searchCount,
  });
});

exports.searchVehicle = catchError(async(req, res) =>{
  if(req.query.lastDigit){
    const regNos = await VehicleData.find({lastDigit:req.query.lastDigit}).select('regNo').exec();
    return res.status(200).json({regNos});
  }
  if(req.query.agreementNo){
    const data = await VehicleData.find({agreementNo:req.query.agreementNo});
    return res.status(200).json({data});
  }
  if(req.query.engineNo){
    const data = await VehicleData.find({engineNo:req.query.engineNo});
    return res.status(200).json({data});
  }
  if(req.query.chasisNo){
    const data = await VehicleData.find({chasisNo:req.query.chasisNo});
    return res.status(200).json({data});
  }
});

exports.search = catchError(async (req, res) => {
  let data = [];

  if (req.query.lastDigit) {
    data = await VehicleData.find({ lastDigit: req.query.lastDigit });
  } else if (req.query.agreementNo) {
    data = await VehicleData.find({ agreementNo: req.query.agreementNo });
  } else if (req.query.engineNo) {
    data = await VehicleData.find({ engineNo: req.query.engineNo });
  } else if (req.query.chasisNo) {
    data = await VehicleData.find({ chasisNo: req.query.chasisNo });
  }

  return res.status(200).json({ data });
});

exports.getByRegNo = catchError(async(req, res) =>{
  const {regNo} = req.params;
  const data = await VehicleData.findOne({regNo:regNo});
  return res.status(200).json({data});
});

exports.allVehicleList = catchError(async (req, res) => {
  const page = parseInt(req.query.page) || 1; 
  const pageSize = 10; 

  const skip = (page - 1) * pageSize;
  let query = {  };
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
        {dlCode: searchRegex},   
        { 'seezerId.name': searchRegex },
      ],
    };
  }

  const vehiclesList = await VehicleData.find(query).skip(skip).limit(pageSize).populate('seezerId','name').exec();

  return res.status(200).json({
    vehiclesList,
    currentPage: page,
    totalPages: Math.ceil(await VehicleData.countDocuments() / pageSize),
  });
});


exports.holdVehicleList = catchError(async(req, res) => {
  const page = parseInt(req.query.page) || 1; 
  const pageSize = 10;
  const skip = (page - 1) * pageSize;
  let query = { status: "hold" };
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
        {dlCode: searchRegex},   
        { 'seezerId.name': searchRegex },
      ],
    };
  }
  const vehiclesList = await VehicleData.find(query).skip(skip).limit(pageSize).populate('seezerId','name').exec();
  return res.status(200).json({
    vehiclesList,
    currentPage: page,
    totalPages: Math.ceil(await VehicleData.countDocuments() / pageSize),
  });
});

exports.repoVehicleList = catchError(async(req, res) => {
  const page = parseInt(req.query.page) || 1; 
  const pageSize = 10;
  const skip = (page - 1) * pageSize;
  let query = { status: "repo" };
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
        {dlCode: searchRegex},   
        { 'seezerId.name': searchRegex },
      ],
    };
  }
  const vehiclesList = await VehicleData.find(query).skip(skip).limit(pageSize).populate('seezerId','name').exec();
  return res.status(200).json({
    vehiclesList,
    currentPage: page,
    totalPages: Math.ceil(await VehicleData.countDocuments() / pageSize),
  });
});

exports.releaseVehicleList = catchError(async(req, res) => {
  const page = parseInt(req.query.page) || 1; 
  const pageSize = 10;
  const skip = (page - 1) * pageSize;
  let query = { status: "release" };
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
        {dlCode: searchRegex},   
        { 'seezerId.name': searchRegex },
      ],
    };
  }
  const vehiclesList = await VehicleData.find(query).skip(skip).limit(pageSize).populate('seezerId','name').exec();
  return res.status(200).json({
    vehiclesList,
    currentPage: page,
    totalPages: Math.ceil(await VehicleData.countDocuments() / pageSize),
  });
});

exports.searchedVehicleList = catchError(async(req, res) => {
  const page = parseInt(req.query.page) || 1; 
  const pageSize = 10;
  const skip = (page - 1) * pageSize;
  let query = { status: "search" };
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
        {dlCode: searchRegex},   
        { 'seezerId.name': searchRegex },
      ],
    };
  }
  const vehiclesList = await VehicleData.find(query).skip(skip).limit(pageSize).populate('seezerId','name').exec();
  return res.status(200).json({
    vehiclesList,
    currentPage: page,
    totalPages: Math.ceil(await VehicleData.countDocuments() / pageSize),
  });
});

exports.confirmationVehicleList = catchError(async(req, res) => {
  const page = parseInt(req.query.page) || 1; 
  const pageSize = 10;
  const skip = (page - 1) * pageSize;
  let query = { status: "pending" };
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
        {dlCode: searchRegex},   
        { 'seezerId.name': searchRegex },
      ],
    };
  }
  const vehiclesList = await VehicleData.find(query).skip(skip).limit(pageSize).populate('seezerId','name').exec();
  return res.status(200).json({
    vehiclesList,
    currentPage: page,
    totalPages: Math.ceil(await VehicleData.countDocuments() / pageSize),
  });
});



function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}


exports.getData = catchError(async(req, res) =>{
  let data = [];
  let totalRecords = 0;
  const month = new RegExp(req.query.month, 'i');
  const banks = req.query.bank ? req.query.bank.split(',') : [];
  const branches = req.query.branch ? req.query.branch.split(',') : [];
  const callCenterNos = req.query.callCenterNo ? req.query.callCenterNo.split(',') : [];

  const query = {
    month: month
  };

  // Add optional parameters to the query if provided
  if (banks.length > 0) {
    query.bankName = { $in: banks.map(bank => new RegExp(bank.trim(), 'i')) };
  }

  if (branches.length > 0) {
    query.branch = { $in: branches.map(branch => new RegExp(branch.trim(), 'i')) };
  }

  if (callCenterNos.length > 0) {
    query.callCenterNo1 = { $in: callCenterNos.map(callCenterNo => callCenterNo.trim()) };
  }
  data = await VehicleData.find(query).select('bankName branch callCenterNo1');
  totalRecords = await VehicleData.countDocuments(query);
  return res.status(200).json({ data, totalRecords });
});


exports.deleteData = catchError(async(req, res) =>{
  let query = {};

  const month = new RegExp(req.query.month, 'i');
  const banks = req.query.bank ? req.query.bank.split(',') : [];
  const branches = req.query.branch ? req.query.branch.split(',') : [];
  const callCenterNos = req.query.callCenterNo ? req.query.callCenterNo.split(',') : [];

   query.month = month;
  

  // Add optional parameters to the query if provided
  if (banks.length > 0) {
    query.bankName = { $in: banks.map(bank => new RegExp(bank.trim(), 'i')) };
  }

  if (branches.length > 0) {
    query.branch = { $in: branches.map(branch => new RegExp(branch.trim(), 'i')) };
  }

  if (callCenterNos.length > 0) {
    query.callCenterNo1 = { $in: callCenterNos.map(callCenterNo => callCenterNo.trim()) };
  }

  if (Object.keys(query).length === 0) {
    return res.status(400).json({ message: 'Invalid query parameters for deletion.' });
  }

  const result = await VehicleData.deleteMany(query);

  return res.status(200).json({ message: `${result.deletedCount} records deleted successfully.` });

});

exports.deleteDataByFIleName = catchError(async(req, res) =>{
  const fileName = new RegExp(req.params.fileName, 'i');
  const result = await VehicleData.deleteMany({fileName:fileName});

  return res.status(200).json({ message: `${result.deletedCount} records deleted successfully.` });
});

exports.changeStatus = catchError(async(req, res) =>{
  const {agreementNo} = req.params;
  const {status} = req.body;
  const details = await VehicleData.findOne({agreementNo:agreementNo});

  if(!details){
    return res.status(404).json({message:"Record Not Found"});
  }

  details.status = status;
  const savedDetails = await details.save();

  return res.status(200).json({data:savedDetails, message:"Status Changed Successfully!"});
})