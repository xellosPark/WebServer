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
    const isProduction = process.env.NODE_ENV === 'production';
    const { email, password } = req.body;
    console.log('로그인 진행', email, password);

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
                {
                    id: user.user_mail,
                    name: user.name
                },
                ACCESS_SECRET,
                { expiresIn: '1h' } //expiresIn
            );

            const refreshToken = jwt.sign(
                {
                    id: user.user_mail,
                    name: user.name
                },
                REFRESH_SECRET,
                { expiresIn: '5h' }
            );

            // res.cookie('accessToken', accessToken, {
            //     httpOnly: true,
            //     sameSite: 'Strict',
            //     secure: process.env.NODE_ENV === 'production', // Only set Secure in production
            //     maxAge: 3600000 // 1 hour in milliseconds
            //   });

            //   res.cookie('refreshToken', refreshToken, {
            //     httpOnly: true,
            //     sameSite: 'Strict',
            //     secure: process.env.NODE_ENV === 'production', // Only set Secure in production
            //     maxAge: 3600000 // 1 hour in milliseconds
            //   });


            global.refreshTokens.push(refreshToken);
            //console.log('login refresh추가', global.refreshTokens);
            //console.log(`db에 넣기전 refreshToken 확인 ${refreshToken}`);

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

            const userData = { email: user.user_mail, name: user.name, team: user.team, rank: user.rank };
            // 쿠키에 토큰 저장 및 응답 전송
            //console.log('accessToken 생성');
            //res.cookie('accessToken', accessToken, { httpOnly:true, secure: isProduction, sameSite: "None" });
            //res.cookie('refreshToken', refreshToken, { httpOnly:true, secure: isProduction, // HTTPS(운영 환경)를 사용할 경우에만 true로 설정
            //    sameSite: "None"//sameSite: 'strict',
            //path: '/refresh-token', //refresh-token 이걸로 path등록하면 로그아웃할때 /logout이 아닌 /refresh-token 사용해야되는것으로 보임
            //모든 경로에서 쿠키가 전송되도록 변경함
            //});
            console.log('토큰 발급 완료');

            return res.status(200).json({
                code: 200,
                message: 'success',
                accessToken,
                refreshToken,
                userData
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
    const { refreshToken } = req.body;

    console.log('로그아웃', refreshToken);
    if (!authHeader) return res.sendStatus(401);

    jwt.verify(refreshToken, REFRESH_SECRET, (err, user) => {
        if (err) {
            console.error(err); // 에러 로깅
            return res.status(403).json({ error: "Token verification failed" }); // 여기를 수정
        }

        //console.log("삭제전 ", JSON.stringify(global.refreshTokens, null, 2));
        const index = global.refreshTokens.indexOf(refreshToken);
        if (index > -1) {
            global.refreshTokens.splice(index, 1); // refreshToken이 있는 인덱스를 찾아서 제거
        }
        //console.log("삭제후", JSON.stringify(global.refreshTokens, null, 2));
        //res.clearCookie('accessToken');
        //res.clearCookie('refreshToken'); // 클라이언트 측 쿠키에서 RefreshToken을 삭제
        return res.sendStatus(200); // 성공적으로 처리되었음을 나타내는 204 상태 코드 반환
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

const boardProject = (req, res) => {
    const { Name } = req.query; //body를 사용하지 않을때는 이렇게
    //console.log(req.query);
    const sql = 'SELECT * FROM ProjectInfo WHERE Users LIKE?';
    const values = [`%${Name}%`];
    db.all(sql, values, (err, results) => {
        if (err) {
            return res.status(500).json({ message: '데이터 불러오는데 오류가 발생했습니다.', err });
        }
        //console.log(results);
        res.status(200).json(results);
    });
};

const boardLoad = async (req, res) => {
    const { projectName, site } = req.body;
    //console.log(projectName);
    
    if (projectName === "All") {
        let projectInfo = [];

        try {
            projectInfo = await new Promise((resolve, reject) => { //resolve와 reject는 Promise 객체의 두 가지 함수 매개변수로, 비동기 작업이 완료되었을 때 호출
                                            //resolve(value)는 Promise가 성공적으로 완료되었음을 나타내며, value는 Promise의 결과값
                                            //reject(reason)는 Promise가 실패했음을 나타내며, reason은 에러 또는 실패의 이유
                const sql = `SELECT ProjectName FROM ProjectInfo WHERE Site = ?`;
                db.all(sql, [site], (err, results) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(results);
                });
            });

            if (projectInfo === undefined || projectInfo?.length === 0)
                return res.status(500).json(`${site}에 맞는 해당 Project 없음`);
    
    
            const projectNameValues = projectInfo.map(project => project.ProjectName);
            const placeholders = projectNameValues.map(() => '?').join(',');
            //console.log('results', projectInfo, projectNameValues, placeholders);
            //const selSql = `SELECT * FROM ProjectTodoList_TBL WHERE Name =? AND ProjectName IN (${placeholders});`;
            const rows = await new Promise((resolve, reject) => {
                const selSql = `SELECT * FROM ProjectTodoList_TBL WHERE ProjectName IN (${placeholders});`;
                db.all(selSql, projectNameValues, (err, rows) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(rows);
                });
            });

            //console.log('rows', rows);
            res.json({
                message: 'boardLoad 성공',
                data: rows,
            });

        } catch (error) {
            console.log(err);
        res.status(500).json({ message: '데이터 불러오는데 오류가 발생했습니다.', err });
        }
        
    } else {
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
    }
};

const loadListIndex = (req, res) => {
    const { ProjectName, Date, Name, Title, Content, Status } = req.body;
    console.log('loadListIndex', ProjectName, Date, Name, Title, Content, Status);
    // 데이터를 DB에 저장하는 SQL 쿼리
    const sql = `SELECT "Index" FROM ProjectTodoList_TBL where ProjectName = ? AND Date = ? AND Name = ? AND Title = ? AND Content = ?`;

    // DB에 데이터 삽입
    db.get(sql, [ProjectName, Date, Name, Title, Content], (err, result) => {
        if (err) {
            // 에러 처리
            res.status(400).json({ error: err.message });
            return;
        }
        console.log('Load ', result);
        // 성공 응답
        res.json({
            message: 'Success',
            data: result,
        });
    });
};

const addToDoList = (req, res) => {
    const { ProjectName, Date, Period, Requester, ReqManager, Name, Title, Content, Status } = req.body;
    //console.log('addToDoList',ProjectName, Date, Name, Title, Content, Status);
    // 데이터를 DB에 저장하는 SQL 쿼리
    const sql = `INSERT INTO ProjectTodoList_TBL (ProjectName, Date, ChangeDate, Period, Requester, ReqManager, Name, Title, Content, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    // DB에 데이터 삽입
    db.run(sql, [ProjectName, Date, null, Period, Requester, ReqManager, Name, Title, Content, Status], (err) => {
        if (err) {
            // 에러 처리
            res.status(400).json({ error: err.message });
            return;
        }
        //console.log('insert ', req.body);
        // 성공 응답
        res.json({
            message: 'Success',
            data: req.body,
        });
    });
};

const updateToDoList = (req, res) => {
    const { Index, ProjectName, ChangeDate, Name, Title, Content, Status } = req.body; //Date, Name,
    //console.log(req.body);
    // 데이터를 DB에 저장하는 SQL 쿼리
    const sql = `UPDATE ProjectTodoList_TBL SET ProjectName = ?, ChangeDate = ?, Title = ?, Content = ?, Status = ? WHERE "Index" = ? AND Name = ?`;

    // DB에 데이터 삽입
    db.run(sql, [ProjectName, ChangeDate, Title, Content, Status, Index, Name], (err) => {
        if (err) {
            // 에러 처리
            console.log(err);
            res.status(400).json({ error: err.message });
            return;
        }
        //console.log("업데이트");
        // 성공 응답
        res.json({
            message: 'Success',
            //data: req.body,
        });
    });
};

const updateDateList = (req, res) => {
    const { Index, ProjectName, Name, ChangeDate, Title } = req.body; //Date, Name,
    //console.log(req.body);
    // 데이터를 DB에 저장하는 SQL 쿼리
    const sql = `UPDATE ProjectTodoList_TBL SET ChangeDate = ?, Title = ? WHERE "Index" = ? AND ProjectName =? AND Name = ?`;

    // DB에 데이터 삽입
    db.run(sql, [ChangeDate, Title, Index, ProjectName, Name], (err) => {
        if (err) {
            // 에러 처리
            console.log(err);
            res.status(400).json({ error: err.message });
            return;
        }
        //console.log("업데이트");
        // 성공 응답
        res.json({
            message: 'Success',
            //data: req.body,
        });
    });
}

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

const getImpProject = (req, res) => {
    // const { userEmail, name } = req.query;
    // const sql = 'SELECT importProject FROM UserInfo WHERE user_mail = ? AND name = ?';
    // db.get(sql, [userEmail, name], (err, user) => {
    //     if (err) {
    //         return res.status(500).json({ error: err.message });        
    //     }

    //     const userData = { email : user.user_mail, name : user.name, team : user.team, rank : user.rank, impProject : user.importProject};
    //     return res.status(200).json({userData});
    // });
};

const UpdateUserImpPrj = (req, res) => {
    const { projectName, userName } = req.body;
    const sql = `UPDATE UserInfo SET importProject = ? WHERE name = ?`;
    db.run(sql, [projectName, userName], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        return res.status(200).json({ message: 'Successfully Update UserTable', user: userName });
    });
};

const getUserInfo = (req, res) => {
    //console.log('getuserinfo 들어옴');
    const { userEmail, name } = req.query;
    console.log('getuserinfo', userEmail, name );
    //    console.log(`userinfo :  ${userEmail}, ${name}`);
    if (userEmail !== 'All') {
        const sql = 'SELECT * FROM UserInfo WHERE user_mail = ? AND name = ?';
        db.get(sql, [userEmail, name], (err, user) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (!user) {
                return res.status(404).json('user not found');
            }

            if (user === undefined) {
                console.log('user정보가 없대 403 ', user);
                console.log(`입력한 정보 userEmail : ${userEmail}, name : ${name}`);
                return res.status(500);
            }
            if (user.user_mail === undefined) {
                console.log('user정보가 없대 408 ', user);
                console.log(`입력한 정보 userEmail : ${userEmail}, name : ${name}`);
                return res.status(500);
            }

            const userData = { email: user.user_mail, name: user.name, team: user.team, rank: user.rank, impProject: user.importProject, custom: user.Custom, manager: user.Manager };
            return res.status(200).json({ userData });
        });
    } else {
        const sql = 'SELECT name FROM UserInfo WHERE team = ?';
        db.all(sql, [name], (err, user) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            //const userData = { name: user.name };
            console.log('userData', user);
            return res.status(200).json({ user });
        });
    }
}

const addKanBanList = (req, res) => {
    const { ProjectName, Content, Status, Order } = req.body;
    // 데이터를 DB에 저장하는 SQL 쿼리
    const sql = `INSERT INTO ProjectKanBanList (Project, Content, Status, "Order") VALUES (?, ?, ?, ?)`;

    // DB에 데이터 삽입
    db.run(sql, [ProjectName, Content, Status, Order], (err) => {
        if (err) {
            // 에러 처리
            console.log(err);
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

const loadKanBanList = (req, res) => {
    const { Project } = req.query; //body를 사용하지 않을때는 이렇게
    //console.log(req.query);
    const sql = 'SELECT * FROM ProjectKanBanList WHERE Project = ?';
    db.all(sql, Project, (err, results) => {
        if (err) {
            return res.status(500).json({ message: '데이터 불러오는데 오류가 발생했습니다.', err });
        }
        //console.log(results);
        res.status(200).json(results);
    });
}

const updataKanBanList = (req, res) => {
    const { Index, Project, OldContent, Content } = req.body;

    const sql = `UPDATE ProjectKanBanList SET Content = ? WHERE Project = ? AND Content = ? AND "Order" = ?`;
    db.run(sql, [Content, Project, OldContent, Index], (err) => {
        if (err) {

            return res.status(500).json({ error: err.message });
        }
        console.log('이슈 업데이트', Content);
        return res.status(200).json({ message: 'Successfully Update updataKanBanList' });
    });
}

const deleteKanBanList = (req, res) => {
    const { Project, Content, Order } = req.body;
    //console.log('deleteKanBanList ' ,Project, Content);
    const sql = 'DELETE FROM ProjectKanBanList WHERE Project = ? AND "Order" = ?';
    // 데이터베이스 쿼리 실행
    console.log('wlsgod1');
    db.run(sql, [Project, Order], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // 성공적으로 삭제된 경우
        console.log('진행왼료ㅕ');
        res.json({ message: 'Successfully deleted' });
    });

}

const boardPersnal = (req, res) => {
    const { Name } = req.query; //body를 사용하지 않을때는 이렇게
    //console.log(req.query);
    const sql = 'SELECT * FROM ProjectTodoList_TBL WHERE Name = ?';
    db.all(sql, Name, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: '데이터 불러오는데 오류가 발생했습니다.', err });
        }
        res.status(200).json(results);
    });
};

const getFile = (req, res) => {
    //console.log('getFile');
    const { Project } = req.query;
    //console.log('getFile',Project);
    const sql = 'SELECT * FROM ProjectFiles WHERE project = ?';
    db.all(sql, Project, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: '데이터 불러오는데 오류가 발생했습니다.', err });
        }
        res.status(200).json(results);
    });
};

const subAddBoard = (req, res) => {
    const { ProjectName, _ProjectName, Date, ChangeDate, Name, Title, Content, Status, FieldNum, FieldSubNum } = req.body;
    const subTableName = 'SubDashboard' + _ProjectName;

    const sql = `INSERT INTO ${subTableName} (ProjectName, Date, ChangeDate, Name, Title, Content, Status, FieldNum, FieldSubNum) VALUES (?, ?, ?, ?, ? ,? ,?, ?, ?)`;

    // DB에 데이터 삽입
    db.run(sql, [ProjectName, Date, ChangeDate, Name, Title, Content, Status, FieldNum, FieldSubNum], (err) => {
        if (err) {
            // 에러 처리
            console.log(err);
            res.status(400).json({ error: err.message });
            return;
        }
        // 성공 응답
        res.json({
            message: 'Success',
            data: req.body,
        });
    });
}

const subLoadBoard = (req, res) => {
    const { ProjectName, _ProjectName, Site } = req.body;
    //console.log(req.query);
    const subTableName = 'SubDashboard' + _ProjectName;
    if (ProjectName === "All") {
        db.all('SELECT ProjectName FROM ProjectInfo WHERE Site = ?', [Site], (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            const projectNames = rows.map(row => row.ProjectName);
            if (projectNames.length === 0) {
                res.json({ data: [] });
                return;
            }

            // 여러 테이블에서 데이터를 가져와 병합
            const queries = projectNames.map(name => {

                const _ProjectName = name.replace(/ /g, '_');
                const index = _ProjectName.indexOf('(');
                if (index !== -1) {
                    project = _ProjectName.substring(0, index);
                }
                else project = _ProjectName; // '(' 기호가 없는 경우, 전체 텍스트 반환

                const tableName = `SubDashboard${project}`;
                return new Promise((resolve, reject) => {
                    const sql = `SELECT * FROM ${tableName}`;
                    db.all(sql, (err, rows) => {
                        if (err) {
                            resolve([]); // 테이블이 없는 경우 빈 배열 반환
                        } else {
                            resolve(rows);
                        }
                    });
                });
            });

            Promise.all(queries)
                .then(results => {
                    const mergedResults = [].concat(...results);
                    res.json({ data: mergedResults });
                })
                .catch(err => {
                    res.status(500).json({ error: err.message });
                });
        });

    } else {
        const sql = `SELECT * FROM ${subTableName} WHERE ProjectName = ?`;
        db.all(sql, ProjectName, (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: '데이터 불러오는데 오류가 발생했습니다.', err });
            }
            res.status(200).json(results);
        });
    }
}

const subUpdateBoard = (req, res) => {
    const { Index, ProjectName, _ProjectName, ChangeDate, Name, Title, Content, Status, FieldNum } = req.body;
    //console.log('subUpdateBoard', req.body);
    //console.log(req.body);
    const subTableName = 'SubDashboard' + _ProjectName;
    const sql = `UPDATE ${subTableName} SET ChangeDate = ?, Title = ?, Content = ?, Status = ? WHERE "Index" =? AND FieldNum = ? AND ProjectName = ? AND Name = ?`;
    db.run(sql, [ChangeDate, Title, Content, Status, Index, FieldNum, ProjectName, Name], (err) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err.message });
        }
        return res.status(200).json({ message: 'Successfully Update subUpdateBoard' });
    });
}

const subBoardPersnal = (req, res) => {
    const { ProjectName, Name } = req.query; //body를 사용하지 않을때는 이렇게
    //console.log(req.query);
    const subTableName = 'SubDashboard' + ProjectName;
    const sql = `SELECT * FROM ${subTableName} WHERE Name = ?`;
    db.all(sql, Name, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: '데이터 불러오는데 오류가 발생했습니다.', err });
        }
        res.status(200).json(results);
    });
};

const updateGitPath = (req, res) => {
    const { url, ProjectName } = req.body;
    console.log('업데이트', req.body);
    const sql = `UPDATE ProjectInfo SET GitURL = ? WHERE ProjectName = ?`;
    db.run(sql, [url, ProjectName], (err) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err.message });
        }
        return res.status(200).json({ message: 'Successfully Update GitPath' });
    });
}

const updateGitPagePath = (req, res) => {
    const { url, ProjectName } = req.body;
    console.log('업데이트', req.body);
    const sql = `UPDATE ProjectInfo SET GitPageURL = ? WHERE ProjectName = ?`;
    db.run(sql, [url, ProjectName], (err) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err.message });
        }
        return res.status(200).json({ message: 'Successfully Update GitPagePath' });
    });
}

const loadProjectInfo = (req, res) => {
    const { ProjectName, Site } = req.query; //body를 사용하지 않을때는 이렇게
    console.log(req.query);
    if (ProjectName === "All") {
        const sql = `SELECT * FROM ProjectInfo WHERE Site = ?`;
        db.all(sql, Site, (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: '데이터 불러오는데 오류가 발생했습니다.', err });
            }
            //console.log('results', results);
            res.status(200).json(results);
        });
    } else {
        const sql = `SELECT * FROM ProjectInfo WHERE ProjectName = ?`;
        db.all(sql, ProjectName, (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: '데이터 불러오는데 오류가 발생했습니다.', err });
            }
            res.status(200).json(results);
        });
    }
}

const updateUserInfo = (req, res) => {
    const { Email, Custom } = req.body;
    console.log('업데이트 631', req.body);
    const sql = `UPDATE UserInfo SET Custom = ? WHERE user_mail = ?`;
    db.run(sql, [Custom, Email], (err) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err.message });
        }
        return res.status(200).json({ message: 'Successfully Update updateUserInfo Custom' });
    });

};

const updateStep = (req, res) => {
    const { ProjectName, Step } = req.body;
    console.log('업데이트 645', req.body);
    const sql = `UPDATE ProjectInfo SET Status = ? WHERE ProjectName = ?`;
    db.run(sql, [Step, ProjectName], (err) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err.message });
        }
        return res.status(200).json({ message: 'Successfully Update updateUserInfo Step' });
    });
}

const addProjectInfo = (req, res) => {
    const { ProjectName, Period, Users, Status, PM, Site } = req.body;
    console.log("진행 : ", req.body);
    const sql = `INSERT INTO ProjectInfo (ProjectName, Period, Users, Status, PM, GitURL, GitPageURL, Site) VALUES (?, ?, ?, ?, ?, null, null, ?)`;
    db.run(sql, [ProjectName, Period, Users, Status, PM, Site], (err) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err.message });
        }
        console.log("진행 완료");
        return res.status(200).json({ message: 'Successfully Update updateUserInfo Step' });
    });
}

const updateProjectInfo = (req, res) => {
    const { ProjectName, Period, Users, Status, PM, Site, View } = req.body;
    console.log("진행 : ", req.body);
    const sql = `UPDATE ProjectInfo SET Period = ?, Users = ?, Status = ?, PM = ?, View = ? WHERE ProjectName = ? AND Site = ?`;
    db.run(sql, [ProjectName, Period, Users, Status, PM, Site, View], (err) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err.message });
        }
        console.log("진행 완료");
        return res.status(200).json({ message: 'Successfully Update updateUserInfo Step' });
    });
}

const addTeamProject = (req, res) => {
    const { ProjectName, Date, Status, Users, StartMonth, EndMonth, ProopsMM, Manager, Site } = req.body;
    console.log("진행 : ", req.body);
    const sql = `INSERT INTO TeamProject (Date, ProjectName, Status, Users, Manager, ProopsMM, StartMonth, EndMonth, Site) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [Date, ProjectName, Status, Users, Manager, ProopsMM, StartMonth, EndMonth, Site], (err) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err.message });
        }
        console.log("진행 완료");
        return res.json({
            message: 'Success',
        });
    });
}

