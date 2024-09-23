
const xlsx = require("xlsx");
const VehicleData = require("../models/vehiclesData");
const Dashboard = require("../models/dashboard");
const SearchData = require("../models/searchData");
const Request = require("../models/request");
const { catchError } = require('../middlewares/CatchError');
const fs = require('fs');
const mongoosePaginate = require('mongoose-aggregate-paginate-v2');
const { exec } = require('child_process');
const archiver = require('archiver');


const exportData = async () => {
  return new Promise(async (resolve, reject) => {

    const [result] = await VehicleData.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
        }
      }
    ]);

    const onlineDataCount = result.total[0]?.count || 0;

    const dash = await Dashboard.countDocuments();
    if (dash > 0) {
      const [dd] = await Dashboard.find().limit(1);
      dd.onlineDataCount = onlineDataCount;
      dd.save();

    } else {
      const dashboard = new Dashboard({ onlineDataCount });
      await dashboard.save();
    }


    // Use full path to mongoexport if necessary
    const command = 'mongoexport -u anilvinayak -p VinayakAnil#123321 --db vehicle-recovery --collection vehicledatas --out data.json --jsonArray --authenticationDatabase admin';

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Export failed: ${stderr}`);
        return reject(`Export failed: ${stderr}`);
      }
      console.log(`Export stdout: ${stdout}`);  // Debug output
      resolve(stdout);
    });
  });
};

const compressFile = () => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream('/var/www/export.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      resolve('Compression successful');
    });

    archive.on('error', (err) => {
      reject(`Compression failed: ${err.message}`);
    });

    archive.pipe(output);
    archive.file('vinayak.db', { name: 'vinayak.db' });
    archive.finalize();
  });
};

exports.generateDb = catchError(async (req, res) => {
  try {
    // Step 1: Export data from MongoDB
    await exportData();

    exec('python3 newmongo.py', async (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing Python script: ${error.message}`);
        return;
      }

      if (stderr) {
        console.error(`Python stderr: ${stderr}`);
        return;
      }

      await compressFile();

      exec('rm -rf vinayak.db', (error, stdout, stderr) => { });

      console.log('Database generated and compressed successfully');
      res.status(200).json({ message: 'db generated successfully' });

    });


  } catch (error) {
    // Handle any errors
    console.error(error);
    res.status(500).json({ message: `Error: ${error.message}` });
  }
});

exports.addVehicle = catchError(async (req, res) => {

  try {

    const { bankName, regNo, lastDigit, customerName, maker, confirmBy, mobNo } = req.body;
    const vehicle = new VehicleData({
      bankName: bankName, regNo: regNo, lastDigit: lastDigit, customerName: customerName, maker: maker, confirmBy: confirmBy, mobNo: mobNo
    });

    await vehicle.save();

    const [dd] = await Dashboard.find().limit(1);
    dd.onlineDataCount = dd.onlineDataCount + 1;
    dd.save();


    return res.status(200).json({ message: "Vehicle Added" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err });

  }

});

exports.uploadFile = catchError(async (req, res) => {

  try {

    if (!req.files) {
      return res.status(400).json({ error: "No file provided" });
    }

    const fn = req.files.sheet[0].filename;
    exec(`python3 newexcel.py --filePath "./uploads/${fn}"`, async (error, stdout, stderr) => {

      if (error) {
        console.error(`Error executing Python script: ${error.message}`);
        return;
      }

      if (stderr) {
        console.error(`Python stderr: ${stderr}`);
        return;
      }

      res.status(200).json({ message: "File uploaded successfully" });

    });

  } catch (e) {
    console.log(e);
  }


});

