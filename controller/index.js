const db = require('../Database');
const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');

dotenv.config();
const crypto = require('crypto');
const ACCESS_SECRET = "ubi_7788";
const REFRESH_SECRET = "ubi_8877";

// 동적으로 SECRET_KEY 생성
const SECRET_KEY = crypto.randomBytes(64).toString('hex');


const login = (req, res, next) => {
    const { email, password } = req.body;

    // 데이터베이스에서 사용자 조회 (가정)
    const sql = 'SELECT * FROM UserInfo WHERE user_mail = ? AND phon_number = ?';
    db.get(sql, [email, password], (err, user) => {
        if (err) {
            console.error('사용자 조회 중 오류 발생:', err);
            return res.status(400).json({ error: '사용자 조회 중 오류가 발생했습니다.' });
        }

        if (!user) {
            console.log('사용자를 찾을 수 없음');
            return res.status(403).json({
                code: 403,
                message: '아이디나 비밀번호가 틀렸습니다'
            });//status(200)으로 설정하고 code:403으로 변경해서 사용 가능
        }

        // 비밀번호 검증 로직 필요 (생략)

        const sql = `UPDATE UserInfo SET RefreshToken = '' WHERE user_mail = ?`;
            // DB에 데이터 삽입
            db.run(sql, [email], (err) => {
                if (err) {
                    // 에러 처리
                    console.log(`실페 ${err}`);
                    res.status(400).json({ error: err.message });
                    return;
                }
                // 성공
            });

        try {
            const accessToken = jwt.sign(
                { id: user.user_mail },
                ACCESS_SECRET,
                { expiresIn: '1h', issuer: 'yourIssuer' }
            );

            const refreshToken = jwt.sign(
                { id: user.user_mail },
                REFRESH_SECRET,
                { expiresIn: '24h', issuer: 'yourIssuer' }
            );


            global.refreshTokens[refreshToken] = email;
            console.log(`db에 넣기전 refreshToken 확인 ${refreshToken}`);

            const sql = `UPDATE UserInfo SET RefreshToken = ? WHERE user_mail = ?`;
            // DB에 데이터 삽입
            db.run(sql, [refreshToken, email], (err) => {
                if (err) {
                    // 에러 처리
                    console.log(err);
                    res.status(400).json({ error: err.message });
                    return;
                }
                // 성공
            });

            // 쿠키에 토큰 저장 및 응답 전송
            res.cookie('accessToken', accessToken, { httpOnly: false, secure: false });
            res.cookie('refreshToken', refreshToken, {
                httpOnly: false,
                secure: false, // HTTPS를 사용할 경우에만 true로 설정
                //sameSite: "none",//sameSite: 'strict',
                //path: '/refresh-token', //refresh-token 이걸로 path등록하면 로그아웃할때 /logout이 아닌 /refresh-token 사용해야되는것으로 보임
                //모든 경로에서 쿠키가 전송되도록 변경함
            });
            console.log('토큰 발급 완료');

            return res.status(200).json({
                code: 200,
                message: 'success',
                accessToken,
                refreshToken,
                user
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
        const { email, password } = req.body;
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
            id: userData.id,
            username: userData.username,
            email: userData.email,
        }, process.env.ACCESS_SECRET, {
            expiresIn: '1m',
            issuer: 'About Tech',
        });

        res.cookie('accessToken', accessToken, {
            secure: false,
            httpOnly: true,
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
    const authHeader = req.headers['authorization'];
    const refreshToken = req.cookies.refreshToken;
    if (!authHeader) return res.sendStatus(401);

    jwt.verify(refreshToken, REFRESH_SECRET, (err, user) => {
        if (err) {
            console.error(err); // 에러 로깅
            return res.status(403).json({ error: "Token verification failed" }); // 여기를 수정
        }

        console.log("삭제전 ", JSON.stringify(global.refreshTokens, null, 2));
        if (global.refreshTokens[refreshToken]) {
            delete global.refreshTokens[refreshToken];
        }
        console.log("삭제후", JSON.stringify(global.refreshTokens, null, 2));
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken'); // 클라이언트 측 쿠키에서 RefreshToken을 삭제
        return res.sendStatus(204); // 성공적으로 처리되었음을 나타내는 204 상태 코드 반환
    });

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

const boardLoad = (req, res) => {
    const { projectName } = req.body;
    //console.log(projectName);
    try {
        db.all(`SELECT * FROM ProjectTodoList_TBL where ProjectName = '${projectName}';`, [], (err, rows) => {
            //console.log(rows);
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({
                message: 'boardLoad 성공',
                data: rows,
            })
        });
    } catch (error) {
        console.log(`${error}`);
    }
}

const addToDoList = (req, res) => {
    const { ProjectName, Date, Name, Title, Content, Status } = req.body;
    // 데이터를 DB에 저장하는 SQL 쿼리
    const sql = `INSERT INTO ProjectTodoList_TBL (ProjectName, Date, Name, Title, Content, Status) VALUES (?, ?, ?, ?, ?, ?)`;

    // DB에 데이터 삽입
    db.run(sql, [ProjectName, Date, Name, Title, Content, Status], (err) => {
        if (err) {
            // 에러 처리
            res.status(400).json({ error: err.message });
            return;
        }

        // 성공 응답
        res.json({
            message: 'Success',
            data: req.body,
        });
    });
};

const updateToDoList = (req, res) => {
    const { Index, ProjectName, Title, Content, Status } = req.body; //Date, Name,
    console.log(req.body);
    // 데이터를 DB에 저장하는 SQL 쿼리
    const sql = `UPDATE ProjectTodoList_TBL SET ProjectName = ?, Title = ?, Content = ?, Status = ? WHERE "Index" = ?`;

    // DB에 데이터 삽입
    db.run(sql, [ProjectName, Title, Content, Status, Index], (err) => {
        if (err) {
            // 에러 처리
            console.log(err);
            res.status(400).json({ error: err.message });
            return;
        }
        console.log("업데이트");
        // 성공 응답
        res.json({
            message: 'Success',
            //data: req.body,
        });
    });
};

const deleteToDoList = (req, res) => {
    const { Index } = req.body;
    console.log(`${Index}`);
    if (!Index) {
        return res.status(400).json({ message: 'Index is required' });
    }

    const sql = 'DELETE FROM ProjectTodoList_TBL WHERE "Index" = ?';

    // 데이터베이스 쿼리 실행
    db.run(sql, [Index], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // 성공적으로 삭제된 경우
        res.json({ message: 'Successfully deleted', deletedID: Index });
    });
};

module.exports = {
    login,
    accessToken,
    refreshToken,
    loginSucess,
    logout,
    dbconnect,
    boardLoad,
    addToDoList,
    updateToDoList,
    deleteToDoList,
}