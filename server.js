const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const jwt = require("jsonwebtoken");
const { authenticateToken } = require('./middleware/middleware');
const cors = require('cors');
const {
  ////////////////Login///////////////
    login,      //post
    accessToken,//get
    refreshToken,//get
    loginSucess,//get
    logout,//post
  ////////////////Board//////////////
    boardLoad, //post
    addToDoList,
    updateToDoList,
    deleteToDoList,
} = require('./controller/index');

const app = express();
dotenv.config();
// 데이터베이스 연결 초기화
const db = require('./Database');

const ACCESS_TOKEN_SECRET = "1234";
const REFRESH_TOKEN_SECRET = "1234";
global.refreshTokens = {}; // 리프레시 토큰 저장소


process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Close the database connection.');
        process.exit(0);
    });
});


const users = {
  test: { id: 'test', password: '1234' } // 테스트 유저 설정
};

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

app.post('/Board', boardLoad);
app.post('/ToDoList', addToDoList);
app.post('/UpdateToDoList', updateToDoList);
console.log('삭제 테스트');
app.delete('/DeleteToDoList', deleteToDoList);


app.post('/login', login);
app.post('/logins', (req, res) => {
  const { email, password } = req.body;
  console.log(`${email}`, `${password}`);
  if (email === users.test.id && password === users.test.password) { // 사용자 인증 확인
    const user = { email };
    const accessToken = jwt.sign(user, ACCESS_TOKEN_SECRET, { expiresIn: '1m' }); // 액세스 토큰 생성
    const refreshToken = jwt.sign(user, REFRESH_TOKEN_SECRET, { expiresIn: '3m' }); // 리프레시 토큰 생성
    
    global.refreshTokens[refreshToken] = email; // 리프레시 토큰 저장
    console.log(`${global.refreshTokens}`);
    res.json({ accessToken, refreshToken }); // 토큰 클라이언트에 전송
    console.log(`${accessToken}`, `${refreshToken}`);
  } else {
    res.send('Username or password incorrect'); // 인증 실패 시 메시지 전송
  }
});

//app.get('/*'); // 로그인한 유저체크


// 액세스 토큰 검증 미들웨어
app.use(authenticateToken); // 미들웨어 적용

app.get('/accesstoken', accessToken);
app.get('/refreshtoken', refreshToken);
app.get('/login/success', loginSucess);

//토큰 확인 완료 24.03.04
app.post('/token', (req, res) => {
  //const { token } = req.body;
  //console.log('token',`${token}`);
  //if (!token) return res.sendStatus(401); // 토큰 없음 또는 저장된 토큰과 다름 // || !refreshTokens[token]

  // jwt.verify(token, REFRESH_TOKEN_SECRET, (err, user) => {
  //   if (err) return res.sendStatus(403); // 리프레시 토큰 만료 또는 유효하지 않음
  //   const accessToken = jwt.sign({ id: user.id }, ACCESS_TOKEN_SECRET, { expiresIn: '1m' }); // 새 액세스 토큰 생성
  //   //res.json({ accessToken }); // 새 액세스 토큰 클라이언트에 전송
  // });
});



// 로그아웃 라우트
app.delete('/logouts', (req, res) => {
  const { token } = req.body;
  delete global.refreshTokens[token]; // 저장된 리프레시 토큰 삭제
  res.sendStatus(204); // 성공적으로 처리되었음을 응답
});

app.post('/logout', logout);

app.get('/', function(req, res) {
    res.send('hello world');
  });

app.get('/api/data', (req, res) => {
    res.json({
        message: 'This is data from the server',
        items: ['Item 1', 'Item 2', 'Item 3'] //나중에 필요하면 사용 현재는 서버 연결 테스트 용
    });
});

// app.get('/getOrderList', (req, res) => {

//     let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QiLCJpYXQiOjE3MDkxNzI2NDksImV4cCI6MTcwOTE3MjcwOSwiaXNzIjoieWh3In0.1nxuaQVehmBDMb-KafUqxwcHfyyC4pZNm-MjgONF8Ig"
//     // 토큰을 디코딩하면, 토큰에 들어있는 데이터를 알 수 있는데, 검증하는 과정이라함은 예를들어 유저 데이터 등에 비교하면 될 것이다
//     jwt.verify(token, "accessecret", (error, decoded) => {
//       if (error) {
//         console.log(`에러가 났습니다\n ${error}`);
//       }
  
//       // DB 조회
//       // select * from table where u_id = '${decoed.id}'
  
//       console.log(decoded);
//       res.send(decoded);
//     })
//   });

app.listen(process.env.PORT, () => {
    console.log(`server is on ${process.env.PORT}`);
})