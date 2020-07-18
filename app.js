//jshint esversion:6
require('dotenv').config();
const md5 = require("md5");
const express = require("express"),
bodyParser = require("body-parser"),
ejs =  require("ejs"),
mongoose = require("mongoose"),
encrypt = require("mongoose-encryption"),
bcrypt = require("bcrypt");


const app = express();

app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));

//*** SOCKET CONNECTIONS ***/
mongoose.connect(`${process.env.REMOTE_URI}`,{useNewUrlParser:true, useUnifiedTopology:true}).catch((err)=>{console.log(err)});
const port = process.env.PORT_LOCAL || process.env.PORT; // Obtain port from .env file note PORT defaults with Heroku environment
app.listen(port,console.log(`Server Started: ${port}`));


const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

//userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields: ['password']});

const User = new mongoose.model("User",userSchema);




//*** ROUTES ***


app.get("/",(req,res)=>{
    res.render("home");
});

app.get("/login",(req,res)=>{
    res.render("login");
});

app.post("/login",(req,res)=>{
    const username = req.body.username;
    const password = md5(req.body.password);

    User.findOne({email:username},(err,found)=>{
        if(!found) {
            res.send("account doesn't exist");
        } else {
            if(found && found.password === password) {
                res.render("secrets");
            } else {
                res.send("Wrong password!");
            }
        }
    });
});


app.route("/register")
    .get((req,res)=>{
        res.render("register");
    })
    .post((req,res)=>{
        const newUser = new User({
            email: req.body.username,
            password: md5(req.body.password)
        });
        newUser.save((err)=>{
            if(!err) {
                console.log("Saved");
                res.render("secrets");
            }
        });
    });








// app.route("/").get().post().put().patch().delete();