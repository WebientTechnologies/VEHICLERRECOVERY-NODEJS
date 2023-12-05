const Bank = require('../models/bank');

exports.createBank = async (req, res) => {
  try {
    
    const latestBank = await Bank.findOne().sort({ bankId: -1 }).limit(1);

    let nextBankId;
    if (latestBank) {
      const latestBankIdNumber = parseInt(latestBank.bankId.substring(3));
      nextBankId = `BFI${(latestBankIdNumber + 1).toString().padStart(4, '0')}`;
    } else {
      nextBankId = 'BFI0001';
    }

    const newBank = new Bank({
      bankId: nextBankId,
      bankName: req.body.bankName,
      status: req.body.status,
    });

    await newBank.save();

    res.status(201).json({ message: 'Bank created successfully', bank: newBank });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.getAllBanks = async (req, res) => {
    try {
      const banks = await Bank.find();
      res.status(200).json({ banks });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
};
  

exports.getBankById = async (req, res) => {
    try {
        const bank = await Bank.findById(req.params.id);
        
        if (!bank) {
        return res.status(404).json({ message: 'Bank not found' });
        }

        res.status(200).json({ bank });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
  

exports.updateBank = async (req, res) => {
    try {
        const bank = await Bank.findById(req.params.id);
        
        if (!bank) {
        return res.status(404).json({ message: 'Bank not found' });
        }

        bank.bankName = req.body.bankName || bank.bankName;
        bank.status = req.body.status || bank.status;

        await bank.save();

        res.status(200).json({ message: 'Bank updated successfully', bank });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
