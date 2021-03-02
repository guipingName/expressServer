var mysql = require('mysql')

//连接数据库
var connection = mysql.createConnection({
    // host: '10.211.55.6',
    // password: 'pingui123',
    host: '10.134.42.1',
    user: 'root',
    password: '12345678',
    database: 'galaxywind_store'
});
connection.connect();


//查询用户的socketid
exports.getUserSocketid = function(userid, callback){
    var sql = 'SELECT socketid FROM userinfo_tbl WHERE id =' + "'" + userid + "'";
    connection.query(sql,function (err, result) {
        if(err){
            console.log('[SELECT ERROR] - ',err.message);
            return;
        }
        var socketid = result[0].socketid;
        typeof(callback) === 'function' && callback(socketid);
    });
}

//插入聊天数据
exports.insertChatMsg = function(data, flag){
    var msg = data.data.isPic ? '【图片】' : data.data.msg;
    var sql = "INSERT INTO message_tbl (fid, tid, msg, stime, flag) VALUES ("
               + "'" + data.fid + "' , '" + data.tid + "' , '" + msg + "' , '"
               + data.data.stime + "' , '" + flag + "')";
    connection.query(sql);
}

//===============以下内容最新=========
//用户注册
exports.register = function(query, callback){
    var sql = 'SELECT * FROM userinfo_tbl WHERE username =' + "'" + query.nickName + "'";
    connection.query(sql, function (error, selResult) {
        if(error){
            //console.log('[SELECT ERROR] - ',error.message);
            typeof(callback) === 'function' && callback({code:1, msg:'注册失败'});
            return;
        }

        if (selResult.length == 0) {//数据库中没有这个用户
            var inSql = "INSERT INTO userinfo_tbl (username, password, img) VALUES ("
                        + "'" + query.nickName + "' , '" + query.pwd + "' , '" + query.img + "')";
            connection.query(inSql,function (err, result) {
                if(err){
                    typeof(callback) === 'function' && callback({code:1, msg:'注册失败'});
                    return;
                }
                typeof(callback) === 'function' && callback({code:0, msg:'注册成功'});
            });
        } else {
            typeof(callback) === 'function' && callback({code:1, msg:'该用户名已注册'});
        }
    });
}

//用户登录
exports.login = function(query, callback){
    var sql = 'SELECT * FROM userinfo_tbl WHERE username =' + "'" + query.nickName + "'";
    connection.query(sql,function (error, result) {
        if(error){
            typeof(callback) === 'function' && callback({code:1, msg:'登录失败'});
            return;
        }
        if (result.length == 0) {
            typeof(callback) === 'function' && callback({code:1, msg:'用户不存在'});
        } else {//只会查询到一个结果  否则注册会失败
            var item = result[0];
            if (item.password == query.pwd) {//密码正确 登录成功
                //更新下在线状态
                if (query.socid != 0) {
                    var sqlUpdate = 'UPDATE userinfo_tbl SET online = 1, socketid=' + "'" + query.socid + "' WHERE username =" + "'" + query.nickName + "'";
                    connection.query(sqlUpdate);
                }
                typeof(callback) === 'function' && callback({code:0, data:{nickName:item.username, id:item.id, img:item.img}});
            } else {
                typeof(callback) === 'function' && callback({code:1, msg:'密码错误'});
            }
        }
    });
}

//更新socketid
exports.updateSocket = function(query, callback){
    var sql = 'UPDATE userinfo_tbl SET online = 1, socketid=' + "'" + query.socid 
            + "' WHERE username =" + "'" + query.nickName + "'";
    connection.query(sql,function (error, result) {
        if(error){
            typeof(callback) === 'function' && callback({code:1, msg:'失败'});
            return;
        }
        typeof(callback) === 'function' && callback({code:0, msg:'成功'});
    });
}

//退出登录
exports.logout = function(query, callback){
    var sql = 'UPDATE userinfo_tbl SET online = 0, socketid=' + "'" + ' ' 
            + "' WHERE username =" + "'" + query.nickName + "'";
    connection.query(sql,function (error, result) {
        if(error){
            typeof(callback) === 'function' && callback({code:1, msg:'注销失败'});
            return;
        }
        typeof(callback) === 'function' && callback({code:0, msg:'注销成功'});
    });
}

//socket连接断开，自动退出
exports.autoLogout = function(socketid){
    var sql = 'UPDATE userinfo_tbl SET online = 0, socketid=' + "'" + ' ' 
            + "' WHERE socketid =" + "'" + socketid + "'";
    connection.query(sql,function (error, result) {
        if(error){

        }
    });
}

//查询未读消息
exports.unreadMsg = function(userId, callback){
    var sql = 'SELECT id FROM message_tbl WHERE tid =' + "'" + userId + "'" + 'AND flag = 0';
    connection.query(sql,function (err, result) {
        if(err){
            typeof(callback) === 'function' && callback({code:1, msg:'查询失败'});
            return;
        }
        typeof(callback) === 'function' && callback({code:0, msg:'查询成功', count:result.length});
    });
}

//会话列表
exports.chatList = function(userid, callback){
    var s1 = 'select username, img, online, fid, tid, msg, stime, flag from userinfo_tbl a,message_tbl b where (b.tid = ';
    var s2 = "'" + userid + "'" + ' and b.fid = a.id ) or (b.fid = ' + "'" + userid + "'" + " and b.tid = a.id)";
    var sql = s1 + s2;
    connection.query(sql,function (err, result) {
        if(err){
            typeof(callback) === 'function' && callback({code:1, msg:'查询失败'});
            return;
        }
        var user = [];
        result.forEach(item => {
            var newitem = {
                username:item.username,
                img:item.img,
                online:item.online,
                msg:item.msg,
                stime:item.stime.getTime(),//转成时间戳
                flag:item.flag,
                id:item.fid == userid ? item.tid : item.fid
            }
            user.push(newitem);
        });

        const newArray = [];
        user.map(item=>{
            return [item]
        }).forEach(([{...item}])=>{
            const flag = newArray.find(([{...o}])=>o.id === item.id);
            if(!flag) {
                newArray.push([{...item}])
            } else {
                newArray.forEach(([{...y}], index)=>{
                    if(y.id === item.id) {
                        if (y.stime < item.stime) {
                            newArray[index].splice(0,1,item);
                        }
                    }
                })
            }
        })

        var array = [];
        newArray.forEach(([{...item}]) => {
            array.push(item);
        })
        typeof(callback) === 'function' && callback({code:0, list:array});
    });
}

//会话历史记录
exports.chatHistory = function(query, callback){
    var s1 = 'SELECT * FROM message_tbl WHERE (fid = ';
    var s2 = "'" + query.id1 + "'" + ' AND tid = ' + "'" + query.id2 + "')" + ' OR (fid = ';
    var s3 = "'" + query.id2 + "'" + ' AND tid = ' + "'" + query.id1 + "'" + ')';
    var sql = s1 + s2 + s3;
    connection.query(sql,function (err, result) {
        if(err){
            typeof(callback) === 'function' && callback({code:1, msg:'查询失败'});
            return;
        }
        result.sort((item1, item2) => {
            return item1.stime - item2.stime;
        })
        typeof(callback) === 'function' && callback({code:0, list:result});
    });
}











