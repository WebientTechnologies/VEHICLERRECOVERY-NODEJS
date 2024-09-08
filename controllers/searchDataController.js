const SearchData = require('../models/searchData');
const vehicleData = require('../models/vehiclesData');


exports.getSearch = async (req, res) => {
  try {
    const search = await SearchData.find().populate({
      path: 'vehicleId',
      model: 'VehicleData'
    }).populate({
      path: 'seezerId',  // Populate seezerId field
      model: 'RepoAgent',  // Use the RepoAgent model
    }).exec();
    return res.status(200).json({ search });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
}
