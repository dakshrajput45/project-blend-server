require('dotenv').config()
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const bcryptjs = require("bcryptjs")
const jwt = require("jsonwebtoken");


app.use(express.json())
app.use(cors())

const Port=process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET;
const url = process.env.url;

mongoose.connect(url, {
    useNewUrlParser:true,
}).then(()=>{
    console.log("connected");
}).catch((e)=>console.log(e));



app.listen(Port,()=>{
    console.log("jai shree ram");
    
console.log(process.env.url);
})

app.post("/post",async(req,res)=>{
    const {data} = req.body;

    try{
        if(data=="daksh")
        res.send({status:"ok"});
        
        else
        res.send({status:"user not found"});
    }
    catch(e) {
        res.send({status:"Something went wrong"})
    }
});


require("./userDetails");

const User= mongoose.model("UserInfo");

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

app.post("/watchlist", async (req, res) => {
    const { userId } = req.body;

    try {
        
        const user = jwt.verify(userId, JWT_SECRET);
        const userEmail = user.email;
        
        User.findOne({ email: userEmail })

            .then((user) => {
                if (user) {
                    return res.status(200).send({ status: "ok", data: user });
                } else {
                    return res.status(404).send({ status: "error", message: "User not found" });
                }
            })
            .catch((error) => {
                return res.status(500).send({ status: "error", message: "Internal server error" });
            });
    } catch (error) {
        return res.status(401).send({ status: "error", message: "Unauthorized" });
    }
});

app.post("/addtolist", async (req,res)=>{

    const { userId,symbol} = req.body;

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

