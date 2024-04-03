설치 목록
npm i express nodemon dotenv cors jsonwebtoken cookie-parser
npm install concurrently sqlite3



//24.02.26
npm i express 

//24.03.26   *주로 파일 업로드에 사용되는 처리용 node.js 미들웨어
npm install multer

//24.04.01  session 추가
npm i express-session

//.env 파일을 사용하려면 dotenv 패키지를 설치하고 애플리케이션에서 사용해야 합니다.

package.json 추가 항목
"start": "concurrently \"react-scripts start\" \"node server.js\"",

**
Port가 중복된다면 Port변경필요
"start": "concurrently \"set PORT=3002 && react-scripts start\" \"node server.js\"",


//////////// filter 사용 예제 /////////////
let userDatabase = [
    { id: 1, username: 'user1', email: 'common@example.com', password: 'password1' },
    { id: 2, username: 'user2', email: 'unique@example.com', password: 'password2' },
    { id: 3, username: 'user3', email: 'common@example.com', password: 'password3' },
    { id: 4, username: 'user4', email: 'common@example.com', password: 'password4' },
    { id: 5, username: 'user5', email: 'unique@example.com', password: 'password5' }
];

const email = 'common@example.com';
const usersWithGivenEmail = userDatabase.filter(item => item.email === email).slice(0, 4);
console.log(usersWithGivenEmail);

//결과값
[
    { id: 1, username: 'user1', email: 'common@example.com', password: 'password1' },
    { id: 3, username: 'user3', email: 'common@example.com', password: 'password3' },
    { id: 4, username: 'user4', email: 'common@example.com', password: 'password4' }
]
//////////////////////////////////////////