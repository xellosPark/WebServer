
const jwt = require('jsonwebtoken');
const ACCESS_TOKEN_SECRET = "1234";
const REFRESH_TOKEN_SECRET = "1234";

// 액세스 토큰 검증 및 만료 시 새로 발급하는 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];  
  const token = authHeader && authHeader.split(' ')[1]; //Bearer eyJhbGciOiJIUzI1 이런식으로 보내주므로 split필욘

  //console.log(`authHeader: ${authHeader}`);
  //console.log(`token: ${token}`);
  // 액세스 토큰이 없는 경우
  if (token == null) return res.sendStatus(401); // 1. 상태 코드 401 반환

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      // 액세스 토큰이 만료된 경우
      const refreshToken = req.headers['x-refresh-token'];
      const refreshId = global.refreshTokens[refreshToken];

      //console.log(`refreshToken : ${refreshToken}`);
      //console.log(`refreshId : ${refreshId}`);
      if (!refreshToken || !global.refreshTokens[refreshToken]) {
        // 4. 리프레시 토큰이 유효하지 않거나 저장소에 없는 경우, 새로 로그인 해야 함
        //console.log("middle 401");
        return res.sendStatus(401); // 상태 코드 401 반환
      }

      jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) {
          // 리프레시 토큰이 만료된 경우
          delete global.refreshTokens[refreshToken]; // 만료된 리프레시 토큰 삭제
          //console.log("middle 403");
          return res.sendStatus(403); // 4. 상태 코드 403 반환, 새로 로그인 해야 함
        }
        
        // 2. 리프레시 토큰이 유효한 경우, 새 액세스 토큰 발급
        const newAccessToken = jwt.sign({ id: refreshId }, ACCESS_TOKEN_SECRET, { expiresIn: '1m' });
        //console.log("middle res");
        res.json({ accessToken: newAccessToken }); // 새 액세스 토큰 응답으로 전송
      });
    } else {
      // 3. 액세스 토큰이 유효한 경우, 요청 처리 계속
      req.user = user;
      //console.log("access token 존재");
      next();
    }
  });
};

module.exports = { authenticateToken };
