
const Traveller = require("../../models/traveller");
const { hashPassword } = require("../lib/bcrypt/bcrypt");

async function createTravellerService(fullName, email, password, passport, cantactNumber, trvelDate, noOfTravellers, accomodation, description) {
  try {
    const existUser = await Traveller.findOne({ where: { email } });
    if (existUser) {
      throw new Error("User with this email already exists");
    }
    const hashedPassword = await hashPassword(password);
    const newUser = await Traveller.create({
        fullName,
        email,
        password: hashedPassword,
        passport,
        cantactNumber,
        trvelDate,
        noOfTravellers,
        accomodation,
        description
    });
    return newUser;
  } catch (error) {
    throw new Error("Error creating user: " + error.message);
  }

}   

async function getAllTravellersService() {
  try {
    const travellers = await Traveller.findAll();
    return travellers;
  } catch (error) {
    throw new Error("Error fetching travellers: " + error.message);
  }

}

async function getTravellerByIdService(id) {
  try {
    console.log("Searching for traveller with ID:", id);
    const traveller = await Traveller.findByPk(id);
    if (!traveller) {
      console.log("No traveller found with ID:", id);
      throw new Error("Traveller not found");
    }
    console.log("Found traveller:", traveller.fullName);
    return traveller;
  } catch (error) {
    throw new Error("Error fetching traveller: " + error.message);
  }
}

async function updateTravellerService(id, updateData) { 
    try {
        const traveller = await Traveller.findByPk(id);
        if (!traveller) {
            throw new Error("Traveller not found");
        }
        await traveller.update(updateData);
        return traveller;
    } catch (error) {
        throw new Error("Error updating traveller: " + error.message);
    }
}

async function deleteTravellerService(id) {
    try {
        const traveller = await Traveller.findByPk(id);
        if (!traveller) {
            throw new Error("Traveller not found");
        }
        await traveller.destroy();
        return { message: "Traveller deleted successfully" };
    } catch (error) {
        throw new Error("Error deleting traveller: " + error.message);
    }
}

module.exports = {
  createTravellerService,
  getAllTravellersService,   
  getTravellerByIdService,
  updateTravellerService,
  deleteTravellerService
}