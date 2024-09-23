const IdCard = require('../models/idCard');
const { catchError } = require("../middlewares/CatchError");
const QRCode = require("qrcode");

exports.createIdCard = catchError(async (req, res) => {

  const { agentName, fatherName, mobile, addressLine1, addressLine2, validFrom, validTo, status, qrCode } = req.body;

  if (!req.files) {
    return res.status(400).send('No files uploaded.');
  }

  const existingCard = await IdCard.findOne({ mobile: mobile });
  if (existingCard) {
    return res.status(409).json({ message: "Card With The Same Mobile Number Is Already Exist" });
  }

  const latestCard = await IdCard.findOne().sort({ cardId: -1 }).limit(1);

  let nextcardId;
  if (latestCard) {
    const latestCardIdNumber = parseInt(latestCard.cardId.substring(3));
    nextcardId = `IC${(latestCardIdNumber + 1).toString().padStart(4, '0')}`;
  } else {
    nextcardId = 'IC0001';
  }

  const newIdCard = new IdCard({
    cardId: nextcardId,
    agentName,
    fatherName,
    mobile,
    addressLine1,
    addressLine2,
    validFrom,
    validTo,
    status,
    photo: req.files.photo[0].filename,
    signature: req.files.signature[0].filename,
    qrCode,
  });

  const savedIdCard = await newIdCard.save();
  return res.status(201).json({ card: savedIdCard });

});

exports.generateQRCode = async (req, res) => {
  const { cardId } = req.params;

  try {
    const url = `http://127.0.0.1:4000/backend/api/v1/get-card/${cardId}`;
    const qrCodeImage = await QRCode.toDataURL(url);

    res.json({ qrCodeImage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getCardDetails = async (req, res) => {
  const { cardId } = req.params;

  try {
    const card = await IdCard.findOne({ cardId });

    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    res.json(card);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getAllCards = async (req, res) => {

  try {
    const cards = await IdCard.find();
    res.json(cards);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getNewCardId = catchError(async (req, res) => {
  const latestCard = await IdCard.findOne().sort({ cardId: -1 }).limit(1);

  let nextcardId;
  if (latestCard) {
    const latestCardIdNumber = parseInt(latestCard.cardId.substring(3));
    nextcardId = `IC${(latestCardIdNumber + 1).toString().padStart(4, '0')}`;
  } else {
    nextcardId = 'IC0001';
  }
  res.status(200).json({
    success: true,
    cardId: nextcardId,
  });
})