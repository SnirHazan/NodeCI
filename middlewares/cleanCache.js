const { clearCache } = require('../services/cache');

module.exports = async (req, res, next) => {
    await next();
    console.log("Cleaning cache");
    clearCache(req.user.id);
};