function excelDateToJSDate(excelDate) {
  // Excel date serial starts from 1-Jan-1900
  // Subtracting 1 because Excel serial date starts from 1
  const excelDateAdjusted = excelDate - 1;

  // Convert to JavaScript Date object
  const date = new Date((excelDateAdjusted - (25567 + 1)) * 86400 * 1000);
  return date;
}

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

    console.log(lastDigit);

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

  try {
    // Aggregation pipeline
    const [result] = await VehicleData.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],

          lastId: [{ $sort: { _id: -1 } }, { $limit: 1 }, { $project: { _id: 1 } }]
        }
      }
    ]);

    const totalCount = result.total[0]?.count || 0;

    const lastId = result.lastId[0]?._id || null;

    res.status(200).json({
      totalOnlineData: totalCount,

      lastId: lastId
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }

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
    data = await VehicleData.find({ lastDigit: req.query.lastDigit }).sort({ regNo: 1 }).exec();;
  } else if (req.query.agreementNo) {
    data = await VehicleData.find({ agreementNo: req.query.agreementNo }).sort({ regNo: 1 }).exec();;
  } else if (req.query.engineNo) {
    data = await VehicleData.find({ engineNo: req.query.engineNo }).sort({ regNo: 1 }).exec();;
  } else if (req.query.chasisNo) {
    if (req.query.chasisNo.length < 6) {
      return res.status(400).json({ error: 'Invalid chasisNo length' }).sort({ regNo: 1 }).exec();;
    }
    const last6Digits = req.query.chasisNo.slice(-6);
    data = await VehicleData.find({ chasisNo: { $regex: (`${last6Digits}`, 'i') }, status: { $in: ['search', 'pending'] } }).sort({ regNo: 1 }).exec();;
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

exports.deleteDataByFileName = catchError(async (req, res) => {
  const fileName = new RegExp(req.params.fileName, 'i');
  const result = await VehicleData.deleteMany({ fileName: fileName });

  const [dd] = await Dashboard.find().limit(1);
  dd.onlineDataCount = dd.onlineDataCount - deletedCount;
  dd.save();

  return res.status(200).json({ message: `${result.deletedCount} records deleted successfully.` });
});

exports.changeStatus = catchError(async (req, res) => {
  const { id } = req.params;
  const { status, seezerId, loadStatus, loadItem, latitude, longitude } = req.body;
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
    details.seezerId = seezerId;
    details.loadStatus = loadStatus;
    details.loadItem = loadItem;
    details.latitude = latitude;
    details.longitude = longitude;
  } else if (status === "release") {
    details.releaseAt = utcDateTime;
  } else if (status === "repo") {
    details.releaseAt = utcDateTime;
  }

  const savedDetails = await details.save();

  return res.status(200).json({ data: savedDetails, message: "Status Changed Successfully!" });
});

exports.searchedVehicleStatus = catchError(async (req, res) => {
  const userId = req.repoAgent._id;
  const type = 'RepoAgent';
  const { id } = req.params;
  const { latitude, longitude } = req.body;
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
    vehicle.latitude = latitude;
    vehicle.longitude = longitude;
    await vehicle.save();
  }

  const searchData = new SearchData({ vehicleId: id, seezerId: userId, createdAt: utcDateTime });
  const search = await searchData.save();

  return res.status(200).json({ search: "Message Sent Successfully!" });
})


