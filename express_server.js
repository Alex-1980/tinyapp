const cookieSession = require('cookie-session');
// const cookieParser = require('cookie-parser');
const express = require("express");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

app.use(cookieSession({
  name: 'session',
  keys: ["key1", "key2"]
}));

// app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));


function generateRandomString() {
  let randomString = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    randomString += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return randomString;
};

const urlsForUser = function (id) {
  const urlsOfUser = {};

  for (const shortUrl in urlDatabase) {
    if(urlDatabase[shortUrl].userID === id) {
      urlsOfUser[shortUrl] = urlDatabase[shortUrl];
    }
  }
  return urlsOfUser;
};

const checkUserPassword = function(password) {
  for(const user in users) {
    if(bcrypt.compareSync(password, users[user].password)) {
      return true;
    }
  }
  return false;
}

const getUserByEmail = function(email) {
  for (const user in users) {
    if(users[user].email === email) {
      return users[user].id;
    }
  }
  return false;
}

const users = {};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  }
};

app.get("/", (req, res) => {
  let userID = req.session.user_id;
  if(!userID){
    res.redirect('/login');
  } 
  res.redirect('/urls');
});

app.get("/urls", (req, res) => {
  let userId = req.session.user_id;
  let user = users[userId];
  if(!userId) {
    return res.status(400).send('Please login or register to view your urls.');
  }

  let templateVars = {
    urls: urlsForUser(userId),
    user
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let userId = req.session.user_id;
  let user = users[userId];
  if (!userId) {
    return res.redirect("/login");
  }

  let templateVars = {
    urls: urlDatabase,
    user: user
  };
  res.render("urls_new", templateVars);
});

app.get("/login", (req, res) => {
  let userId = req.session.user_id;
  let user = users[userId];
  let templateVars = {
    user: user
  };
  res.render("user_login", templateVars);
});

app.get("/register", (req, res) => {
  let userId = req.session.user_id;
  let user = users[userId];
  let templateVars = {
    user: user
  };
  res.render('user_registration', templateVars);
});

app.get("/urls/:id", (req, res) => {
  const paramsId = req.params.id;
  const userID = req.session.user_id;
  let user = users[userID];
  if(!urlDatabase[paramsId]) {
    const templateVars = {
      user: users[userID]
    };
    res.status(403).send("This URL_ID does not exist!");
  }

  if(userID !== urlDatabase[paramsId].userID) {
    const templateVars = {
      user: users[userID]
    };
    res.status(403).send("Please login or register to see your url.");
  }

  const longURL = urlDatabase[paramsId].longURL;
  const templateVars = {
    longURL: longURL,
    id: paramsId,
    user: users[req.session.userID],
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.status(400).send('Please login or register to create your urls.');
  }

  const shortURL = generateRandomString();
  const longURL = req.body.longURL;

  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: req.session.user_id,
  };

  res.redirect(`/urls/${shortURL}`);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const userID = getUserByEmail(email);

  if (!userID) {
    return res.status(403).send("Please enter your email correctly.");
  }

  if (userID && !checkUserPassword(password)) {
    res.status(403).send("Please enter your password correctly.");
  }

  if (userID && checkUserPassword(password)) {
    req.session.user_id = userID;
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  let userVars = {
    id: userID,
    email,
    password: hashedPassword
  };
  
  if(!userVars.email || !userVars.password) {
    res.status(400).send('Please enter both an email and a password to register.');;
  } else if (getUserByEmail(req.body.email)) {
    res.status(400).send('A user with this email already exists.');
  } else {
    users[userID] = userVars;
    req.session.user_id = userID;
    res.redirect("/urls");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;
  if(!req.session.user_id === urlDatabase[shortURL].userID) {
    res.status(400).send("You are not authorized to delete this")
  }

  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/urls/:id/edit", (req, res) => {
  const shortURL = req.params.id;
  if(!req.session.user_id === urlDatabase[shortURL].userID) {
    res.status(400).render("You are not authorized to edit this")
  }

  urlDatabase[shortURL] = req.body.newURL;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});