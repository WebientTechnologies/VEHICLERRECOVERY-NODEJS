
const xlsx = require("xlsx");
const VehicleData = require("../models/vehiclesData");
const Request = require("../models/request");
const { catchError } = require('../middlewares/CatchError')

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
  const batchSize = 100; // Set an appropriate batch size
  const recordsToInsert = [];
  const latestRecord = await VehicleData.findOne({ month: month, fileName: { $exists: true, $ne: null } })
    .sort({ _id: -1 })
    .exec();

  // Extract the suffix number from the latest fileName
  let fileNameSuffix = 1;
  if (latestRecord && latestRecord.fileName) {
    const match = latestRecord.fileName.match(/(\d+)/);
    fileNameSuffix = match ? parseInt(match[0]) + 1 : 1;
  }

  // Process each row and create records in the database
  for (const row of data) {
    const fileName = `${month}${fileNameSuffix}.xlsx`;
    const lastDigit = row.LastDigit || (row.Regdno && typeof row.Regdno === 'string' ? row.Regdno.slice(-4) : '');

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
      maker: row.Maker,
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
    recordsToInsert.push(vehicleData);
    if (recordsToInsert.length >= batchSize) {
      await VehicleData.insertMany(recordsToInsert);
      recordsToInsert.length = 0; // Clear the array
    }

  }

  // Insert any remaining records
  if (recordsToInsert.length > 0) {
    await VehicleData.insertMany(recordsToInsert);
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
  const batchSize = 100; // Set an appropriate batch size
  const recordsToInsert = [];
  const latestRecord = await VehicleData.findOne({ month: month, fileName: { $exists: true, $ne: null } })
    .sort({ _id: -1 })
    .exec();

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
    const reqBankName = `${simplifiedBankName} ${month}`;
    if (trimmedBankName == reqBankName) {
      const match = latestRecordByBank.bankName.match(/(\d+)$/);
      bankNameSuffix = match ? parseInt(match[0]) + 1 : 1;
    } else {
      bankNameSuffix = 1;
    }
  }

  for (const row of data) {
    const fileName = `${month}${fileNameSuffix}.xlsx`;


    let bankName = `${simplifiedBankName} ${month}${bankNameSuffix}`;

    const lastDigit = row.LastDigit || (row.Regdno && typeof row.Regdno === 'string' ? row.Regdno.slice(-4) : '');
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
      maker: row.Maker,
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

    recordsToInsert.push(vehicleData);
    if (recordsToInsert.length >= batchSize) {
      await VehicleData.insertMany(recordsToInsert);
      recordsToInsert.length = 0; // Clear the array
    }

  }

  // Insert any remaining records
  if (recordsToInsert.length > 0) {
    await VehicleData.insertMany(recordsToInsert);
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

exports.searchVehicle = catchError(async (req, res) => {
  if (req.query.lastDigit) {
    const regNos = await VehicleData.find({ lastDigit: req.query.lastDigit }).select('regNo').exec();
    return res.status(200).json({ regNos });
  }
  if (req.query.agreementNo) {
    const data = await VehicleData.find({ agreementNo: req.query.agreementNo });
    return res.status(200).json({ data });
  }
  if (req.query.engineNo) {
    const data = await VehicleData.find({ engineNo: req.query.engineNo });
    return res.status(200).json({ data });
  }
  if (req.query.chasisNo) {
    const data = await VehicleData.find({ chasisNo: req.query.chasisNo });
    return res.status(200).json({ data });
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

exports.getByRegNo = catchError(async (req, res) => {
  const { regNo } = req.params;
  const data = await VehicleData.findOne({ regNo: regNo });
  return res.status(200).json({ data });
});

exports.allVehicleList = catchError(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = 10;

  const skip = (page - 1) * pageSize;
  let query = {};
  if (req.query.search) {
    const searchRegex = new RegExp(escapeRegex(req.query.search), 'gi');
    query = {
      ...query,
      $or: [
        { bankName: searchRegex },
        { branch: searchRegex },
        { agreementNo: searchRegex },
        { customerName: searchRegex },
        { regNo: searchRegex },
        { chasisNo: searchRegex },
        { engineNo: searchRegex },
        { model: searchRegex },
        { dlCode: searchRegex },
        { 'seezerId.name': searchRegex },
      ],
    };
  }

  const vehiclesList = await VehicleData.find(query).skip(skip).limit(pageSize).populate('seezerId', 'name').exec();

  return res.status(200).json({
    vehiclesList,
    currentPage: page,
    totalPages: Math.ceil(await VehicleData.countDocuments(query) / pageSize),
  });
});


exports.holdVehicleList = catchError(async (req, res) => {
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
        { agreementNo: searchRegex },
        { customerName: searchRegex },
        { regNo: searchRegex },
        { chasisNo: searchRegex },
        { engineNo: searchRegex },
        { model: searchRegex },
        { dlCode: searchRegex },
        { 'seezerId.name': searchRegex },
      ],
    };
  }
  const vehiclesList = await VehicleData.find(query).skip(skip).limit(pageSize).populate('seezerId', 'name').exec();
  return res.status(200).json({
    vehiclesList,
    currentPage: page,
    totalPages: Math.ceil(await VehicleData.countDocuments(query) / pageSize),
  });
});

