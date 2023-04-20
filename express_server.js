const { generateRandomString, urlsForUser, checkUserPassword, getUserByEmail } = require('./helpers.js');

const cookieSession = require("cookie-session");
const express = require("express");
const bcrypt = require("bcryptjs");
const methodOverride = require("method-override");

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

app.use(cookieSession({
  name: "session",
  keys: ["key1", "key2"]
}));

app.use(express.urlencoded({ extended: true }));

app.use(methodOverride("_method"));

// app.use(cookieParser());

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

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
  if (!userID) {
    res.redirect("/login");
  }
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  let userId = req.session.user_id;
  let user = users[userId];
  if (!userId) {
    res.status(400).send("Please login or register to view your urls.");
  }

  let templateVars = {
    urls: urlsForUser(userId, urlDatabase),
    user
  };
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
  res.render("user_registration", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const paramsId = req.params.id;
  const userID = req.session.user_id;
  let user = users[userID];
  if (!urlDatabase[paramsId]) {
    const templateVars = {
      user: users[userID]
    };
    res.status(403).send("This URL_ID does not exist!");
  }

  if (userID !== urlDatabase[paramsId].userID) {
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
    res.status(400).send("Please login or register to create your urls.");
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
  const userID = getUserByEmail(email, users);

  if (!userID) {
    return res.status(403).send("Please enter your email correctly.");
  }

  if (userID && !checkUserPassword(password, users)) {
    res.status(403).send("Please enter your password correctly.");
  }

  if (userID && checkUserPassword(password, users)) {
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

  if (!userVars.email || !userVars.password) {
    res.status(400).send("Please enter both an email and a password to register.");;
  } else if (getUserByEmail(req.body.email, users)) {
    res.status(400).send("A user with this email already exists.");
  } else {
    users[userID] = userVars;
    req.session.user_id = userID;
    res.redirect("/urls");
  }
});

app.delete("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  if (!req.session.user_id === urlDatabase[shortURL].userID) {
    res.status(400).send("You are not authorized to delete this");
  }

  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/urls/:id/edit", (req, res) => {
  const shortURL = req.params.id;
  if (!req.session.user_id === urlDatabase[shortURL].userID) {
    res.status(400).render("You are not authorized to edit this");
  }

  urlDatabase[shortURL].longURL = req.body.newURL;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});