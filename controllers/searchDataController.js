const SearchData = require('../models/searchData');
const VehicleData = require('../models/vehiclesData');


exports.getSearch = async (req, res) => {

  const searchTerm = req.query.search;

  try {
    if (searchTerm != null) {
      const searchQuery = {
        $or: [
          { bankName: { $regex: searchTerm, $options: 'i' } },
          { customerName: { $regex: searchTerm, $options: 'i' } },
          { regNo: { $regex: searchTerm, $options: 'i' } },
          { chasisNo: { $regex: searchTerm, $options: 'i' } },
        ]
      };


      // Find matching VehicleData IDs based on the search query
      const matchingVehicles = await VehicleData.find(searchQuery).exec();

      console.log(matchingVehicles);

      // Extract matching vehicle IDs to use in SearchData query
      const matchingVehicleIds = matchingVehicles.map(vehicle => vehicle._id);

      // Query SearchData and populate vehicleId and seezerId
      const searchResults = await SearchData.find({ vehicleId: { $in: matchingVehicleIds } })
        .populate({
          path: 'vehicleId',
          model: 'VehicleData',
        })
        .populate({
          path: 'seezerId',
          model: 'RepoAgent',
        })
        .exec();

      // Return the search results in the required format
      const response = { search: searchResults };
      return res.status(200).json(response);
    } else {
      const search = await SearchData.find().populate({
        path: 'vehicleId',
        model: 'VehicleData'
      }).populate({
        path: 'seezerId',  // Populate seezerId field
        model: 'RepoAgent',  // Use the RepoAgent model
      }).exec();

      return res.status(200).json({ search });

    }
  } catch (error) {
    return res.status(500).json({ message: error });
  }
}