exports.repoVehicleList = catchError(async (req, res) => {
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
        { agreementNo: searchRegex },
        { customerName: searchRegex },
        { regNo: searchRegex },
        { chasisNo: searchRegex },
        { engineNo: searchRegex },
        { model: searchRegex },
        { dlCode: searchRegex },
        { 'seezerId.name': searchRegex },
      ],
    };
  }
  const vehiclesList = await VehicleData.find(query).skip(skip).limit(pageSize).populate('seezerId', 'name').exec();
  return res.status(200).json({
    vehiclesList,
    currentPage: page,
    totalPages: Math.ceil(await VehicleData.countDocuments(query) / pageSize),
  });
});

exports.releaseVehicleList = catchError(async (req, res) => {
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
        { agreementNo: searchRegex },
        { customerName: searchRegex },
        { regNo: searchRegex },
        { chasisNo: searchRegex },
        { engineNo: searchRegex },
        { model: searchRegex },
        { dlCode: searchRegex },
        { 'seezerId.name': searchRegex },
      ],
    };
  }
  const vehiclesList = await VehicleData.find(query).skip(skip).limit(pageSize).populate('seezerId', 'name').exec();
  return res.status(200).json({
    vehiclesList,
    currentPage: page,
    totalPages: Math.ceil(await VehicleData.countDocuments(query) / pageSize),
  });
});

exports.searchedVehicleList = catchError(async (req, res) => {
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
        { agreementNo: searchRegex },
        { customerName: searchRegex },
        { regNo: searchRegex },
        { chasisNo: searchRegex },
        { engineNo: searchRegex },
        { model: searchRegex },
        { dlCode: searchRegex },
        { 'seezerId.name': searchRegex },
      ],
    };
  }
  const vehiclesList = await VehicleData.find(query).skip(skip).limit(pageSize).populate('seezerId', 'name').exec();
  return res.status(200).json({
    vehiclesList,
    currentPage: page,
    totalPages: Math.ceil(await VehicleData.countDocuments(query) / pageSize),
  });
});

exports.confirmationVehicleList = catchError(async (req, res) => {
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
        { agreementNo: searchRegex },
        { customerName: searchRegex },
        { regNo: searchRegex },
        { chasisNo: searchRegex },
        { engineNo: searchRegex },
        { model: searchRegex },
        { dlCode: searchRegex },
        { 'seezerId.name': searchRegex },
      ],
    };
  }
  const vehiclesList = await VehicleData.find(query).skip(skip).limit(pageSize).populate('seezerId', 'name').exec();
  return res.status(200).json({
    vehiclesList,
    currentPage: page,
    totalPages: Math.ceil(await VehicleData.countDocuments(query) / pageSize),
  });
});



function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}


