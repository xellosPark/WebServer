const session = require('express-session');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const jwt = require("jsonwebtoken");
//const { authenticateToken } = require('./middleware/middleware');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  ////////////////Login///////////////
    login,      //post
    accessToken,//get
    refreshToken,//get
    loginSucess,//get
    logout,//post
  ////////////////Board//////////////
    getImpProject,
    boardProject, //get
    boardLoad,  //post
    addToDoList,
    updateToDoList,
    deleteToDoList,
    UpdateUserImpPrj, //post
    getUserInfo, //get
    addKanBanList,
    loadKanBanList,
    updataKanBanList,
    deleteKanBanList,
    boardPersnal,
    getFile,
    subAddBoard,
    subLoadBoard,
    subUpdateBoard,
    updateDateList,
    subBoardPersnal,
} = require('./controller/index');

const app = express();
dotenv.config();
// 데이터베이스 연결 초기화
const db = require('./Database');


const dir = path.join(__dirname, '../WebServerFiles');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true }); // recursive: true 옵션으로 중첩 폴더도 생성 가능
}

// 파일 업로드 설정
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    //cb(null, path.join(__dirname, '../uploadFiles')); // 파일이 저장될 경로
    const projectName = req.query.Project; // 프로젝트 이름으로 폴더 이름 설정
    const dir = path.join(__dirname, '../WebServerFiles', projectName); // 동적으로 폴더 경로 생성

    // 해당 경로에 폴더가 없으면 생성
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir); // 파일이 저장될 경로
  },
  filename: function(req, file, cb) {
    console.log('file', file);
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });


// 데이터베이스에 파일 정보를 저장하는 테이블 생성
// db.run(`CREATE TABLE IF NOT EXISTS ProjectFiles (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   project TEXT NOT NULL,
//   filename TEXT NOT NULL,
//   filepath TEXT NOT NULL,
//   datetime TEXT NOT NULL
// )`);
//  console.log("여기당~");


const ACCESS_TOKEN_SECRET = "ubi_7788";
const REFRESH_TOKEN_SECRET = "ubi_8877";
global.refreshTokens = []; // 리프레시 토큰 저장소
//global.refreshEmails = {};


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

let allowedOrigins = [
  'http://localhost:3000', 
  'http://localhost:8877',
  'http://192.168.0.136:8877',
  'http://14.58.108.70:8877',
  'http://todo.ubisam.com:8877',
  'http://ubisam.iptime.org:8877',
];

// Specific CORS configuration
const corsOptionsDelegate = function (req, callback) {
  var corsOptions;
  let requestOrigin = req.header('Origin');
  //console.log("Request Origin:", requestOrigin); // Debugging line

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    corsOptions = { origin: true, credentials: true }; // 'credentials: true' 옵션 추가
    //console.log("CORS allowed for:", requestOrigin); // Debugging line
  } else {
    corsOptions = { origin: false };
    //console.log("CORS denied for:", requestOrigin); // Debugging line
  }
  
  callback(null, corsOptions);
};

app.use(cors(corsOptionsDelegate));
//app.use(authenticateToken); // 미들웨어 적용

app.post('/login', login);
// 액세스 토큰 검증 미들웨어

app.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  console.log('/refresh 진행');
  if (!refreshToken && !global.refreshTokens.includes(refreshToken)) {
      return res.sendStatus(403);
  }
  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) {
          return res.sendStatus(403);
      }
      console.log('재발급 진행');
      const newAccessToken = jwt.sign({ id: user.id, username: user.username }, ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.json({ accessToken: newAccessToken });
  });
});

// 토큰 인증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN" 형식

  if (!token) return res.sendStatus(401);

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // 토큰이 유효하지 않음
    req.user = user;
    next();
  });
};

//토큰 확인 완료 24.03.04
app.get('/token',authenticateToken,(req, res) => {
  console.log('토큰 체크 완료');
  res.json({ message: "보호된 라우트에 오신 것을 환영합니다!", user: req.user });
});

