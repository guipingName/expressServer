const express = require('express')
const app = express()
const port = 3000
const serverPort = 8081

//npm install socket.io@2.3.0 注意版本号
var server    = app.listen(serverPort, () => {
	console.log(`Listening on port ${serverPort}!`);
});
var io        = require('socket.io').listen(server);


var mysql = require('./model/mysql.js');


//引入socket.js
require('./model/socket.js')(io);

app.get('/', (req, res) => res.send('Hello World!'))


//用户注册  可以考虑用post
app.get('/register', (req, res) => {
	mysql.register(req.query, (result) => {
		res.json(result);
	});
})

//用户登录  可以考虑用post
app.get('/login', (req, res) => {
	mysql.login(req.query, (result) => {
		res.json(result);
	});
})

//更新socket
app.get('/updateSocket', (req, res) => {
	mysql.updateSocket(req.query, (result) => {
		res.json(result);
	});
})

//退出登录
app.get('/logout', (req, res) => {
	mysql.logout(req.query, (result) => {
		res.json(result);
	});
})

//查询未读消息
app.get('/unreadMsg', (req, res) => {
	mysql.unreadMsg(req.query.id, (result) => {
		res.json(result);
	});
})

//获取会话列表
app.get('/chatList', (req, res) => {
	mysql.chatList(req.query.id, (result) => {
		res.json(result);
	});
})

//获取会话历史记录
app.get('/chatHistory', (req, res) => {
	mysql.chatHistory(req.query, (result) => {
		res.json(result);
	});
})

//标记未读消息
app.get('/untoread', (req, res) => {
	mysql.untoread(req.query, (result) => {
		console.log(result);
		res.json(result);
	});
})


app.listen(port)





















