// const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const express = require("express");
const bcrypt = require("bcryptjs");

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
  return false;
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
  let userId = req.cookies.user_id;
  if(userId){
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get("/urls", (req, res) => {
  let currentUserId = req.cookies.user_id;
  let user = users[currentUserId];
  if(!currentUserId) {
    return res.status(400).send('Please login or register to view your urls.');
  }

  let templateVars = {
    urls: urlsForUser(currentUserId),
    user
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let currentUserId = req.cookies.user_id;
  let user = users[currentUserId];
  if (!currentUserId) {
    return res.redirect("/login");
  }
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
  res.render("user_login", templateVars);
});

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
  if(!urlDatabase[paramsId]) {
    const templateVars = {
      user: users[userId]
    };
    return res.status(403).render("This URL_ID does not exist!", templateVars);
  }

  if(userId !== urlDatabase[paramsId].userID) {
    const templateVars = {
      user: users[userId]
    };
    return res.status(403).render("TPlease login or register to see your url.", templateVars);
  }

  const longURL = urlDatabase[paramsId].longURL;
  const templateVars = {
    longURL: longURL,
    id: paramsId,
    user: users[req.cookies.userID],
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    return res.status(400).send('Please login or register to create your urls.');
  }

  const shortURL = generateRandomString();
  const longURL = req.body.longURL;

  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: req.cookies.user_id,
  };

  res.redirect(`/urls/${shortURL}`);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = checkUsersEmail(email);
  if (!user) {
    return res.status(403).send("Please enter your email correctly.");
  }
  if (user && !checkUserPassword(password)) {
    return res.status(403).send("Please enter your password correctly.");
  } else if (user && checkUserPassword(password)) {
    res.cookie("user_id", user.id);
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const userId = generateRandomString();
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  let userVars = {
    id: userId,
    email,
    password: hashedPassword
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
  console.log(users)
});

app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;
  if(req.cookies.user_id === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: users[req.cookies.user_id]
    };
    return res.status(400).render("You are not authorized to delete this", templateVars)
  }
});

app.post("/urls/:id/edit", (req, res) => {
  const shortURL = req.params.id;
  if(req.cookies.user_id === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL] = req.body.newURL;
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: users[req.cookies.user_id]
    };
    return res.status(400).render("You are not authorized to edit this", templateVars)
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});