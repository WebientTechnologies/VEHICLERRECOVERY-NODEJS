const express  = require("express");
const router = express.Router();

const userController = require('../controllers/userController');
const bankController = require('../controllers/bankController');




const {auth, isAdmin,}  = require('../middlewares/Auth');

const { imageSingleUpload , imageMultiUpload} = require("../middlewares/multer");
// Home 
router.get("/", (req, res) =>{
    res.send("Welcome to Vehicle Recovery Backend");
});

//User Route//
router.post("/register-user", userController.signUp);
router.post("/login-user", userController.login);
router.get("/my-profile", auth, userController.getMyProfile);
router.put("/update-my-profile", auth, userController.updateMyProfile);
router.post("/forget-password",  userController.forgotPassword);
router.post("/reset-password",  userController.resetPassword);
router.post("/change-password", auth, userController.updatePassword);

//Bank Route//
router.post("/create-bank", auth, bankController.createBank);
router.put("/update-bank/:id", auth, bankController.updateBank);
router.get("/get-bank", auth, bankController.getAllBanks);
router.get("/get-bank-by-id/:id", auth, bankController.getBankById);




module.exports = router;