const db = require('../Database');
const jwt = require("jsonwebtoken");

const login = (req, res, next) => {
    //res.send('Hello World');
    //클라이언트에서 보내는 정보가(req.body) email이라면 DB전까지 무조건 변수로 사용되야함
    const {email, password} = req.body;

    console.log(`111 ${req.body}`);
    console.log(`222 ${email}, ${password}`);

    const sql = 'SELECT * FROM UserInfo WHERE user_mail = ?';
    //const로 정의된 email 쿼리이므로 email그대로 사용(DB에서만 해당 컬럼 사용)
    db.get(sql, [email], (err, row) => {
        if (err) {
            res.status(400).json({ error: '사용자 조회 중 오류가 발생했습니다.' });
            return;
        }
        // 로그인 로직 처리...
        console.log(row);
        //이 이후 row는 DB값이므로 DB의 컬럼값으로 표시해야됨
        if (row && email === row.user_mail) { // 비밀번호 비교는 해시를 사용한 보안 방식으로 대체되어야 합니다.
            // 사용자 인증에 성공한 경우, 예시로 사용자 정보와 함께 응답을 보냅니다.
            // 실제 애플리케이션에서는 비밀번호와 같은 민감한 정보를 제외해야 합니다.
            res.status(200).json({
                message: "로그인 성공"
            });
        } else {
            // 비밀번호가 일치하지 않거나 사용자를 찾을 수 없는 경우
            res.status(401).json({ error: '인증 실패' });
        }
    });
    //const userInfo = userDatabase.filter(item => {
    //    return item.email === email;
    //})[0];//맞는 데이터 중 첫번째 요소 가져옴
    //filter를 이용해서 데이터를 찾아낸 곳부터 0번째임, 추가 : readme 참고
    
    //next();//미들웨어 실행을 위해 필요

    



    // if (!userDatabase) {
    //     res.status(403).json("Not Authorized")
    // } else {
    //     try {
    // //         // access Token 발급
    //         const accessToken = jwt.sign({
    //             id : userInfo.id,
    //             username : userInfo.username,
    //             email : userInfo.email,
    //         }, process.env.ACCESS_SECRET, {
    //             expiresIn : '5m',
    //             issuer : 'About Tech',
    //         });//마지막 인자 : 토근 유지 시간과 정보 등등

    // //         // refresh Token 발급
    //         const refreshToken = jwt.sign({
    //             id : userInfo.id,
    //             username : userInfo.username,
    //             email : userInfo.email,
    //         }, process.env.REFRESH_SECRET, {
    //              expiresIn : '24h', //accessToken을 갱신하기 위한 토큰으로 accessToken보다 시간 길어야함
    //             issuer : 'About Tech',
    //         });

    // //         //token 전송
    //         res.cookie("accessToken", accessToken, {
    //             secure : false,
    //             httpOnly : true,
    //         })

    //         res.cookie("refreshToken", refreshToken, {
    //             secure : false,
    //             httpOnly : true,
    //         })

    //         res.status(200).json("login success");
    //     } catch (error) {
    //         res.status(500).json(error);
    //     }
    // }
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

const contactus = (req, res) => {
    try {
        const userInfo = {
            name: '홍길동',
            position: '사원',
            phone: '01011112222',
            email: 'hong@ubisam.com'
        }
res.status(200).json(userInfo);

    } catch (error) {
        
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
    contactus,
    dbconnect,
}