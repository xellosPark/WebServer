const db = require('../Database');
const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');

dotenv.config();
const crypto = require('crypto');
const ACCESS_SECRET = "1234";
const REFRESH_SECRET = "1234";

// 동적으로 SECRET_KEY 생성
const SECRET_KEY = crypto.randomBytes(64).toString('hex');




const login = (req, res, next) => {
    console.log('로그인 시도');
    const { email, password } = req.body;

    // 데이터베이스에서 사용자 조회 (가정)
    const sql = 'SELECT * FROM UserInfo WHERE user_mail = ?';
    db.get(sql, [email], (err, user) => {
        if (err) {
            console.error('사용자 조회 중 오류 발생:', err);
            return res.status(400).json({ error: '사용자 조회 중 오류가 발생했습니다.' });
        }

        if (!user) {
            console.log('사용자를 찾을 수 없음');
            return res.status(403).json("Not Authorized");
        }

        // 비밀번호 검증 로직 필요 (생략)

        try {
            const accessToken = jwt.sign(
                { id: user.user_mail },
                ACCESS_SECRET,
                { expiresIn: '1m', issuer: 'yourIssuer' }
            );

            const refreshToken = jwt.sign(
                { id: user.user_mail },
                REFRESH_SECRET,
                { expiresIn: '24h', issuer: 'yourIssuer' }
            );

            global.refreshTokens[refreshToken] = email;

            // 쿠키에 토큰 저장 및 응답 전송
            res.cookie('accessToken', accessToken, { httpOnly: true, secure: true });
            res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true });
            console.log('토큰 발급 완료');

            return res.status(200).json({
                code: 200,
                message: '토큰 발급 완료',
                accessToken,
                refreshToken
            });
        } catch (error) {
            console.error('토큰 생성 중 오류:', error);
            return res.status(500).json({ error: '토큰 생성 중 서버 오류 발생' });
        }
    });
};
    
    //const userInfo = userDatabase.filter(item => {
    //    return item.email === email;
    //})[0];//맞는 데이터 중 첫번째 요소 가져옴
    //filter를 이용해서 데이터를 찾아낸 곳부터 0번째임, 추가 : readme 참고
    
    //next();//미들웨어 실행을 위해 필요

    
//액세스 토큰의 유효 기간. 유효 기간은 24시간(86400초)
const accessToken = (req, res) => {
    try {
        //const token = req.cookies.accessToken;
        const token = req.headers['accessToken'];
        //const data = jwt.verify(token, process.env.ACCESS_SECRET);
        console.log(`accessToken`);
        const sql = 'SELECT * FROM UserInfo WHERE user_mail = ?';
        db.get(sql, [req.email], (err, row) => {
            if (err) {
                return res.status(500).json({ error: '사용자 조회 중 오류가 발생했습니다.' });
            }

            if (!row) {
                return res.status(401).json({ error: '사용자를 찾을 수 없습니다.' });
            }
            const { user_password, ...others } = row;
            console.log(`${row}`);
            return res.status(200).json(row);
        });
        //const {pw, ...others} = userData;
        //res.status(200).json(userData);
    } catch (error) {
        res.status(500).json(error);
    }
};

const refreshToken = (req, res) => {
    //access token 갱신
    try {
        const token = req.cookies.refreshToken;
        const data = jwt.verify(token, process.env.REFRESH_SECRET);
        const userData = userDatabase.filter(item => {
            return item.email === data.email;
        })[0]
         //access token 새로 발급
        const accessToken = jwt.sign({
            id:userData.id,
            username: userData.username,
            email: userData.email,
        }, process.env.ACCESS_SECRET, {
            expiresIn: '1m',
            issuer: 'About Tech',
        });

        res.cookie('accessToken', accessToken, {
            secure:false,
            httpOnly:true,
        });
        res.status(200).json("Access Token Recreated");

    } catch (error) {
        res.status(500).json(error);
    }
}

const loginSucess = (req, res) => {
    try {
        const token = req.cookies.accessToken;
        const data = jwt.verify(token, process.env.ACCESS_SECRET);
        const userData = userDatabase.filter(item => {
            return item.email === data.email;
        })[0];
        res.status(200).json(userData);
    } catch (error) {
        res.status(500).json(error);
    }
};

const logout = (req, res) => {
    try {
        res.cookie('accessToken', '');
        res.status(200).json("Logout Success");
    } catch (error) {
        res.status(500).json(error);
    }
}

const dbconnect = (req, res) => {
    try {
        db.all('SELECT * FROM my_table', [], (err, rows) => {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({
                message: '성공',
                data: rows,
            })
        });
    } catch (error) {
        
    }
    
};

module.exports = {
    login,
    accessToken,
    refreshToken,
    loginSucess,
    logout,
    dbconnect,
}