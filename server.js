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
const simpleGit = require('simple-git');
const socketIo = require('socket.io');
const http = require('http');
const { spawn } = require('child_process');

const log = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

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
    loadListIndex,
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
    updateGitPath,
    updateGitPagePath,
    loadProjectInfo,
    updateUserInfo,
    updateStep,
    addProjectInfo,
    updateProjectInfo,
    addTeamProject,
    updateTeamProject,
    deleteTeamProject,
    getTeamProject,
    addUserInfo,
} = require('./controller/index');

const app = express();
dotenv.config();
// 데이터베이스 연결 초기화
const db = require('./Database');

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
  }
});

app.set('io', io);


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
app.post('/loadListIndex', loadListIndex);
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
app.post('/updateGitPath', updateGitPath);
app.post('/updateGitPagePath', updateGitPagePath);
app.get('/loadProjectInfo', loadProjectInfo);
app.post('/updateUserInfo', updateUserInfo);
app.post('/updateStep', updateStep);
app.post('/addProjectInfo', addProjectInfo);
app.post('/updateProjectInfo', updateProjectInfo);
app.post('/addTeamProject', addTeamProject);
app.post('/updateTeamProject', updateTeamProject);
app.post('/deleteTeamProject', deleteTeamProject);
app.get('/getTeamProject', getTeamProject);
app.post('/addUserInfo', addUserInfo);

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
  console.log('filename',filename);
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

///////////////////////////
//git history
//////////////////////////

app.post('/repo-history', async (req, res) => {
  const { url } = req.body;
  console.log('repo-history',url);
  
  //const url = 'https://github.com/xellosPark/MyReactProject.git';
  const repoName = getProjectName(url);
  // 경로 설정
  const sourceRepoPath = path.resolve(`../Github-Repo/${repoName}`);
  try {
      const io = req.app.get('io');
      await cloneOrUpdateRepo(url, sourceRepoPath, '소스 레포지토리', io);
      const commitLog = await getCommitLog(sourceRepoPath);
      res.json({  result: 'SUCCESS', commitLog });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


const cloneOrUpdateRepo = async (repoUrl, repoPath, repoName, io) => {
  if (!fs.existsSync(repoPath)) {
    fs.mkdirSync(repoPath, { recursive: true });
  }

  const git = simpleGit(repoPath);

  if (!fs.existsSync(path.join(repoPath, '.git'))) {
    log(`${repoName} 클론 시작: ${repoUrl}`);
    try {
      await new Promise((resolve, reject) => {
        const gitProcess = spawn('git', ['clone', repoUrl, repoPath, '--progress']);

        gitProcess.stdout.on('data', (data) => {
          log(`[${repoName} 진행 상황] ${data.toString()}`);
          io.emit('progress', data.toString());
        });

        gitProcess.stderr.on('data', (data) => {
          const message = data.toString();
          if (/error|fatal/i.test(message)) {
            log(`[${repoName} 오류] ${message}`);
          } else {
            log(`[${repoName} 진행 상황] ${message}`);
          }
          io.emit('progress', message);
        });

        gitProcess.on('close', (code) => {
          if (code === 0) {
            log(`${repoName} 클론 완료: ${repoPath}`);
            resolve();
          } else {
            reject(new Error(`${repoName} 클론 실패: 종료 코드 ${code}`));
          }
        });
      });
    } catch (error) {
      log(`${repoName} 클론 중 오류: ${error.message}`);
      throw new Error(`${repoName} 클론 중 오류: ${error.message}`);
    }
  } else {
    log(`${repoName} 업데이트 시작: ${repoPath}`);
    try {
      const branches = await git.branch(['-r']);
      console.log('branches', branches);
      if (branches.all.includes('origin/main')) {
        await git.pull('origin', 'main');
        console.log('Successfully pulled main branch.');
    } else {
        console.log('Main branch does not exist on remote.');
    }

    if (branches.all.includes('origin/master')) {
        await git.pull('origin', 'master');
        console.log('Successfully pulled master branch.');
    } else {
        console.log('Master branch does not exist on remote.');
    }


      //await git.pull('origin', 'main');
      log(`${repoName} 업데이트 완료: ${repoPath}`);
    } catch (error) {
      log(`${repoName} 업데이트 중 오류: ${error.message}`);
      throw new Error(`${repoName} 업데이트 중 오류: ${error.message}`);
    }
  }
};

const getCommitLog = async (repoPath) => {
  const git = simpleGit(repoPath);

  try {
    log('커밋 로그 가져오기 시작');
    const logSummary = await git.log();
    log('커밋 로그 가져오기 완료');
    return logSummary.all;
  } catch (error) {
    log(`커밋 로그 가져오기 중 오류: ${error.message}`);
    throw new Error(`커밋 로그 가져오기 중 오류: ${error.message}`);
  }
};

const getProjectName = (repoUrl) => {
    const urlParts = repoUrl.split('/');
    const repoNameWithGit = urlParts[urlParts.length - 1];
    const repoName = repoNameWithGit.replace('.git', '');
    return repoName;
  };



// 현재 시간을 가져오는 유틸리티 함수
function getCurrentTime() {
  //console.log(`${getCurrentTime()} - 리포지토리 히스토리를 성공적으로 가져왔습니다`); --- 사용방법
  return new Date().toISOString();
}



// 정적 파일 제공을 위한 경로 설정
app.use(express.static(path.join(__dirname, 'build')));

// 모든 요청을 index.html로 리다이렉트
// app.get('/*', function(req, res) {
//   res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

// 디바이스 타입에 따라 다른 경로 제공
app.get('*', function(req, res) {
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