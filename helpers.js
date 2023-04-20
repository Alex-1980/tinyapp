const bcrypt = require("bcryptjs");

function generateRandomString() {
  let randomString = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i++) {
    randomString += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return randomString;
};

const urlsForUser = function (id, urlDatas) {
  const urlsOfUser = {};

  for (const shortUrl in urlDatas) {
    if(urlDatas[shortUrl].userID === id) {
      urlsOfUser[shortUrl] = urlDatas[shortUrl];
    }
  }
  return urlsOfUser;
};

const checkUserPassword = function(password, userDatas) {
  for(const user in userDatas) {
    if(bcrypt.compareSync(password, userDatas[user].password)) {
      return true;
    }
  }
  return false;
}

const getUserByEmail = function(email, userDatas) {
  for (const user in userDatas) {
    if(userDatas[user].email === email) {
      return userDatas[user].id;
    }
  }
  return undefined;
}

module.exports = {generateRandomString, urlsForUser, checkUserPassword, getUserByEmail}