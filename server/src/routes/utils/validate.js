"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidRequest = void 0;
const express_validator_1 = require("express-validator");
const isValidRequest = (req, res, sendMessage = true) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        if (sendMessage) {
            res.status(400).json({ errors: errors.array() });
        }
        return false;
    }
    else {
        return true;
    }
};
exports.isValidRequest = isValidRequest;
