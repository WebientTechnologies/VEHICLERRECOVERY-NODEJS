const Zone = require('../models/zone');

exports.createZone = async (req, res) => {
  try {
    const { name } = req.body;
    const existZone = await Zone.findOne({ name: name });

    if (existZone) {
      return res.status(409).json({
        message: 'Zone Name Already Exists! Try another name for Zone.',
      });
    }

    const newZone = new Zone({ name });
    const savedZone = await newZone.save();

    return res.status(201).json({
      message: 'Zone Created Successfully',
      data: savedZone,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Something Went Wrong!' });
  }
};

exports.getZones = async(req, res) =>{
  try {
    const zones = await Zone.find();
    return res.status(200).json({zones});
  } catch (error) {
    return res.status(500).json({ message: 'Something Went Wrong!' });
  }
}
