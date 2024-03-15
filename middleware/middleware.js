
const db = require('../Database');
const jwt = require('jsonwebtoken');
const ACCESS_TOKEN_SECRET = "ubi_7788";
const REFRESH_TOKEN_SECRET = "ubi_8877";

// 액세스 토큰 검증 및 만료 시 새로 발급하는 미들웨어
const authenticateToken = (req, res, next) => {
  //const {email} = req.body;
  const authHeader = req.headers['authorization'];
  const refreshToken = req.cookies.refreshToken;
  const token = authHeader && authHeader.split(' ')[1]; //Bearer eyJhbGciOiJIUzI1 이런식으로 보내주므로 split필요

  //console.log(`토큰체크 refreshToken : ${refreshToken}`);
  //console.log(`토큰체크 token : ${token}`);
  if (token == 'undefined') { //undefined 로는 체크가 안됨..
    return res.sendStatus(401); // 상태 코드 401 반환
  }

  //db로 refreshTokens 변경됐는지 확인(다른곳에서 로그인)
  // const sqlCheck = 'SELECT RefreshToken FROM UserInfo WHERE user_mail = ?';
  //   db.get(sqlCheck, [email], (err, user) => {
  //       if (err) {
  //           console.error('Token 조회 중 오류 발생:', err);
  //           return res.status(400).json({ error: 'Token 조회 중 오류가 발생했습니다.' });
  //       }
  //       console.log(`어떤 데이터를 업데이트? ${email}`);
  //       const sql = `UPDATE UserInfo SET RefreshToken = '' WHERE user_mail = ?`;
  //       // DB에 데이터 삽입
  //       db.run(sql, [email], (err) => {
  //           console.log(`어떤 데이터를 업데이트?22 ${email}`);
  //           if (err) {
  //               // 에러 처리
  //               console.log(`실페 ${err}`);
  //               res.status(400).json({ error: err.message });
  //               return;
  //           }
  //           console.log("업데이트");
  //           // 성공 응답
  //           // res.json({
  //           //     message: 'Success',
  //           //     //data: req.body,
  //           // });
  //       });

  //   });

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      // 액세스 토큰이 만료된 경우
      console.log("토큰만료");
      const refreshId = global.refreshTokens[refreshToken];
      console.log(`refreshId ${refreshId}`);

      if (!refreshToken || !global.refreshTokens[refreshToken]) {
        // 4. 리프레시 토큰이 유효하지 않거나 저장소에 없는 경우, 새로 로그인 해야 함
        console.log("middle 405");
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        return res.sendStatus(405); // 상태 코드 401 반환
      }

      jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) {
          // 리프레시 토큰이 만료된 경우
          delete global.refreshTokens[refreshToken]; // 만료된 리프레시 토큰 삭제
          console.log("middle 403");
          return res.sendStatus(403); // 4. 상태 코드 403 반환, 새로 로그인 해야 함
        }

        
        
        // 2. 리프레시 토큰이 유효한 경우, 새 액세스 토큰 발급
        const newAccessToken = jwt.sign({ id: refreshId, name: user.name }, ACCESS_TOKEN_SECRET, { expiresIn: '1h' , issuer: 'yourIssuer'});
        res.cookie('accessToken', newAccessToken, { httpOnly: false, secure: false });
        console.log("middle res");
        res.json({ accessToken: newAccessToken }); // 새 액세스 토큰 응답으로 전송
      });
    } else {
      // 3. 액세스 토큰이 유효한 경우, 요청 처리 계속
      req.user = user;
      console.log("access token 존재");
      next();
    }
  });
  };

module.exports = { authenticateToken };
