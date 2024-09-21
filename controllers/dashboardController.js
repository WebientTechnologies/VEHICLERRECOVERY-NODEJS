const Dashboard = require('../models/dashboard');


exports.getDashboard = async (req, res) => {
  try {
    const dashboard = await Dashboard.find();
    return res.status(200).json({ dashboard });
  } catch (error) {
    return res.status(500).json({ message: 'Something Went Wrong!' });
  }
}
