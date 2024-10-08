const OfficeStaf = require('../models/officeStaf');
const RepoAgent = require('../models/repoAgent');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { options } = require("../routes/route");
const nodemailer = require('nodemailer');
require("dotenv").config();
const { catchError } = require("../middlewares/CatchError");

exports.createOfficestaf = catchError(async (req, res) => {

    const { name, mobile, alternativeMobile, email, panCard, aadharCard, addressLine1, addressLine2, state, city, pincode, username, password } = req.body;

    if (!req.files) {
        return res.status(400).send('No files uploaded.');
    }


    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const existingStaf = await OfficeStaf.findOne({ mobile: mobile });
    if (existingStaf) {
        return res.status(409).json({ message: "Mobile Number Is Already Exist! Please Try With Another One. Or Log In" });
    }
    const existingPan = await OfficeStaf.findOne({ panCard: panCard });
    if (existingPan) {
        return res.status(409).json({ message: "Pan Number Is Already Exist! " });
    }
    const existingAadhar = await OfficeStaf.findOne({ aadharCard: aadharCard });
    if (existingAadhar) {
        return res.status(409).json({ message: "Aadhar Number Is Already Exist! " });
    }
    const existingUsername = await OfficeStaf.findOne({ username: username });
    if (existingUsername) {
        return res.status(409).json({ message: "Username Is Already Taken! " });
    }
    const existingRepoEmail = await RepoAgent.findOne({ email: email });
    const existingStaffEmail = await OfficeStaf.findOne({ email: email });
    if (existingRepoEmail || existingStaffEmail) {
        return res.status(409).json({ message: "Email Is Already Taken! " });
    }

    const latestStaf = await OfficeStaf.findOne().sort({ stafId: -1 }).limit(1);

    let nextstafId;
    if (latestStaf) {
        const latestStafIdNumber = parseInt(latestStaf.stafId.substring(3));
        nextstafId = `OS${(latestStafIdNumber + 1).toString().padStart(4, '0')}`;
    } else {
        nextstafId = 'OS0001';
    }

    const newOfficestaf = new OfficeStaf({
        stafId: nextstafId,
        name,
        mobile,
        alternativeMobile,
        email,
        panCard,
        aadharCard,
        addressLine1,
        addressLine2,
        state,
        city,
        pincode,
        username,
        password: hashedPassword,
        photo: req.files.photo[0].filename,
        signature: req.files.signature[0].filename,
        aadhar: req.files.aadhar[0].filename,
        pancard: req.files.pancard[0].filename,
        cheque: req.files.cheque[0].filename,
        licence: req.files.licence[0].filename,
    });

    const savedOfficestaf = await newOfficestaf.save();
    console.log("Office Staf Created:", savedOfficestaf);
    return res.status(201).json({ savedOfficestaf });

});


exports.getOfficeStaf = catchError(async (req, res) => {
    const stafs = await OfficeStaf.find().sort({ createdAt: -1 });
    return res.status(200).json({ stafs });
});


exports.login = async (req, res) => {
    try {

        const { email, password, deviceId } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'PLease fill all the details carefully',
            });
        }

        //check for registered user
        let staf = await OfficeStaf.findOne({ email });
        if (!staf) {
            return res.status(401).json({
                success: false,
                message: 'Office Staf is not registered',
            });
        }
        if (staf.deviceId === deviceId || !staf.deviceId) {
            const payload = {
                email: staf.email,
                _id: staf._id,
                tokenVersion: staf.tokenVersion,
            };
            if (await bcrypt.compare(password, staf.password)) {
                let token = jwt.sign(payload,
                    process.env.JWT_SECRET,
                    {
                        expiresIn: "15d",
                    });
                if (!staf.deviceId) {
                    staf.deviceId = deviceId;
                }
                await staf.save();
                staf = staf.toObject();
                staf.token = token;
                staf.password = undefined;

                const options = {
                    expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                    httpOnly: true,
                    sameSite: 'none',
                    secure: true,
                }

                res.cookie("token", token, options).status(200).json({
                    success: true,
                    staf,
                    message: 'Office Staf Logged in successfully',
                });
            }
            else {
                return res.status(403).json({
                    success: false,
                    message: "Password Incorrect",
                });
            }
        } else {
            return res.status(403).json({
                success: false,
                message: 'You have already logged In to other device! Ask Admin to change device.',
            });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'Login Failure',
        });

    }
}


exports.getLastStaffId = catchError(async (req, res) => {
    const latestStaf = await OfficeStaf.findOne().sort({ stafId: -1 }).limit(1);

    let nextstafId;
    if (latestStaf) {
        const latestStafIdNumber = parseInt(latestStaf.stafId.substring(3));
        nextstafId = `OS${(latestStafIdNumber + 1).toString().padStart(4, '0')}`;
    } else {
        nextstafId = 'OS0001';
    }

    res.status(200).json({
        success: true,
        stafId: nextstafId,
    });
});

exports.changePassord = catchError(async (req, res) => {
    const { newPassword, confirmPassword } = req.body;
    const authenticatedUser = req.officeStaf;

    const stafId = authenticatedUser._id;

    const staff = await OfficeStaf.findById(stafId);

    if (!staff) {
        return res.status(404).json({ message: 'Office Staff not found' });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    staff.password = hashedPassword;
    staff.tokenVersion += 1;
    await staff.save();
    return res.status(200).json({ message: 'Password updated successfully' });
});

