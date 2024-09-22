const jwt = require("jsonwebtoken");
const user = require("../models/user");
const Agent = require("../models/repoAgent");
const Staff = require("../models/officeStaf");
require("dotenv").config();

exports.auth = async (req, res, next) => {

    let token;

    // Check for token in Authorization header
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    }
    if (!token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not logged in',
        });
    }
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        const userId = decodedToken._id;
        console.log({ userId, token, decodedToken })
        req.user = await user.findById(userId);
        if (!req.user) {
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

exports.checkStatus = async (req, res, next) => {
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

        console.log(decodedToken);

        const role = decodedToken.role;
        const id = decodedToken._id;

        if (role === 'repo-agent') {

            const repoAgent = await Agent.findById(id);
            console.log(repoAgent);
            if (repoAgent.status === 'inactive') {
                return res.status(403).json({
                    success: false,
                    message: 'Access Denied',
                });
            }
        } else if (role === 'office-staff') {
            const staf = await Staff.findById(id);
            console.log(staf);
            if (staf.status === 'inactive') {
                return res.status(403).json({
                    success: false,
                    message: 'Access Denied',
                });
            }
        }


        next();
    } catch (err) {
        console.log(err);
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
        })
    }
}



exports.isAdmin = (req, res, next) => {
    try {
        if (req.user.role !== "Admin") {
            return res.status(405).json({
                success: false,
                message: 'This is a protected route for Admin',
            });
        }
        next();
    }
    catch (error) {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed',
        })
    }
}
