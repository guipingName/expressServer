
var mysql=require('./mysql.js')

module.exports = function(io){
	var socketList = {};

	io.sockets.on('connection', function(socket){
		socket.emit('client-connect', socket.id);

		//统计连接的客户端数
		socketList[socket.id] = socket.id;

		let socketids = Object.values(socketList);
		console.log(' ('+socket.id+') '+'连接成功' +'   当前活跃用户:' + socketids.length);


		//发送消息
		socket.on('message', (msg) => {
			if (msg.data.isPic) {
				var tempData = {
					fid:msg.fid,
					tid:msg.tid,
					data:{
						msg:'[[[图片]]]',
						isPic:msg.data.isPic,
						stime:msg.data.stime
					}
				}
				//console.log(tempData);
			} else {
				console.log(msg);
			}
			mysql.getUserSocketid(msg.tid, (sid) => {
				let socketids = Object.values(socketList);
				if (socketids.indexOf(sid) != -1) {
					socket.to(sid).emit('receiveMessage',msg);
					mysql.insertChatMsg(msg, 1);
				} else {
					mysql.insertChatMsg(msg, 0);
				}
			});
		});

		//socket连接断开
		socket.on('disconnect', () => {
			if(socketList.hasOwnProperty(socket.id)){
				delete socketList[socket.id];
			}
			let socketids = Object.values(socketList);
			console.log(' ('+socket.id+') '+'连接断开' +'   当前活跃用户:' + socketids.length);
			mysql.autoLogout(socket.id);
		})
	});
}