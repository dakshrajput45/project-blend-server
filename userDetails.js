"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
// Custom validation function for email
var validateEmail = function (email) {
    return /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(email);
};
var UserDetailsSchema = new mongoose_1.default.Schema({
    userName: { type: String, required: true},
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: validateEmail, // Assigning the custom validation function
            message: function (props) { return "".concat(props.value, " is not a valid email address!"); },
        },
    },
    password: { type: String, required: true },
    watchList: { type: [String], default: [] },
}, {
    collection: 'UserInfo',
});
mongoose_1.default.model('UserInfo', UserDetailsSchema);
