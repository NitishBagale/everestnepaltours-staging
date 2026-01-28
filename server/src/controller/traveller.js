const { createTravellerService, getAllTravellersService, getTravellerByIdService, updateTravellerService, deleteTravellerService } = require("../services/traveller");


exports.createTraveller = async (req,res,next) =>{
    try {
        const travellerData = req.body;
        const traveller = await createTravellerService(travellerData.fullName, travellerData.email, travellerData.password, travellerData.passport, travellerData.cantactNumber, travellerData.trvelDate, travellerData.noOfTravellers, travellerData.accomodation, travellerData.description);
        res.status(201).json({
            success: true,
            data: traveller
        });
    } catch (error) {
        throw new Error(error.message);
    }

}

exports.getAllTravellers = async (req,res,next) =>{
    try {
        const travellers = await getAllTravellersService();
        res.status(200).json({
            success: true,
            data: travellers
        });
    } catch (error) {
        throw new Error(error.message);
    }
}

exports.getTravellerById = async(req,res,next) =>{
    try {
        const id = req.params.id;
        console.log("getTravellerById - Received ID:", id);
        const traveller = await getTravellerByIdService(id);
        res.status(200).json({
            success: true,
            data: traveller
        });
    } catch (error) {
        console.error("Error in getTravellerById:", error.message);
        const statusCode = error.message.includes("not found") ? 404 : 500;
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
}

exports.updateTraveller = async (req,res,next) =>{
    try {
        const id = req.params.id;   
        const updateData = req.body;
        const updatedTraveller = await updateTravellerService(id, updateData);
        res.status(200).json({
            success: true,
            data: updatedTraveller
        });
    } catch (error) {
        throw new Error(error.message);
    }
}

exports.deleteTraveller = async (req,res,next) =>{
    try {
        const id = req.params.id;   
        const deletedTraveller = await deleteTravellerService(id);
        res.status(200).json({
            success: true,
            data: deletedTraveller
        }); 
    } catch (error) {
        throw new Error(error.message);
    }   
}