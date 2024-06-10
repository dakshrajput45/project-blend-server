//require('dotenv').config()
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require('axios')
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");


app.use(express.json())
app.use(cors())

const PORT = 5000
const JWT_SECRET = "bfjksbdkjfbsjdbcwjbcjwewdwjdvsdv";
const url = "mongodb+srv://dakshr050:DakshRajput.in@cluster0.mlbysv7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(url, {
    useNewUrlParser: true,
}).then(() => {
    console.log("connected");
}).catch((e) => console.log(e));


app.get("/home", async (req, res) => {
    res.send("jai Shree ram");
})
app.listen(PORT, () => {
    console.log("jai shree ram");
})

app.post("/post", async (req, res) => {
    const { data } = req.body;

    try {
        if (data == "daksh")
            res.send({ status: "ok" });

        else
            res.send({ status: "user not found" });
    }
    catch (e) {
        res.send({ status: "Something went wrong" })
    }
});


require("./userDetails");

const User = mongoose.model("UserInfo");

app.post("/register", async (req, res) => {
    const { userName, email, password } = req.body;
    try {
        const encryptedPassword = await bcryptjs.hash(password, 10);
        const oldUser = await User.findOne({ email });
        if (oldUser) return res.status(409).send({ error: "User Exists" });

        await User.create({
            userName,
            email,
            password: encryptedPassword,
        });
        const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1d' });

        return res.status(200).send({ status: "ok", data: token });
    } catch (error) {
        return res.status(500).send({ error: "Try Again" });
    }
});


app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).send({ error: "User Not Found" });
    }

    if (await bcryptjs.compare(password, user.password)) {
        const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '1d' });
        return res.status(200).send({ status: "ok", data: token });
    }

    return res.status(401).send({ error: "Invalid Password" });
});

app.post("/getUserData", async (req, res) => {
    const { userId } = req.body;
    console.log(userId);
    try {

        const user = jwt.verify(userId, JWT_SECRET);
        const userEmail = user.email;

        User.findOne({ email: userEmail })

            .then((user) => {
                if (user) {
                    return res.status(200).send({ status: "ok", data: user });
                } else {
                    return res.status(402).send({ status: "error", message: "User not found" });
                }
            })
            .catch((error) => {
                return res.status(500).send({ status: "error", message: "Internal server error" });
            });
    } catch (error) {
        return res.status(401).send({ status: "error", message: "Unauthorized" });
    }
});

app.post("/addtolist", async (req, res) => {

    const { userId, symbol } = req.body;

    try {
        const user = jwt.verify(userId, JWT_SECRET);
        const userEmail = user.email;

        const updatedUser = await User.findOneAndUpdate(
            { email: userEmail },
            { $addToSet: { watchList: symbol } },
            { new: true }
        );
        res.status(200).send({ message: "Symbol added to user's watchlist" });
    } catch (error) {
        res.status(401).send({ message: "Unauthorized" });
    }
});

app.post("/removefromlist", async (req, res) => {
    const { userId, symbol } = req.body;

    try {
        const user = jwt.verify(userId, JWT_SECRET);
        const userEmail = user.email;

        const updatedUser = await User.findOneAndUpdate(
            { email: userEmail },
            { $pull: { watchList: symbol } },
            { new: true }
        );

        if (updatedUser && updatedUser.watchList.includes(symbol)) {

            res.status(500).send({ message: "Failed to remove symbol from user's watchlist" });
        } else {
            // Symbol successfully removed from the watchlist
            res.status(200).send({ message: "Symbol removed from user's watchlist" });
        }
    } catch (error) {
        res.status(401).send({ message: "Unauthorized" });
    }
});

app.put("/buy", async (req, res) => {
    const { userId, price, symbol, timestamp, quantity } = req.body;
    const ticker = symbol.toUpperCase();
    try {
        const user = jwt.verify(userId, JWT_SECRET);
        const userEmail = user.email;
        const userRecord = await User.findOne({ email: userEmail });
        const balance = userRecord.Balance;
        const totalCost = price * quantity;

        if (balance < totalCost) return res.status(400).json({ msg: "You do not have enough money for this purchase" });

        let stockUpdated = false;
        for (let stock of userRecord.stocks) {
            if (stock.ticker === ticker) {
                stock.quantity += quantity;
                stockUpdated = true;
                break;
            }
        }

        if (!stockUpdated) {
            userRecord.stocks.push({ ticker: ticker, quantity: quantity });
        }
        console.log(userRecord.stocks);
        const newTrade = {
            price: price,
            timestamp: timestamp,
            quantity: quantity,
            action: "buy",
            ticker: symbol
        };
        userRecord.trade.push(newTrade);
        userRecord.Balance -= totalCost;
        console.log(userRecord.Balance);
        const updatedUser = await userRecord.save();

        if (updatedUser) {
            res.status(200).send({ message: "Purchased" });
        } else {
            res.status(404).send({ message: "error" });
        }
    } catch (e) {
        res.status(500).send(e.message);
    }
})

app.put("/addbalance", async (req, res) => {
    const { balance, userId } = req.body;
    console.log(balance);
    // Validate input
    if (!balance || balance <= 0) {
        return res.status(400).send({ message: "Invalid balance amount" });
    }

    try {
        const user = jwt.verify(userId, JWT_SECRET);
        const userEmail = user.email;
        const userRecord = await User.findOne({ email: userEmail });

        const balanceToAdd = parseFloat(balance);
        if (isNaN(balanceToAdd)) {
            return res.status(400).send({ message: "Invalid balance amount" });
        }

        if (!userRecord) {
            return res.status(404).send({ message: "User not found" });
        }

        userRecord.Balance += balanceToAdd;
        await userRecord.save();

        res.status(200).send({ message: "Balance added successfully", balance: userRecord.Balance });
    } catch (e) {
        res.status(500).send(e.message);
    }
});

app.put("/sell", async (req, res) => {
    const { ticker, userId, quantity } = req.body;
    const parsedQty = parseInt(quantity);

    try {
        const user = jwt.verify(userId, JWT_SECRET);
        const userEmail = user.email;
        const userRecord = await User.findOne({ email: userEmail });

        if (parsedQty < 1 || parsedQty > 100 || !Number.isInteger(parsedQty)) {
            return res.status(400).json({ msg: "Sale quantity must be between 1 and 100 and an integer" });
        }

        let stockUpdated = false;
        for (let stock of userRecord.stocks) {
            if (stock.ticker === ticker) {
                if (stock.quantity < parsedQty) {
                    return res.status(400).json({ msg: "You do not own enough shares of that ticker" });
                }
                stock.quantity -= quantity;
                stockUpdated = true;
                break;
            }
        }

        if (!stockUpdated) {
            return res.status(400).json({ msg: "You do not own enough shares of that ticker" });
        }

        const url = "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=IBM&interval=5min&apikey=demo";
        // const dataurl = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${ticker}&interval=5min&apikey=Q8POQTFYM0BZ3V8Y`;
        const { data } = await axios.get(url);
        const timeSeriesData = data["Time Series (5min)"];
        const timeSeriesKeys = Object.keys(timeSeriesData);
        const firstIndexKey = timeSeriesKeys[0];
        const firstIndexObject = timeSeriesData[firstIndexKey];
        const price = parseFloat(firstIndexObject["4. close"]);

        const amountToAdd = parseFloat(price*parsedQty);
        userRecord.Balance = amountToAdd + userRecord.Balance;

        await userRecord.save();
        res.status(200).send({ message: "Balance added successfully", userData: userRecord });
    } catch (e) {
        res.status(500).send(e.message);
    }
})

