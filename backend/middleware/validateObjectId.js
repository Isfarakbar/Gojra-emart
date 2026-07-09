const mongoose = require('mongoose');

const validateObjectIdParam = (paramName) => (req, res, next, value) => {
    if (!mongoose.isValidObjectId(value)) {
        return res.status(400).json({ message: `Invalid ${paramName}.` });
    }
    next();
};

module.exports = { validateObjectIdParam };
