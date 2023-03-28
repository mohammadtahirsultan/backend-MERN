import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const app = express();

// Connecting with Database
mongoose
  .connect("mongodb://localhost:27017/backendwith6packprogrammer")
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((e) => {
    console.log(`MongoDB not Connected , Error : `, e);
  });

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true["User with this Email, Already Registered"],
  },
  password: String,
});
const User = mongoose.model("user", userSchema);

// using middlewares
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Set the view engine to avoid adding extension name (ejs)
app.set("view engine", "ejs");

// API Routes

// Authentication Checking
const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;

  if (token) {
    const decoded = jwt.verify(token, "helloworldSecret");

    req.user = await User.findById(decoded._id);
    next();
  } else {
    res.redirect("/login");
  }
};

// After Authentication,Home Page (Showing Logout)
app.get("/", isAuthenticated, (req, res) => {
  res.render("logout", { name: req.user.name });
});

// Register Page
app.get("/register", async (req, res) => {
  res.render("register");
});

// Logout Route
app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.render("login");
});

app.get("/login", (req, res) => {
  res.render("login");
});

// Login Route

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  let user = await User.findOne({ email });

  if (!user) return res.redirect("/register");
 
  const isMatch = await bcrypt.compare(password,user.password);

  if (!isMatch) {
    return res.render("login", { message: "Incorrect Credentials" });
  }

  const token = jwt.sign({ _id: user._id }, "helloworldSecret");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });

  res.redirect("/");
});

// Register Route
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  let user = await User.findOne({ email });

  if (user) {
    return res.redirect("/login");
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);

  user = await User.create({
    name,
    email,
    password: hashedPassword
  });

  const token = jwt.sign({ _id: user._id }, "helloworldSecret");

  // console.log(token);

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });

  res.redirect("/");
});

// Listening the Port
app.listen(5000, () => {
  console.log("Server is Running Dhola ");
});
