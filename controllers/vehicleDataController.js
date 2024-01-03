
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
    const { fileName, month, count, createdAt, page = 1 } = req.query;
  
    const filterCriteria = {};
    if (fileName) filterCriteria.fileName = fileName;
    if (month) filterCriteria.month = month;
    if (count) filterCriteria.count = parseInt(count);
    if (createdAt) {
        // Assuming createdAt is a string in the format "YYYY-MM-DD"
        const startDate = new Date(createdAt);
        const endDate = new Date(createdAt);
        endDate.setDate(endDate.getDate() + 1); // Add one day to cover the entire day
        filterCriteria.createdAt = { $gte: startDate, $lt: endDate };
    }
  
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
        $skip: (page - 1) * 10, 
      },
      {
        $limit: 10, 
      },
    ];
  
    const result = await VehicleData.aggregate(aggregationPipeline);
  
    res.status(200).json({ data: result });
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
    const data = await VehicleData.findOne({agreementNo:req.query.agreementNo});
    return res.status(200).json({data});
  }
  if(req.query.engineNo){
    const data = await VehicleData.findOne({engineNo:req.query.engineNo});
    return res.status(200).json({data});
  }
  if(req.query.chasisNo){
    const data = await VehicleData.findOne({chasisNo:req.query.chasisNo});
    return res.status(200).json({data});
  }
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

  const vehiclesList = await VehicleData.find().skip(skip).limit(pageSize).populate('seezerId','name').exec();

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
  const vehiclesList = await VehicleData.find({status:"hold"}).skip(skip).limit(pageSize).populate('seezerId','name').exec();
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
  const vehiclesList = await VehicleData.find({status:"repo"}).skip(skip).limit(pageSize).populate('seezerId','name').exec();
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