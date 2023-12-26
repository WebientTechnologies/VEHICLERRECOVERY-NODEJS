
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
        lastDigit: row.LastDigit,
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

      const vehicleData = new VehicleData({
        bankName: bank,
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
        lastDigit: row.LastDigit,
        month: month,
        loaStatus: loadStatus,
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
          loadStatus: { $first: "Success" },
        },
      },
      {
        $project: {
          _id: 0,
          fileName: "$_id.fileName",
          month: "$_id.month",
          createdAt: "$_id.createdAt",
          count: 1,
          loadStatus: "$loadStatus",
        },
      },
      {
        $skip: (page - 1) * 2, 
      },
      {
        $limit: 2, 
      },
    ];
  
    const result = await VehicleData.aggregate(aggregationPipeline);
  
    res.status(200).json({ data: result });
});
  