const User = require("../models/user");
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { options } = require("../routes/route");
const nodemailer = require('nodemailer');
require("dotenv").config();


exports.signUp = async (req, res) => {
  try{
    const { name, email, mobile, password } = req.body;

    // Check if the email or mobile already exists in the database
    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }],
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email or mobile already exists' });
    }

    // Hash the password before saving it to the database
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create the new customer object with the hashed password
    const newUser = new User({
      name,
      email,
      mobile,
      password: hashedPassword,
    });

    // Save the new customer to the database
   const savedUser = await newUser.save();

   return res.status(201).json({savedUser});
  }catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
   
};
  


  exports.login = async (req,res) => {
    try {

      const {email, password} = req.body;
      //validation on email and password
      if(!email || !password) {
          return res.status(400).json({
              success:false,
              message:'PLease fill all the details carefully',
          });
      }

      //check for registered user
      let user = await User.findOne({email});
      //if not a registered user
      if(!user) {
          return res.status(401).json({
              success:false,
              message:'User is not registered',
          });
      }
      
      const payload = {
          email:user.email,
          _id:user._id,
      };
      //verify password & generate a JWT token
      if(await bcrypt.compare(password,user.password) ) {
          //password match
          let token =  jwt.sign(payload, 
                              process.env.JWT_SECRET,
                              {
                                  expiresIn:"15d",
                              });

          await user.save();
          user = user.toObject();
          user.token = token;
          user.password = undefined;

          const options = {
              expires: new Date( Date.now() + 15 * 24 * 60 * 60 * 1000),
              httpOnly:true,
              sameSite: 'none',
              secure: true,
          }

          res.cookie("token", token, options).status(200).json({
              success:true,
              user,
              message:'User Logged in successfully',
          });
      }
      else {
          //passwsord do not match
          return res.status(403).json({
              success:false,
              message:"Password Incorrect",
          });
      }

    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:'Login Failure',
        });

    }
}


exports.getMyProfile = async (req, res) => {
  try {
    const authenticatedUser = req.user;

    const userId = authenticatedUser._id;

    const user = await User.findById(userId)
    .select('-password')
    .exec();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

exports.updateMyProfile = async(req,res) =>{
 
  const authenticatedUser = req.user;

  const userId = authenticatedUser._id;
  const { name, email, mobile} = req.body;
  const updatedBy = userId;
  try {
    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    
    const duplicateUser = await User.findOne({
      $and: [
        { _id: { $ne: existingUser._id } }, 
        { $or: [{ email }, { mobile }] }, 
      ],
    });

    if (duplicateUser) {
      return res.status(400).json({ error: 'Email or mobile already exists for another user' });
    }
   
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, mobile},
      { new: true }
    );

    console.log(updatedUser); 
    res.json({user:updatedUser});
  } catch (error) {
    console.error(error); 
    return res.status(500).json({ error: 'Failed to update User' });
  }
};


exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Save OTP to the user model
    user.otp = otp;
    await user.save();

    // Send OTP to the user's email
    await sendOtpEmail(email, otp);

    return res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error during OTP generation and sending:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

const sendOtpEmail = async (email, otp) => {
  // Set up nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
      port: 587,
      auth: {
          user: "webienttechenv@gmail.com",
          pass: "ljxugdpijagtxeda",
      },
  });

  // Email content
  const mailOptions = {
    from: 'webienttechenv@gmail.com',  // Replace with your email
    to: email,
    subject: 'Password Reset OTP',
    text: `Your OTP for password reset is: ${otp}`
  };

  // Send the email
  await transporter.sendMail(mailOptions);
};

exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  try {
    const user = await User.findOne({ email, otp });

    if (!user) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New Password and Confirm Password mismatch' });
    }

    // Hash the new password and save it
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    user.password = hashedPassword;

    user.otp = null; 
    await user.save();
    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error during password reset:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

exports.updatePassword = async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const authenticatedUser = req.user;

  const userId = authenticatedUser._id; 
  const email = authenticatedUser.email;
  try {
    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify the old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Incorrect old password' });
    }

    // Validate the new password and confirmation
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the user document
    user.password = hashedPassword;
    await user.save();
    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error during password update:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};



