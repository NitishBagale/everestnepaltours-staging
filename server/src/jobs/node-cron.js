const cron = require("node-cron");
const { Op } = require("sequelize");
const Otp = require("../../models/otp.model");

async function scheduleOtpCleanup() {
  cron.schedule("* * * * *", async () => {
    try {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      await Otp.destroy({
        where: {
          createdAt: {
            [Op.lt]: oneMinuteAgo,
          },
        },
      });
    } catch (error) {
      console.error("Error deleting old OTPs:", error);
    }
  });
}

module.exports = scheduleOtpCleanup;
