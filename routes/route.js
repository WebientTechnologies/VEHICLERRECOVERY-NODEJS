const express = require("express");
const router = express.Router();
const path = require('path');
const fs = require('fs');

const userController = require('../controllers/userController');
const bankController = require('../controllers/bankController');
const zoneController = require('../controllers/zoneController');
const stateController = require('../controllers/stateController');
const cityController = require('../controllers/cityController');
const emiAgentController = require('../controllers/emiAgentController');
const officeStafController = require('../controllers/officeStafController');
const repoAgentController = require('../controllers/repoAgentController');
const idCardController = require('../controllers/idCardController');
const vehicleController = require("../controllers/vehicleDataController");
const requestController = require("../controllers/requestController");
const loginController = require("../controllers/loginController");
const searchDataController = require("../controllers/searchDataController");
const dashboardController = require("../controllers/dashboardController");




const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 1000 * 1024 * 1024 } });

const storageTest = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Save the images in 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`); // Append timestamp to the original file name
    }
});

const uploadTest = multer({
    storage: storageTest,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only images are allowed!'));
        }
    }
});

const { auth, isAdmin, checkStatus } = require('../middlewares/Auth');
const { officeStafAuth } = require('../middlewares/officeStafAuth');
const { agentAuth } = require('../middlewares/agentAuth');
const { imageSingleUpload, imageMultiUpload, imageBulkUpload } = require("../middlewares/multer");

//=========================================================================================================//
// Home 
router.get("/", (req, res) => {
    res.send("Welcome to Vehicle Recovery Backend");
});


router.post("/login", loginController.login);


//****Admin Routes ****//

//User Route//
router.post("/register-user", userController.signUp);
router.post("/login-user", userController.login);
router.get("/my-profile", auth, userController.getMyProfile);
router.put("/update-my-profile", auth, userController.updateMyProfile);
router.post("/forget-password", userController.forgotPassword);
router.post("/reset-password", userController.resetPassword);
router.post("/change-password", auth, userController.updatePassword);

//Bank Route//
router.post("/create-bank", auth, bankController.createBank);
router.put("/update-bank/:id", auth, bankController.updateBank);
router.get("/get-bank", auth, bankController.getAllBanks);
router.get("/get-bank-by-id/:id", auth, bankController.getBankById);

//zone Route//
router.post("/create-zone", auth, zoneController.createZone);
router.get("/zones", zoneController.getZones);

//State Route//
router.post("/create-state", auth, stateController.createState);
router.get("/get-all-states", stateController.getAllState);
router.get("/get-state-by-zone/:zoneId", stateController.getByZone);

//City Route//
router.post("/create-city", auth, cityController.createCity);
router.get("/get-all-city", cityController.getAllCity);
router.get("/get-city-by-state/:stateId", cityController.getByState);

//Agent Route//
router.post("/create-agent", auth, emiAgentController.createAgent);
router.get("/get-all-agents", auth, emiAgentController.getEmiAgent);
router.get("/get-agent-by-id/:id", auth, emiAgentController.getAgentById);
router.put("/change-device/:id", auth, emiAgentController.changeDevice);
router.put("/change-status/:id", auth, emiAgentController.changeStatus);
router.put("/change-password/:id", auth, emiAgentController.changePassword);


//Office Staf Route//
router.post('/create-staf', uploadTest.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'signature', maxCount: 1 },
    { name: 'aadhar', maxCount: 1 },
    { name: 'pancard', maxCount: 1 },
    { name: 'cheque', maxCount: 1 },
    { name: 'licence', maxCount: 1 }
]), officeStafController.createOfficestaf);
//router.post("/create-staf", auth, imageBulkUpload, officeStafController.createOfficestaf);
router.get("/get-staf", auth, officeStafController.getOfficeStaf);
router.get("/office-stafId", auth, officeStafController.getLastStaffId);

//Repo Agent Route//
router.post("/create-repo-agent", auth, repoAgentController.createRepoAgent);
router.post("/register-repo-agent", repoAgentController.registerRepoAgent);
router.put("/change-agent-status/:id", auth, repoAgentController.changeStatus);
router.put("/change-agent-device/:id", auth, repoAgentController.changeDevice);
router.put("/change-agent-password/:id", auth, repoAgentController.changePassword);
router.get("/get-all-repo-agents", repoAgentController.getAllRepoAgents);
router.get("/get-agent-by-id/:id", repoAgentController.getAgentById);
router.get("/repo-agentId", repoAgentController.getNewAgentId);
router.get("/getLastAgentId", repoAgentController.getLastAgentId);

//id Card Route//
router.post("/create-id-card", auth, uploadTest.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'signature', maxCount: 1 },
]), idCardController.createIdCard);
router.post("/generate-qr/:cardId", auth, idCardController.generateQRCode);
router.get("/get-card/:cardId", idCardController.getCardDetails);
router.get("/get-all-cards", auth, idCardController.getAllCards);
router.get("/cardId", auth, idCardController.getNewCardId);

//Vehicle Data Route//
router.post("/upload", auth, upload.single("file"), vehicleController.uploadFile);
router.post("/upload-bank-wise-data", auth, upload.single("file"), vehicleController.uploadBankWiseData);
router.get("/get-data", auth, vehicleController.getUploadedData);
router.get("/get-all-data", checkStatus, vehicleController.getAllData);
router.get("/show-all-data-admin", vehicleController.showAllDataAdmin);
router.get("/search", vehicleController.searchVehicle);
router.get("/get-details-by-reg/:regNo", vehicleController.getByRegNo);
router.get("/search-details", vehicleController.search);
router.get("/details", auth, vehicleController.getData);
router.delete("/delete-data", auth, vehicleController.deleteData);
router.delete("/delete-by-fileName/:fileName", auth, vehicleController.deleteDataByFIleName);
router.put("/change-vehicle-status/:id", auth, vehicleController.changeStatus);
router.get("/export-data", vehicleController.exportsData);
router.get("/generateDb", vehicleController.generateDb);
// Reports Route//
router.get("/all-vehicle-list", auth, vehicleController.allVehicleList);
router.get("/hold-vehicle-list", vehicleController.holdVehicleList);
router.get("/repo-vehicle-list", vehicleController.repoVehicleList);
router.get("/release-vehicle-list", vehicleController.releaseVehicleList);
router.get("/search-vehicle-list", auth, vehicleController.searchedVehicleList);
router.get("/confirmation-vehicle-list", auth, vehicleController.confirmationVehicleList);

//Dashboard Route//
router.get("/dashboard", auth, vehicleController.getVehicleStatusCounts);
router.get("/getDashboard", checkStatus, dashboardController.getDashboard);

//Graph Routes
router.get("/hold-graph", vehicleController.holdDataGraph);
router.get("/repo-graph", vehicleController.repoDataGraph);
router.get("/release-graph", vehicleController.releaseDataGraph);
router.get("/search-graph", vehicleController.searchDataGraph);

//================================================================================================//

//****Office Staff Routes ****//


router.post("/login-office-staf", officeStafController.login);
router.post("/addVehicle", officeStafAuth, vehicleController.addVehicle);

//Dashboard//
router.get("/office-staff-dashboard", officeStafAuth, vehicleController.staffDashboard);

//Profile//
router.put("/update-password", officeStafAuth, officeStafController.changePassord);


//Repo Agent//
router.post("/create-repo-agent-by-staff", officeStafAuth, repoAgentController.createRepoAgent);
router.put("/change-agent-status-by-staff/:id", officeStafAuth, repoAgentController.changeStatus);
router.put("/change-agent-device-by-staff/:id", officeStafAuth, repoAgentController.changeDevice);
router.put("/change-agent-password-staff/:id", officeStafAuth, repoAgentController.changePassword);

//Report//
router.get("/search-vehicle-list-by-staff", officeStafAuth, vehicleController.searchedVehicleList);
router.get("/getSearch", officeStafAuth, searchDataController.getSearch);

//Request//
router.get("/request-for-staff", officeStafAuth, requestController.getRequests);
router.put("/change-vehicle-status-by-staff/:id", officeStafAuth, vehicleController.changeStatus);


//======================================================================================================//
//****Repo Agent Routes****//

router.post("/login-repo-agent", repoAgentController.login);

router.put("/hold-request", agentAuth, requestController.requestToRepoVehicle);
router.put("/search-vehicle/:id", agentAuth, vehicleController.searchedVehicleStatus);
router.put("/update-password-by-agent", agentAuth, repoAgentController.changePassord);
router.get("/agent-dashboard", agentAuth, repoAgentController.agentDashboard);

module.exports = router;