exports.getAllData = catchError(async (req, res) => {
  // Pagination parameters
  const lastId = req.query.lastId;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10; // Default limit to 10 if not provided

  // Prepare query object
  let filter = {};
  if (lastId) {
    filter._id = { $gt: lastId };
  }

  try {
    // Get total records count for the filtered query
    const totalRecords = await VehicleData.countDocuments(filter);

    // Fetch data with pagination
    const data = await VehicleData.find(filter)
      .sort({ _id: 1 }) // Ensure sorting by _id for consistent pagination
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

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
  } catch (error) {
    // Handle error
    console.error('Error fetching data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


exports.showAllDataAdmin = catchError(async (req, res) => {
  // Pagination parameters
  const lastId = req.query.lastId;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10; // Default limit to 10 if not provided


  try {
    // Get total records count for the filtered query
    const totalRecords = await VehicleData.countDocuments();

    // Fetch data with pagination
    const data = await VehicleData.find()
      .sort({ _id: - 1 }) // Ensure sorting by _id for consistent pagination
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

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
  } catch (error) {
    // Handle error
    console.error('Error fetching data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


exports.holdDataGraph = catchError(async (req, res) => {
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
          range: {
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
          range: {
            $switch: {
              branches: daysOfWeek.map((range, index) => ({
                case: { $eq: ['$_id.dayOfWeek', index + 1] },
                then: range,
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
              range: '$range',
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
              as: 'range',
              in: {
                $cond: {
                  if: { $in: ['$$range', '$data.range'] },
                  then: { $arrayElemAt: ['$data', { $indexOfArray: ['$data.range', '$$range'] }] },
                  else: { range: '$$range', totalVehicle: 0 },
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
          range: { $toString: '$_id.dayOfMonth' },
          totalVehicle: '$totalVehicle',
        },
      },
      {
        $sort: { range: 1 },
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
          range: { $toString: '$_id.month' },
          totalVehicle: '$totalVehicle',
        },
      },
      {
        $group: {
          _id: null,
          data: { $push: { range: '$range', totalVehicle: '$totalVehicle' } },
        },
      },
      {
        $unwind: '$data',
      },
      {
        $project: {
          range: '$data.range',
          totalVehicle: {
            $mergeObjects: [
              { range: '$data.range', totalVehicle: 0 },
              '$data',
            ],
          },
        },
      },
      {
        $replaceRoot: { newRoot: '$totalVehicle' },
      },
      {
        $sort: { range: 1 },
      },
    ];


  }
  else {
    return res.status(400).json({ error: 'Invalid interval specified' });
  }

  const result = await VehicleData.aggregate(aggregationPipeline);

  res.json({ data: result });
});


exports.repoDataGraph = catchError(async (req, res) => {
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
          range: {
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
          range: {
            $switch: {
              branches: daysOfWeek.map((range, index) => ({
                case: { $eq: ['$_id.dayOfWeek', index + 1] },
                then: range,
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
              range: '$range',
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
              as: 'range',
              in: {
                $cond: {
                  if: { $in: ['$$range', '$data.range'] },
                  then: { $arrayElemAt: ['$data', { $indexOfArray: ['$data.range', '$$range'] }] },
                  else: { range: '$$range', totalVehicle: 0 },
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
          range: { $toString: '$_id.dayOfMonth' },
          totalVehicle: '$totalVehicle',
        },
      },
      {
        $sort: { range: 1 },
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
          range: '$_id.month',
          totalVehicle: '$totalVehicle',
        },
      },
      {
        $group: {
          _id: null,
          data: { $push: { range: '$range', totalVehicle: '$totalVehicle' } },
        },
      },
      {
        $unwind: '$data',
      },
      {
        $project: {
          range: '$data.range',
          totalVehicle: {
            $mergeObjects: [
              { range: '$data.range', totalVehicle: 0 },
              '$data',
            ],
          },
        },
      },
      {
        $replaceRoot: { newRoot: '$totalVehicle' },
      },
      {
        $sort: { range: 1 },
      },
    ];


  }
  else {
    return res.status(400).json({ error: 'Invalid interval specified' });
  }

  const result = await VehicleData.aggregate(aggregationPipeline);

  res.json({ data: result });
});

exports.releaseDataGraph = catchError(async (req, res) => {
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
          range: {
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
          range: {
            $switch: {
              branches: daysOfWeek.map((range, index) => ({
                case: { $eq: ['$_id.dayOfWeek', index + 1] },
                then: range,
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
              range: '$range',
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
              as: 'range',
              in: {
                $cond: {
                  if: { $in: ['$$range', '$data.range'] },
                  then: { $arrayElemAt: ['$data', { $indexOfArray: ['$data.range', '$$range'] }] },
                  else: { range: '$$range', totalVehicle: 0 },
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
          range: { $toString: '$_id.dayOfMonth' },
          totalVehicle: '$totalVehicle',
        },
      },
      {
        $sort: { range: 1 },
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
          range: '$_id.month',
          totalVehicle: '$totalVehicle',
        },
      },
      {
        $group: {
          _id: null,
          data: { $push: { range: '$range', totalVehicle: '$totalVehicle' } },
        },
      },
      {
        $unwind: '$data',
      },
      {
        $project: {
          range: '$data.range',
          totalVehicle: {
            $mergeObjects: [
              { range: '$data.range', totalVehicle: 0 },
              '$data',
            ],
          },
        },
      },
      {
        $replaceRoot: { newRoot: '$totalVehicle' },
      },
      {
        $sort: { range: 1 },
      },
    ];


  }
  else {
    return res.status(400).json({ error: 'Invalid interval specified' });
  }

  const result = await VehicleData.aggregate(aggregationPipeline);

  res.json({ data: result });
});

exports.searchDataGraph = catchError(async (req, res) => {
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
          range: {
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
          range: {
            $switch: {
              branches: daysOfWeek.map((range, index) => ({
                case: { $eq: ['$_id.dayOfWeek', index + 1] },
                then: range,
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
              range: '$range',
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
              as: 'range',
              in: {
                $cond: {
                  if: { $in: ['$$range', '$data.range'] },
                  then: { $arrayElemAt: ['$data', { $indexOfArray: ['$data.range', '$$range'] }] },
                  else: { range: '$$range', totalVehicle: 0 },
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
          range: { $toString: '$_id.dayOfMonth' },
          totalVehicle: '$totalVehicle',
        },
      },
      {
        $sort: { range: 1 },
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
          range: '$_id.month',
          totalVehicle: '$totalVehicle',
        },
      },
      {
        $group: {
          _id: null,
          data: { $push: { range: '$range', totalVehicle: '$totalVehicle' } },
        },
      },
      {
        $unwind: '$data',
      },
      {
        $project: {
          range: '$data.range',
          totalVehicle: {
            $mergeObjects: [
              { range: '$data.range', totalVehicle: 0 },
              '$data',
            ],
          },
        },
      },
      {
        $replaceRoot: { newRoot: '$totalVehicle' },
      },
      {
        $sort: { range: 1 },
      },
    ];


  }
  else {
    return res.status(400).json({ error: 'Invalid interval specified' });
  }

  const result = await VehicleData.aggregate(aggregationPipeline);

  res.json({ data: result });
});

exports.exportsData = catchError(async (req, res) => {
  const jsonFilename = 'vehicledata.json';
  const zipFilename = 'vehicledata.zip';

  // Set response headers for file download
  res.setHeader('Content-Disposition', `attachment; filename=${zipFilename}`);
  res.setHeader('Content-Type', 'application/zip');

  // Use mongoexport to export the data to a JSON file
  const exportCommand = `sudo mongoexport --uri="mongodb+srv://rrsoftwaresolutionbhojawas:nHBFw23VvuM7mgTj@vinayak.j4sbfuz.mongodb.net/vehicle-recovery?retryWrites=true&w=majority" --collection=vehicledatas --out=/var/www/${jsonFilename}`;

  exec(exportCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error during export: ${stderr}`);
      res.status(500).send('Internal Server Error');
      return;
    }

    // Create a zip file containing the exported JSON file
    const outputZip = fs.createWriteStream(`/var/www/${zipFilename}`);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Set compression level
    });

    outputZip.on('close', () => {
      // Send the zip file as a download
      res.download(`/var/www/${zipFilename}`, zipFilename, (downloadError) => {
        if (downloadError) {
          console.error(`Error during download: ${downloadError}`);
          res.status(500).send('Internal Server Error');
        }

        // Cleanup: delete the exported JSON and zip files after download
        fs.unlink(`/var/www/${jsonFilename}`, (cleanupJsonError) => {
          if (cleanupJsonError) {
            console.error(`Error during JSON file cleanup: ${cleanupJsonError}`);
          }

          fs.unlink(`/var/www/${zipFilename}`, (cleanupZipError) => {
            if (cleanupZipError) {
              console.error(`Error during zip file cleanup: ${cleanupZipError}`);
            }
          });
        });
      });
    });

    archive.pipe(outputZip);
    archive.file(`/var/www/${jsonFilename}`, { name: jsonFilename });
    archive.finalize();
  });
});
