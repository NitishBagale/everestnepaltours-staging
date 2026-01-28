const { where } = require("sequelize")
const Team = require("../../models/team")

async function createTeamMemberService (teamData) {
   const team = await Team.create(teamData)
   return team
}

async function getTeamMemberByName (name) {
    const team = await Team.findOne({where:{name}})
    return team
}

async function getAllTeamMemberService () {
    const teams = await Team.findAll({
      order: [
        ["sort_order", "ASC"],
        ["createdAt", "DESC"],
      ],
    })
    return teams
}

async function updateTeamMemberService (name, data) {
    const team = await Team.findOne({where:{name}})
    if(!team) return null
    await team.update(data)
    return team
}

async function deleteTeamMemberService (name) {
    const team = await Team.findOne({where:{name}})
    if(!team) return null
    await team.destroy()
    return team
}

module.exports = {
    createTeamMemberService,
    getTeamMemberByName,
    getAllTeamMemberService,
    updateTeamMemberService,
    deleteTeamMemberService
}
