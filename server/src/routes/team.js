const { Router } = require("express");
const { createTeam, getByName, getAllTeams, updateTeamByName, deleteTeamByName, reorderTeams, updateTeamById, deleteTeamById, getById } = require("../controller/team");
const isAuthenticated = require("../middleware/isAuthenticated");
const { isAuthorized } = require("../middleware/isAuthorized");

const teamRouter = Router();

teamRouter.post("/",isAuthenticated,isAuthorized("admin"), createTeam);
teamRouter.get("/search/:name", getByName);
teamRouter.get("/id/:id", getById);
teamRouter.get("/", getAllTeams);
teamRouter.post("/reorder", isAuthenticated,isAuthorized("admin"), reorderTeams);
teamRouter.put("/id/:id", isAuthenticated,isAuthorized("admin"), updateTeamById);
teamRouter.delete("/id/:id", isAuthenticated,isAuthorized("admin"), deleteTeamById);
teamRouter.put("/:name", isAuthenticated,isAuthorized("admin"), updateTeamByName);
teamRouter.delete("/:name", isAuthenticated,isAuthorized("admin"), deleteTeamByName);
module.exports = teamRouter;