app.get('/getImpProject', getImpProject);
app.get('/BoardProject', boardProject);
app.post('/UpdateUserImpPrj', UpdateUserImpPrj);
app.post('/Board', boardLoad);
app.post('/ToDoList', addToDoList);
app.post('/UpdateToDoList', updateToDoList);
app.delete('/DeleteToDoList', deleteToDoList);
app.post('/addKanBanList', addKanBanList);
app.get('/loadKanBanList', loadKanBanList);
app.post('/updataKanBanList', updataKanBanList);
app.delete('/deleteKanBanList', deleteKanBanList);
app.delete('/deleteKanBanList', deleteKanBanList);
app.get('/boardPersnal', boardPersnal);
app.get('/getFile', getFile);
app.post('/subAddBoard', subAddBoard);
app.post('/subLoadBoard', subLoadBoard);
app.post('/subUpdateBoard', subUpdateBoard);
app.post('/updateDateList', updateDateList);
app.get('/subBoardPersnal', subBoardPersnal);

app.post('/logout', logout);

// 로그아웃 라우트
app.delete('/logouts', (req, res) => {
  const { token } = req.body;
  //delete global.refreshTokens[token]; // 저장된 리프레시 토큰 삭제
  res.sendStatus(205); // 성공적으로 처리되었음을 응답
});

app.get('/getUserInfo', getUserInfo);

app.get('/api/data', (req, res) => {
    res.json({
        message: 'This is data from the server',
        items: ['Item 1', 'Item 2', 'Item 3'] //나중에 필요하면 사용 현재는 서버 연결 테스트 용
    });
});

// 파일 업로드 라우트
app.post('/uploadFile', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  const { Project, dateTime } = req.query;
  console.log('uploadFile',dateTime);
  const file = req.file;
  //const filepath = '../uploadFiles/' + file.filename;
  const filepath = path.join('../WebServerFiles', Project, file.filename); // DB에 저장할 상대 경로
  db.run(`INSERT INTO ProjectFiles (project, filename, filepath, datetime) VALUES (?, ?, ?, ?)`, [Project, file.filename, filepath, dateTime], function(err) {
    if (err) {
      return console.log(err.message);
    }
    console.log(`A file has been inserted with rowid ${this.lastID}`);
    res.status(200).send({ message: "File uploaded successfully", file: { filename: file.filename, filepath: filepath } });
  });
});

app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const projectName = req.query.Project;
  console.log(filename);
  // 파일이 저장된 디렉토리 경로, 실제 경로에 맞게 수정해야 합니다.
  const directoryPath = path.join(__dirname, '../WebServerFiles', projectName);
  const filePath = path.join(directoryPath, filename);
  
  // 파일 존재 여부를 확인
  if (fs.existsSync(filePath)) {
      // 클라이언트로 파일을 전송
      res.download(filePath, filename, (err) => {
          if (err) {
              res.status(500).send({
                  message: "File can not be downloaded: " + err,
              });
          }
      });
  } else {
      // 파일이 없는 경우 에러 메시지 전송
      res.status(404).send({
          message: "File not found",
      });
  }
});

app.delete('/deleteFile/:filename', (req, res) => {
  const filename = req.params.filename;
  const projectName = req.query.Project;
  console.log('deleteFile', filename, projectName);
  const filePath = path.join(__dirname, '../WebServerFiles', projectName, filename);
  
  // 파일 시스템에서 파일 삭제
  fs.unlink(filePath, (err) => {
      if (err) {
          return res.status(500).send({message: "Failed to delete the file."});
      }

      // 데이터베이스에서 레코드 삭제
      const sql = `DELETE FROM ProjectFiles WHERE filename = ? AND project = ?`;
      db.run(sql, [filename, projectName], function(err) {
          if (err) {
              return console.error(err.message);
          }
          console.log(`Deleted file record with filename: ${filename}`);
          res.send({message: "File and database record deleted successfully."});
      });
  });
});

// 정적 파일 제공을 위한 경로 설정
app.use(express.static(path.join(__dirname, 'build')));

// 모든 요청을 index.html로 리다이렉트
// app.get('/*', function(req, res) {
//   res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

// 디바이스 타입에 따라 다른 경로 제공
app.get('/*', function(req, res) {
  //const userAgent = req.headers['user-agent'].toLowerCase();
  //const mobileRegex = /mobile|android|touch|webos|iphone|ipad|ipod/i;
  //if (mobileRegex.test(userAgent)) {
   // 모바일 사용자의 경우 모바일 전용 경로 제공
   //res.sendFile(path.join(__dirname, 'build', 'mobile', 'index.html'));
  //} else {
   // PC 사용자의 경우 기존 경로 사용
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
  //}
});





app.listen(process.env.PORT, () => {
    console.log(`server is on ${process.env.PORT}`);
})