const updateTeamProject = (req, res) => {
    const { ProjectName, Status, Users, StartMonth, EndMonth, ProopsMM, Manager, Site } = req.body;
    console.log("진행 : ", req.body);
    const sql = `UPDATE TeamProject SET Status = ? Users = ? Manager = ? ProopsMM = ? StartMonth = ? EndMonth = ? WHERE ProjectName = ? AND Site = ?`;

    db.run(sql, [Status, Users, Manager, ProopsMM, StartMonth, EndMonth, ProjectName, Site], (err) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err.message });
        }
        console.log("진행 완료");
        return res.json({
            message: 'Success',
        });
    });
}

const getTeamProject = (req, res) => {
    const { Site } = req.query;
    console.log("getTeamProject 진행 : ", req.query);
    const sql = 'SELECT * FROM TeamProject WHERE Site = ?';
    db.all(sql, Site, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        console.log("getTeamProject 진행 완료", results);
        res.status(200).json(results);
    });
}

module.exports = {
    login,
    accessToken,
    refreshToken,
    loginSucess,
    logout,
    dbconnect,
    boardProject,
    getImpProject,
    UpdateUserImpPrj,
    boardLoad,
    loadListIndex,
    addToDoList,
    updateToDoList,
    updateDateList,
    deleteToDoList,
    getUserInfo,
    addKanBanList,
    loadKanBanList,
    updataKanBanList,
    deleteKanBanList,
    boardPersnal,
    getFile,
    subAddBoard,
    subLoadBoard,
    subUpdateBoard,
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
    getTeamProject,
}