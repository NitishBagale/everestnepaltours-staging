

const Team = require("../../models/team");

const {
  createTeamMemberService,
  getTeamMemberByName,
  getAllTeamMemberService,
  updateTeamMemberService,
  deleteTeamMemberService,
} = require("../services/team");

exports.createTeam = async (req, res) => {
  try {
    const data = req.body;
    if (data.sort_order === undefined || data.sort_order === null) {
      const maxOrder = await Team.max("sort_order");
      data.sort_order = Number.isFinite(maxOrder) ? maxOrder + 1 : 1;
    }
    const team = await createTeamMemberService(data);
    res.status(200).json({
      success: true,
      message: "Team created successfully",
      team,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getByName = async (req, res) => {
  try {
    const name = req.params.name;
    const team = await getTeamMemberByName(name);
    res.status(200).json({
      success: true,
      message: "Team fetching successfully",
      team,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findByPk(id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team member not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Team fetching successfully",
      team,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllTeams = async (req, res) => {
  try {
    const teams = await getAllTeamMemberService({});
    res.status(200).json({
      success: true,
      message: "Fetching all teams successfully",
      teams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateTeamByName = async (req, res) => {
  const { name: memberName } = req.params;
  const data = req.body;
  try {
    const updatedTeamMember = await updateTeamMemberService(memberName, data);
    if (!updatedTeamMember) {
      return res.status(404).json({
        success: false,
        message: "Team member not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Team member updated successfully",
      data: updatedTeamMember,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateTeamById = async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    const team = await Team.findByPk(id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team member not found",
      });
    }
    await team.update(data);
    res.status(200).json({
      success: true,
      message: "Team member updated successfully",
      data: team,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteTeamByName = async (req, res) => {
  const { name: memberName } = req.params;
    try {
    const deleted = await deleteTeamMemberService(memberName);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Team member not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Team member deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
        message: error.message,
    });
  }
};

exports.deleteTeamById = async (req, res) => {
  const { id } = req.params;
  try {
    const team = await Team.findByPk(id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team member not found",
      });
    }
    await team.destroy();
    res.status(200).json({
      success: true,
      message: "Team member deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.reorderTeams = async (req, res) => {
  try {
    const { orderUpdates } = req.body;
    if (!Array.isArray(orderUpdates)) {
      return res.status(400).json({
        success: false,
        message: "orderUpdates must be an array",
      });
    }

    await Promise.all(
      orderUpdates.map(({ id, sort_order }) =>
        Team.update({ sort_order }, { where: { id } })
      )
    );

    const teams = await getAllTeamMemberService({});
    res.status(200).json({
      success: true,
      message: "Team order updated successfully",
      teams,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
