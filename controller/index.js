const userDatabase = require('../Database');
const jwt = require("jsonwebtoken");

const login = (req, res, next) => {
    //res.send('Hello World');
    const {email, password} = req.body;

    console.log(`${req.body}`);
    console.log(`${email}, ${password}`);

    const userInfo = userDatabase.filter(item => {
        return item.email === email;
    })[0];//맞는 데이터 중 첫번째 요소 가져옴
    //filter를 이용해서 데이터를 찾아낸 곳부터 0번째임, 추가 : readme 참고
    console.log(userInfo);
    //next();//미들웨어 실행을 위해 필요

     if (!userInfo) {
         res.status(403).json("Not Authorized")
     } else {
         try {
    //         // access Token 발급
             const accessToken = jwt.sign({
                 id : userInfo.id,
                 username : userInfo.username,
                 email : userInfo.email,
             }, process.env.ACCESS_SECRET, {
                 expiresIn : '5m',
                 issuer : 'About Tech',
             });//마지막 인자 : 토근 유지 시간과 정보 등등

    //         // refresh Token 발급
             const refreshToken = jwt.sign({
                 id : userInfo.id,
                 username : userInfo.username,
                 email : userInfo.email,
             }, process.env.REFRESH_SECRET, {
                 expiresIn : '24h', //accessToken을 갱신하기 위한 토큰으로 accessToken보다 시간 길어야함
                 issuer : 'About Tech',
             });

    //         //token 전송
             res.cookie("accessToken", accessToken, {
                 secure : false,
                 httpOnly : true,
             })

             res.cookie("refreshToken", refreshToken, {
                 secure : false,
                 httpOnly : true,
             })

             res.status(200).json("login success");
         } catch (error) {
             res.status(500).json(error);
         }
     }
};

const accessToken = (req, res) => {
     try {
         const token = req.cookies.accessToken;
         const data = jwt.verify(token, process.env.ACCESS_SECRET);

         const userData = userDatabase.filter(item=>{
             return item.email === data.email;
         })
     const {pw, ...others} = userData;

         res.status(200).json(userData);
     } catch (error) {
         res.status(500).json(error);
     }
};

const refreshToken = (req, res) => {
    //access token 갱신
     try {
    //     const token = req.cookies.refreshToken;
    //     const data = jwt.verify(token, process.env.REFRESH_SECRET);
    //     const userData = userDatabase.filter(item => {
    //         return item.email === data.email;
    //     })[0]

    //     //access token 새로 발급

     } catch (error) {
        
     }
}

const loginSucess = (req, res) => {
    // try {
    //     const token = req.cookies.accessToken;
    //     const data = jwt.verify(token, process.env.ACCESS_SECRET);
    //     const userData = userDatabase.filter(item => {
    //         return item.email === data.email;
    //     })[0];
    //     res.status(200).json(userData);
    // } catch (error) {
    //     res.status(500).json(error);
    // }
};

const logout = (req, res) => {
    // try {
    //     res.cookie('accessToken', '');
    //     res.status(200).json("Logout Success");
    // } catch (error) {
    //     res.status(500).json(error);
    // }
}

module.exports = {
  login,
  accessToken,
  refreshToken,
  loginSucess,
  logout,
}