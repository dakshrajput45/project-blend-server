"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
// Custom validation function for email
var validateEmail = function (email) {
    return /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(email);
};

var TradeSchema = new mongoose_1.default.Schema({
    price: { type: Number, required: true },
    timestamp: { type: String, required: true }, // Storing as formatted string
    quantity: { type: Number, required: true },
    action: { type: String, required: true },
    ticker: { type: String, required: true }
}, { _id: false });

var StocksSchema = new mongoose_1.default.Schema({
    quantity: { type: Number, required: true ,default: 0},
    ticker: { type: String, required: true }
},{ _id: false })

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
    Balance: {type: Number, required : true, default: 1000},
    watchList: { type: [String], default: [] },
    stocks: { type: [StocksSchema], default: [] },
    trade: { type: [TradeSchema], default: [] }
}, {
    collection: 'UserInfo',
});
mongoose_1.default.model('UserInfo', UserDetailsSchema);
