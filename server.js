const express = require('express');
const sqlite3 = require('sqlite3').verbose();
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
    dbconnect,
} = require('./controller/index');

const app = express();
dotenv.config();

// 데이터베이스 연결 초기화
const db = require('./Database');


process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Close the database connection.');
        process.exit(0);
    });
});



//기본설정
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST', 'DELETE', 'PUT'],
        credentials: true,
    })
);

app.post('/login', login);
app.get('/accesstoken', accessToken);
app.get('/refreshtoken', refreshToken);
app.get('/login/success', loginSucess);
app.post('/logout', logout);
app.get('/ContactUs', contactus);
//app.get('/data', dbconnect);

app.get('/api/data', (req, res) => {
    res.json({
        message: 'This is data from the server',
        items: ['Item 1', 'Item 2', 'Item 3'] //나중에 필요하면 사용 현재는 서버 연결 테스트 용
    });
});

app.listen(process.env.PORT, () => {
    console.log(`server is on ${process.env.PORT}`);
})