const jwt = require("jsonwebtoken");
const RepoAgent = require("../models/repoAgent");
require("dotenv").config();

exports.agentAuth = async(req, res , next) => {
 
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
            success:false,
            message:'Not Logged In',
      })
    }
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        
        const agentId = decodedToken._id;
        console.log({agentId, token,decodedToken})
        req.repoAgent = await RepoAgent.findById(agentId);
        if (!req.repoAgent) {
            return res.status(401).json({
              success: false,
              message: 'Invalid or expired token',
            });
        }
        if (decodedToken.tokenVersion !== req.repoAgent.tokenVersion) {
          return res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
          });
      }
        next();
      } catch (err) {
        return res.status(401).json({
            success:false,
            message:'Invalid or expired token',
      })
    }
 
}
