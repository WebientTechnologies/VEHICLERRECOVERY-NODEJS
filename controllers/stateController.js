const State = require('../models/state');
const Zone = require('../models/zone');
const {catchError} = require('../middlewares/CatchError');

exports.createState = catchError(async(req, res) =>{
    const {name, zoneId} = req.body;
    const existingState = await State.findOne({name:name});
    if(existingState){
        return res.status(409).json({message:"Enterd State Name is already exist"});
    }

    const newState = new State({name, zoneId});
    const savedState = await newState.save();

    return res.status(200).json({state:savedState});
});

exports.getAllState = catchError(async(req, res)=>{
    const states = await State.find().populate('zoneId', 'name').exec();
    return res.status(200).json({states:states});
});

exports.getByZone = catchError(async(req, res)=>{
    const {zoneId} = req.params;
    const states = await State.find({zoneId:zoneId}).populate('zoneId', 'name').exec();
    return res.status(200).json({states:states});
});