<<<<<<< HEAD
# WebServer
=======
설치 목록
npm i express nodemon dotenv cors jsonwebtoken cookie-parser
npm install concurrently

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
>>>>>>> d13ff82 (Server Start)