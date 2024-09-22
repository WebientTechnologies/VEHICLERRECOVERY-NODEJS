const jwt = require("jsonwebtoken");
const OfficeStaf = require("../models/officeStaf");
require("dotenv").config();

exports.officeStafAuth = async (req, res, next) => {

  let token;
  // Check for token in Authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  if (!token) {
    token = req.cookies.token;
  }
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not Logged In',
    })
  }
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const stafId = decodedToken._id;
    console.log({ stafId, token, decodedToken })
    req.officeStaf = await OfficeStaf.findById(stafId);
    if (!req.officeStaf) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
    if (req.officeStaf.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied',
      });
    }
    if (decodedToken.tokenVersion !== req.officeStaf.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    })
  }

}
