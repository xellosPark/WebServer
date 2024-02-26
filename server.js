const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const {
    login,
    accessToken,
    refreshToken,
    loginSucess,
    logout,
    contactus,
} = require('./controller/index');

const app = express();
dotenv.config();

//기본설정
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin : 'http://localhost:3000',
        methods : ['GET', 'POST', 'DELETE', 'PUT'],
        credentials : true,
    })
);

app.post('/login', login);
app.get('/accesstoken', accessToken);
app.get('/refreshtoken', refreshToken);
app.get('/login/success', loginSucess);
app.post('/logout', logout);
app.get('/ContactUs', contactus);

app.get('/api/data', (req, res) => {
    res.json({
        message: 'This is data from the server',
        items: ['Item 1', 'Item 2', 'Item 3'] //나중에 필요하면 사용 현재는 서버 연결 테스트 용
    });
});

app.listen(process.env.PORT, () => {
    console.log(`server is on ${process.env.PORT}`);
})