const userDatabase = require('../Database');
const jwt = require('jsonwebtoken');

const login = (req, res, next) => {
    //res.send('Hello World');
    const {email, pw} = req.body;

    const userInfo = userDatabase.filter(item => {
        return item.email === email;
    })
    res.send(userInfo);
    console.log(userInfo);
    next();
}

const accessToken = (req, res) => {
    console.log(`22222`);
}

const refreshToken = (req, res) => {
    console.log(`12345`);
}

const loginSucess = (req, res) => {
    console.log(`test`);
}

const logout = (req, res) => {
    console.log(`yaaaaaaaas`);
}

module.exports = {
  login,
  accessToken,
  refreshToken,
  loginSucess,
  logout,
}