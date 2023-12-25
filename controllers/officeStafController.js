const OfficeStaf = require('../models/officeStaf');
const bcrypt = require('bcryptjs');
const { catchError } = require("../middlewares/CatchError");

exports.createOfficestaf = catchError(async (req, res) => {
    
      const { name, mobile,alternativeMobile, email, panCard, aadharCard, addressLine1, addressLine2, state, city, pincode, username, password } = req.body;
  
      if (!req.s3FileUrls) {
        return res.status(400).json({ error: "File upload failed or no file provided" });
      }
  
      const {
        photo,
        signature,
        aadhar,
        pancard,
        cheque,
        licence,
      } = req.s3FileUrls;

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const existingStaf = await OfficeStaf.findOne({mobile:mobile});
        if(existingStaf){
            return res.status(409).json({message:"Mobile Number Is Already Exist! Please Try With Another One. Or Log In"});
        }
        const existingPan = await OfficeStaf.findOne({panCard:panCard});
        if(existingPan){
            return res.status(409).json({message:"Pan Number Is Already Exist! "});
        }
        const existingAadhar = await OfficeStaf.findOne({aadharCard:aadharCard});
        if(existingAadhar){
            return res.status(409).json({message:"Aadhar Number Is Already Exist! "});
        }
        const existingUsername = await OfficeStaf.findOne({username:username});
        if(existingUsername){
            return res.status(409).json({message:"Username Is Already Taken! "});
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
        stafId:nextstafId,
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
        password:hashedPassword,
        photo:photo[0],
        signature:signature[0],
        aadhar:aadhar[0],
        pancard:pancard[0],
        cheque:cheque[0],
        licence:licence[0],
      });
  
      const savedOfficestaf = await newOfficestaf.save();
      console.log("Office Staf Created:", savedOfficestaf);
     return res.status(201).json({savedOfficestaf});
    
  });
  