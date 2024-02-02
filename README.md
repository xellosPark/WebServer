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
>>>>>>> d13ff82 (Server Start)
