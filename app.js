//jshint esversion:6
require('dotenv').config();
const md5 = require("md5");
const express = require("express"),
bodyParser = require("body-parser"),
ejs =  require("ejs"),
mongoose = require("mongoose"),
encrypt = require("mongoose-encryption"),
bcrypt = require("bcrypt");
const saltRounds = 10; //used with bcrypt

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose"); // Creates Salts and Hash strings


const app = express();

app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));

//Cookie session setup
//*                    */
app.use(session({
    secret: "my little secret!",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//*** SOCKET CONNECTIONS ***/
mongoose.connect(`${process.env.REMOTE_URI}`,{useNewUrlParser:true, useUnifiedTopology:true}).catch((err)=>{console.log(err)});
const port = process.env.PORT_LOCAL || process.env.PORT; // Obtain port from .env file note PORT defaults with Heroku environment
app.listen(port,console.log(`Server Started: ${port}`));
mongoose.set("useCreateIndex",true); // fixes issues with depreciation in console/debug

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);
//userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields: ['password']});

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



//*** ROUTES ***


app.get("/",(req,res)=>{
    res.render("home");
});


app.route("/login")

.get((req,res)=>{
    res.render("login");
})

.post((req,res)=>{
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email:username},(err,found)=>{
        if(!found) {
            res.send("account doesn't exist");
        } else {
            if(found) {
                bcrypt.compare(password,found.password,(err,result)=>{
                    if(result === true) {
                        console.log(found);
                        res.render("secrets");
                    } else {
                        res.send("Wrong password!");
                    }
                });
            } 
        }
    });
});

app.route("/secrets")

    .get((req,res)=>{
        if(req.isAuthenticated()) {
            res.render("secrets"); 
        } else {
            res.redirect("/login");
        }
    });


app.route("/register")
    .get((req,res)=>{
        res.render("register");
    })
    .post((req,res)=>{
        const username = req.body.username;
        const password = req.body.password;

        User.register({username},password,(err,user)=>{
            if(err) {
                console.log(err);
            } else {
                passport.authenticate("local")(req,res,()=>{
                    //res.redirect("/secrets");
                    res.json(user);
                });
            }
        });

        // bcrypt.hash(password,saltRounds,(err,hash)=>{
        //     const newUser = new User({
        //         email: username,
        //         password: hash
        //     });
        //     newUser.save((err)=>{
        //         if(!err) {
        //             res.render("secrets");
        //         }
        //     });
        // });
        
    });








// app.route("/").get().post().put().patch().delete();