exports.getData = catchError(async (req, res) => {
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

  try {
    data = await VehicleData.aggregate([
      { $match: query },
      {
        $group: {
          _id: { bankName: "$bankName", branch: "$branch", callCenterNo1: "$callCenterNo1" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          bankName: "$_id.bankName",
          branch: "$_id.branch",
          callCenterNo1: "$_id.callCenterNo1",
          count: 1
        }
      }
    ]);
    totalRecords = await VehicleData.countDocuments(query);

    return res.status(200).json({ data, totalRecords });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});



exports.deleteData = catchError(async (req, res) => {
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

exports.deleteDataByFIleName = catchError(async (req, res) => {
  const fileName = new RegExp(req.params.fileName, 'i');
  const result = await VehicleData.deleteMany({ fileName: fileName });

  return res.status(200).json({ message: `${result.deletedCount} records deleted successfully.` });
});

exports.changeStatus = catchError(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const indianDate = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const dateTime = new Date(indianDate);  
  dateTime.setHours(dateTime.getHours() + 5);
  dateTime.setMinutes(dateTime.getMinutes() + 30);

  const utcDateTime = dateTime.toISOString();
  const details = await VehicleData.findById(id);

  if (!details) {
    return res.status(404).json({ message: "Record Not Found" });
  }

  const request = await Request.findOne({ recordId: id });
  if (request) {
    request.status = status;
    await request.save();
  }
  details.status = status;

  if (status === "hold") {
    details.holdAt = utcDateTime;
  } else if (status === "release") {
    details.releaseAt = utcDateTime;
  }else if (status === "repo") {
    details.releaseAt = utcDateTime;
  }

  const savedDetails = await details.save();

  return res.status(200).json({ data: savedDetails, message: "Status Changed Successfully!" });
});

exports.searchedVehicleStatus = catchError(async (req, res) => {
  const userId = req.repoAgent._id;
  const type = 'RepoAgent';
  const { id } = req.params;
  const status = "search";
  const indianDate = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const dateTime = new Date(indianDate);  
  dateTime.setHours(dateTime.getHours() + 5);
  dateTime.setMinutes(dateTime.getMinutes() + 30);

  const utcDateTime = dateTime.toISOString();
  const vehicle = await VehicleData.findById({ _id: id });
  if (vehicle.status == "pending") {
    vehicle.status = status;
    vehicle.seezerId = userId;
    vehicle.searchedAt = utcDateTime;
    await vehicle.save();
  }
  return res.status(200).json({ messege: "Message Sent Successfully!" });
})


exports.getAllData = catchError(async (req, res) => {
  let data = [];
  let totalRecords = 0;

  let query = {};

  const dateParam = req.query.date ? new Date(req.query.date) : null; // Use Date object for exact match

  if (dateParam)
    query.createdAt = { $gte: dateParam, $lt: new Date(dateParam.getTime() + 24 * 60 * 60 * 1000) };

  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10; // Default limit to 10 if not provided
  const skip = (page - 1) * limit;

  // Query data with pagination
  data = await VehicleData.find(query).skip(skip).limit(limit);
  totalRecords = await VehicleData.countDocuments(query);

  // Calculate total pages
  const totalPages = Math.ceil(totalRecords / limit);

  // Determine if there is a next page
  const nextPage = page < totalPages ? page + 1 : null;

  return res.status(200).json({
    data,
    totalRecords,
    totalPages,
    currentPage: page,
    nextPage,
  });
});


exports.holdDataGraph = catchError(async (req, res) =>{
  const { interval } = req.query;
  const indianTimeZoneOffset = 330; 
  let aggregationPipeline = [];

  if (interval === 'day') {
    aggregationPipeline = [
      {
        $match: {
          status: 'hold',
          $expr: {
            $eq: [
              {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: {
                    $toDate: {
                      $subtract: [
                        { $toDate: { $substr: ['$holdAt', 0, 24] } },
                        { $multiply: [60000, indianTimeZoneOffset] }, // Convert to IST
                      ],
                    },
                  },
                },
              },
              {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: {
                    $subtract: [
                      new Date(),
                      { $multiply: [60000, indianTimeZoneOffset] }, // Convert to IST
                    ],
                  },
                },
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            hour: {
              $hour: {
                $dateFromString: {
                  dateString: { $substr: ['$holdAt', 0, 24] },
                },
              },
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          time: {
            $concat: [
              { $toString: '$_id.hour' },
              ':00 To ',
              { $toString: { $add: ['$_id.hour', 1] } },
              ':00',
            ],
          },
          totalVehicle: '$count',
        },
      },
    ];
  } 
  else if (interval === 'week') {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    aggregationPipeline = [
      {
        $match: {
          status: 'hold',
          $expr: {
            $gte: [
              {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: { $toDate: { $substr: ['$holdAt', 0, 24] } },
                },
              },
              {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: {
                    $subtract: [
                      new Date(),
                      { $multiply: [1000, 60, 60, 24, { $dayOfWeek: new Date() }] },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            dayOfWeek: {
              $dayOfWeek: {
                $toDate: { $substr: ['$holdAt', 0, 24] },
              },
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          day: {
            $switch: {
              branches: daysOfWeek.map((day, index) => ({
                case: { $eq: ['$_id.dayOfWeek', index + 1] },
                then: day,
              })),
              default: 'Unknown',
            },
          },
          totalVehicle: '$count',
        },
      },
      {
        $group: {
          _id: null,
          data: {
            $push: {
              day: '$day',
              totalVehicle: '$totalVehicle',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          data: {
            $map: {
              input: daysOfWeek,
              as: 'day',
              in: {
                $cond: {
                  if: { $in: ['$$day', '$data.day'] },
                  then: { $arrayElemAt: ['$data', { $indexOfArray: ['$data.day', '$$day'] }] },
                  else: { day: '$$day', totalVehicle: 0 },
                },
              },
            },
          },
        },
      },
      {
        $unwind: '$data',
      },
      {
        $replaceRoot: { newRoot: '$data' },
      },
    ];
  } 
  else if (interval === 'month') {
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const nextMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    aggregationPipeline = [
    {
      $match: {
        status: 'hold',
        holdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        },
      },
    },
    {
      $group: {
        _id: { dayOfMonth: { $dayOfMonth: '$holdAt' } },
        totalVehicle: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        date: { $toString: '$_id.dayOfMonth' },
        totalVehicle: '$totalVehicle',
      },
    },
    {
      $sort: { date: 1 },
    },
  ];
  } 
  else if (interval === 'year') {
    const currentYearStart = new Date(new Date().getFullYear(), 0, 1);
    const nextYearStart = new Date(new Date().getFullYear() + 1, 0, 1);

    const monthsArray = Array.from({ length: 12 }, (_, i) => i + 1);

    aggregationPipeline = [
    {
      $match: {
        status: 'hold',
        holdAt: {
          $gte: new Date(new Date().getFullYear(), 0, 1),
          $lt: new Date(new Date().getFullYear() + 1, 0, 1),
        },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$holdAt' } },
        totalVehicle: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        month: '$_id.month',
        totalVehicle: '$totalVehicle',
      },
    },
    {
      $group: {
        _id: null,
        data: { $push: { month: '$month', totalVehicle: '$totalVehicle' } },
      },
    },
    {
      $unwind: '$data',
    },
    {
      $project: {
        month: '$data.month',
        totalVehicle: {
          $mergeObjects: [
            { month: '$data.month', totalVehicle: 0 },
            '$data',
          ],
        },
      },
    },
    {
      $replaceRoot: { newRoot: '$totalVehicle' },
    },
    {
      $sort: { month: 1 },
    },
  ];


  } 
  else {
    return res.status(400).json({ error: 'Invalid interval specified' });
  }

  const result = await VehicleData.aggregate(aggregationPipeline);

  res.json({ data: result });
});


exports.repoDataGraph = catchError(async (req, res) =>{
  const { interval } = req.query;
  const indianTimeZoneOffset = 330; 
  let aggregationPipeline = [];

  if (interval === 'day') {
    aggregationPipeline = [
      {
        $match: {
          status: 'repo',
          $expr: {
            $eq: [
              {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: {
                    $toDate: {
                      $subtract: [
                        { $toDate: { $substr: ['$repoAt', 0, 24] } },
                        { $multiply: [60000, indianTimeZoneOffset] }, // Convert to IST
                      ],
                    },
                  },
                },
              },
              {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: {
                    $subtract: [
                      new Date(),
                      { $multiply: [60000, indianTimeZoneOffset] }, // Convert to IST
                    ],
                  },
                },
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            hour: {
              $hour: {
                $dateFromString: {
                  dateString: { $substr: ['$repoAt', 0, 24] },
                },
              },
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          time: {
            $concat: [
              { $toString: '$_id.hour' },
              ':00 To ',
              { $toString: { $add: ['$_id.hour', 1] } },
              ':00',
            ],
          },
          totalVehicle: '$count',
        },
      },
    ];
  } 
  else if (interval === 'week') {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    aggregationPipeline = [
      {
        $match: {
          status: 'repo',
          $expr: {
            $gte: [
              {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: { $toDate: { $substr: ['$repoAt', 0, 24] } },
                },
              },
              {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: {
                    $subtract: [
                      new Date(),
                      { $multiply: [1000, 60, 60, 24, { $dayOfWeek: new Date() }] },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            dayOfWeek: {
              $dayOfWeek: {
                $toDate: { $substr: ['$repoAt', 0, 24] },
              },
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          day: {
            $switch: {
              branches: daysOfWeek.map((day, index) => ({
                case: { $eq: ['$_id.dayOfWeek', index + 1] },
                then: day,
              })),
              default: 'Unknown',
            },
          },
          totalVehicle: '$count',
        },
      },
      {
        $group: {
          _id: null,
          data: {
            $push: {
              day: '$day',
              totalVehicle: '$totalVehicle',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          data: {
            $map: {
              input: daysOfWeek,
              as: 'day',
              in: {
                $cond: {
                  if: { $in: ['$$day', '$data.day'] },
                  then: { $arrayElemAt: ['$data', { $indexOfArray: ['$data.day', '$$day'] }] },
                  else: { day: '$$day', totalVehicle: 0 },
                },
              },
            },
          },
        },
      },
      {
        $unwind: '$data',
      },
      {
        $replaceRoot: { newRoot: '$data' },
      },
    ];
  } 
  else if (interval === 'month') {
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const nextMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    aggregationPipeline = [
    {
      $match: {
        status: 'repo',
        repoAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        },
      },
    },
    {
      $group: {
        _id: { dayOfMonth: { $dayOfMonth: '$repoAt' } },
        totalVehicle: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        date: { $toString: '$_id.dayOfMonth' },
        totalVehicle: '$totalVehicle',
      },
    },
    {
      $sort: { date: 1 },
    },
  ];
  } 
  else if (interval === 'year') {
    const currentYearStart = new Date(new Date().getFullYear(), 0, 1);
    const nextYearStart = new Date(new Date().getFullYear() + 1, 0, 1);
    const monthsArray = Array.from({ length: 12 }, (_, i) => i + 1);

    aggregationPipeline = [
    {
      $match: {
        status: 'repo',
        repoAt: {
          $gte: new Date(new Date().getFullYear(), 0, 1),
          $lt: new Date(new Date().getFullYear() + 1, 0, 1),
        },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$repoAt' } },
        totalVehicle: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        month: '$_id.month',
        totalVehicle: '$totalVehicle',
      },
    },
    {
      $group: {
        _id: null,
        data: { $push: { month: '$month', totalVehicle: '$totalVehicle' } },
      },
    },
    {
      $unwind: '$data',
    },
    {
      $project: {
        month: '$data.month',
        totalVehicle: {
          $mergeObjects: [
            { month: '$data.month', totalVehicle: 0 },
            '$data',
          ],
        },
      },
    },
    {
      $replaceRoot: { newRoot: '$totalVehicle' },
    },
    {
      $sort: { month: 1 },
    },
  ];


  } 
  else {
    return res.status(400).json({ error: 'Invalid interval specified' });
  }

  const result = await VehicleData.aggregate(aggregationPipeline);

  res.json({ data: result });
});

exports.releaseDataGraph = catchError(async (req, res) =>{
  const { interval } = req.query;
  const indianTimeZoneOffset = 330; 
  let aggregationPipeline = [];

  if (interval === 'day') {
    aggregationPipeline = [
      {
        $match: {
          status: 'release',
          $expr: {
            $eq: [
              {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: {
                    $toDate: {
                      $subtract: [
                        { $toDate: { $substr: ['$releaseAt', 0, 24] } },
                        { $multiply: [60000, indianTimeZoneOffset] }, // Convert to IST
                      ],
                    },
                  },
                },
              },
              {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: {
                    $subtract: [
                      new Date(),
                      { $multiply: [60000, indianTimeZoneOffset] }, // Convert to IST
                    ],
                  },
                },
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            hour: {
              $hour: {
                $dateFromString: {
                  dateString: { $substr: ['$releaseAt', 0, 24] },
                },
              },
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          time: {
            $concat: [
              { $toString: '$_id.hour' },
              ':00 To ',
              { $toString: { $add: ['$_id.hour', 1] } },
              ':00',
            ],
          },
          totalVehicle: '$count',
        },
      },
    ];
  } 
  else if (interval === 'week') {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    aggregationPipeline = [
      {
        $match: {
          status: 'release',
          $expr: {
            $gte: [
              {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: { $toDate: { $substr: ['$releaseAt', 0, 24] } },
                },
              },
              {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: {
                    $subtract: [
                      new Date(),
                      { $multiply: [1000, 60, 60, 24, { $dayOfWeek: new Date() }] },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            dayOfWeek: {
              $dayOfWeek: {
                $toDate: { $substr: ['$releaseAt', 0, 24] },
              },
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          day: {
            $switch: {
              branches: daysOfWeek.map((day, index) => ({
                case: { $eq: ['$_id.dayOfWeek', index + 1] },
                then: day,
              })),
              default: 'Unknown',
            },
          },
          totalVehicle: '$count',
        },
      },
      {
        $group: {
          _id: null,
          data: {
            $push: {
              day: '$day',
              totalVehicle: '$totalVehicle',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          data: {
            $map: {
              input: daysOfWeek,
              as: 'day',
              in: {
                $cond: {
                  if: { $in: ['$$day', '$data.day'] },
                  then: { $arrayElemAt: ['$data', { $indexOfArray: ['$data.day', '$$day'] }] },
                  else: { day: '$$day', totalVehicle: 0 },
                },
              },
            },
          },
        },
      },
      {
        $unwind: '$data',
      },
      {
        $replaceRoot: { newRoot: '$data' },
      },
    ];
  } 
  else if (interval === 'month') {
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const nextMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    aggregationPipeline = [
    {
      $match: {
        status: 'release',
        releaseAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        },
      },
    },
    {
      $group: {
        _id: { dayOfMonth: { $dayOfMonth: '$releaseAt' } },
        totalVehicle: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        date: { $toString: '$_id.dayOfMonth' },
        totalVehicle: '$totalVehicle',
      },
    },
    {
      $sort: { date: 1 },
    },
  ];
  } 
  else if (interval === 'year') {
    const currentYearStart = new Date(new Date().getFullYear(), 0, 1);
    const nextYearStart = new Date(new Date().getFullYear() + 1, 0, 1);
    const monthsArray = Array.from({ length: 12 }, (_, i) => i + 1);

    aggregationPipeline = [
    {
      $match: {
        status: 'release',
        releaseAt: {
          $gte: new Date(new Date().getFullYear(), 0, 1),
          $lt: new Date(new Date().getFullYear() + 1, 0, 1),
        },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$releaseAt' } },
        totalVehicle: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        month: '$_id.month',
        totalVehicle: '$totalVehicle',
      },
    },
    {
      $group: {
        _id: null,
        data: { $push: { month: '$month', totalVehicle: '$totalVehicle' } },
      },
    },
    {
      $unwind: '$data',
    },
    {
      $project: {
        month: '$data.month',
        totalVehicle: {
          $mergeObjects: [
            { month: '$data.month', totalVehicle: 0 },
            '$data',
          ],
        },
      },
    },
    {
      $replaceRoot: { newRoot: '$totalVehicle' },
    },
    {
      $sort: { month: 1 },
    },
  ];


  } 
  else {
    return res.status(400).json({ error: 'Invalid interval specified' });
  }

  const result = await VehicleData.aggregate(aggregationPipeline);

  res.json({ data: result });
});

exports.searchDataGraph = catchError(async (req, res) =>{
  const { interval } = req.query;
  const indianTimeZoneOffset = 330; 
  let aggregationPipeline = [];

  if (interval === 'day') {
    aggregationPipeline = [
      {
        $match: {
          status: 'search',
          $expr: {
            $eq: [
              {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: {
                    $toDate: {
                      $subtract: [
                        { $toDate: { $substr: ['$searchedAt', 0, 24] } },
                        { $multiply: [60000, indianTimeZoneOffset] }, 
                      ],
                    },
                  },
                },
              },
              {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: {
                    $subtract: [
                      new Date(),
                      { $multiply: [60000, indianTimeZoneOffset] }, 
                    ],
                  },
                },
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            hour: {
              $hour: {
                $dateFromString: {
                  dateString: { $substr: ['$searchedAt', 0, 24] },
                },
              },
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          time: {
            $concat: [
              { $toString: '$_id.hour' },
              ':00 To ',
              { $toString: { $add: ['$_id.hour', 1] } },
              ':00',
            ],
          },
          totalVehicle: '$count',
        },
      },
    ];
  } 
  else if (interval === 'week') {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    aggregationPipeline = [
      {
        $match: {
          status: 'search',
          $expr: {
            $gte: [
              {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: { $toDate: { $substr: ['$searchedAt', 0, 24] } },
                },
              },
              {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: {
                    $subtract: [
                      new Date(),
                      { $multiply: [1000, 60, 60, 24, { $dayOfWeek: new Date() }] },
                    ],
                  },
                },
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            dayOfWeek: {
              $dayOfWeek: {
                $toDate: { $substr: ['$searchedAt', 0, 24] },
              },
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          day: {
            $switch: {
              branches: daysOfWeek.map((day, index) => ({
                case: { $eq: ['$_id.dayOfWeek', index + 1] },
                then: day,
              })),
              default: 'Unknown',
            },
          },
          totalVehicle: '$count',
        },
      },
      {
        $group: {
          _id: null,
          data: {
            $push: {
              day: '$day',
              totalVehicle: '$totalVehicle',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          data: {
            $map: {
              input: daysOfWeek,
              as: 'day',
              in: {
                $cond: {
                  if: { $in: ['$$day', '$data.day'] },
                  then: { $arrayElemAt: ['$data', { $indexOfArray: ['$data.day', '$$day'] }] },
                  else: { day: '$$day', totalVehicle: 0 },
                },
              },
            },
          },
        },
      },
      {
        $unwind: '$data',
      },
      {
        $replaceRoot: { newRoot: '$data' },
      },
    ];
  } 
  else if (interval === 'month') {
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const nextMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    aggregationPipeline = [
    {
      $match: {
        status: 'search',
        searchedAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        },
      },
    },
    {
      $group: {
        _id: { dayOfMonth: { $dayOfMonth: '$searchedAt' } },
        totalVehicle: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        date: { $toString: '$_id.dayOfMonth' },
        totalVehicle: '$totalVehicle',
      },
    },
    {
      $sort: { date: 1 },
    },
  ];
  } 
  else if (interval === 'year') {
    const currentYearStart = new Date(new Date().getFullYear(), 0, 1);
    const nextYearStart = new Date(new Date().getFullYear() + 1, 0, 1);
    const monthsArray = Array.from({ length: 12 }, (_, i) => i + 1);

    aggregationPipeline = [
    {
      $match: {
        status: 'search',
        searchedAt: {
          $gte: new Date(new Date().getFullYear(), 0, 1),
          $lt: new Date(new Date().getFullYear() + 1, 0, 1),
        },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$searchedAt' } },
        totalVehicle: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        month: '$_id.month',
        totalVehicle: '$totalVehicle',
      },
    },
    {
      $group: {
        _id: null,
        data: { $push: { month: '$month', totalVehicle: '$totalVehicle' } },
      },
    },
    {
      $unwind: '$data',
    },
    {
      $project: {
        month: '$data.month',
        totalVehicle: {
          $mergeObjects: [
            { month: '$data.month', totalVehicle: 0 },
            '$data',
          ],
        },
      },
    },
    {
      $replaceRoot: { newRoot: '$totalVehicle' },
    },
    {
      $sort: { month: 1 },
    },
  ];


  } 
  else {
    return res.status(400).json({ error: 'Invalid interval specified' });
  }

  const result = await VehicleData.aggregate(aggregationPipeline);

  res.json({ data: result });
});

