const express  = require("express");
const router = express.Router();

const userController = require('../controllers/userController');
const bankController = require('../controllers/bankController');
const zoneController = require('../controllers/zoneController');
const stateController = require('../controllers/stateController');
const cityController =  require('../controllers/cityController');
const emiAgentController = require('../controllers/emiAgentController');
const officeStafController =  require('../controllers/officeStafController');
const repoAgentController = require('../controllers/repoAgentController');
const idCardController = require('../controllers/idCardController');




const {auth, isAdmin,}  = require('../middlewares/Auth');

const { imageSingleUpload , imageMultiUpload, imageBulkUpload} = require("../middlewares/multer");
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

//zone Route//
router.post("/create-zone", auth, zoneController.createZone);
router.get("/zones", auth, zoneController.getZones);

//State Route//
router.post("/create-state", auth, stateController.createState);
router.get("/get-all-states", auth, stateController.getAllState);
router.get("/get-state-by-zone/:zoneId", auth, stateController.getByZone);

//City Route//
router.post("/create-city", auth, cityController.createCity);
router.get("/get-all-city", auth, cityController.getAllCity);
router.get("/get-city-by-state/:stateId", auth, cityController.getByState);

//Agent Route//
router.post("/create-agent", auth, emiAgentController.createAgent);
router.get("/get-all-agents", auth, emiAgentController.getEmiAgent);
router.get("/get-agent-by-id/:id", auth, emiAgentController.getAgentById);
router.put("/change-device/:id", auth, emiAgentController.changeDevice);
router.put("/change-status/:id", auth, emiAgentController.changeStatus);
router.put("/change-password/:id", auth, emiAgentController.changePassword);


//Office Staf Route//
router.post("/create-staf", auth, imageBulkUpload, officeStafController.createOfficestaf);

//Repo Agent Route//
router.post("/create-repo-agent", auth, repoAgentController.createRepoAgent);
router.put("/change-agent-status/:id", auth, repoAgentController.changeStatus);
router.put("/change-agent-device/:id", auth, repoAgentController.changeDevice);
router.put("/change-agent-password/:id", auth, repoAgentController.changePassword);
router.get("/get-all-repo-agents", auth, repoAgentController.getAllRepoAgents);
router.get("/get-agent-by-id/:id",auth, repoAgentController.getAgentById);

//id Card Route//
router.post("/create-id-card", auth, imageBulkUpload, idCardController.createIdCard);
router.post("/generate-qr/:cardId", auth, idCardController.generateQRCode);
router.get("/get-card/:cardId", idCardController.getCardDetails);
router.get("/get-all-cards", auth, idCardController.getAllCards);




module.exports = router;