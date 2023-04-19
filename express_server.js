// const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const express = require("express");

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

// app.use(cookieSession({
//   name: 'session',
//   keys: ["key1", "key2"]
// }));

app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));


function generateRandomString() {
  let randomString = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    randomString += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return randomString;
};

const checkUsersEmail = function (email) {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
};

const users = {};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/urls", (req, res) => {
  let currentUserId = req.cookies.user_id;
  let user = users[currentUserId];
  let templateVars = {
    urls: urlDatabase,
    user
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let currentUserId = req.cookies.user_id;
  let user = users[currentUserId];
  let templateVars = {
    urls: urlDatabase,
    user: user
  };
  res.render("urls_new", templateVars);
});

app.get("/login", (req, res) => {
  let currentUserId = req.cookies.user_id;
  let user = users[currentUserId];
  let templateVars = {
    user: user
  };
  res.render("user_login", templateVars)
})

app.get("/register", (req, res) => {
  let currentUserId = req.cookies.user_id;
  let user = users[currentUserId];
  let templateVars = {
    user: user
  };
  res.render('user_registration', templateVars);
});

app.get("/urls/:id", (req, res) => {
  const paramsId = req.params.id;
  const userId = req.cookies.user_id;
  let user = users[userId];
  const templateVars = { id: paramsId, longURL: urlDatabase[paramsId], user: user };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.post("/urls/newURL", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/urls/:id/edit", (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL] = req.body.newURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const {email, password} = req.body;
  const user = checkUsersEmail(email);
  if(user && user.password === password) {
    res.cookie("user_id", user.id)
  }
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const userId = generateRandomString();
  const { email, password } = req.body;
  let userVars = {
    id: userId,
    email,
    password
  };

  if (!userVars.email || !userVars.password) {
    return res.status(400).send('Please enter both an email and a password to register.');;
  } else if (checkUsersEmail(req.body.email)) {
    return res.status(400).send('A user with this email already exists.');
  } else {
    res.cookie("user_id", userId);
    users[userId] = userVars;
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});