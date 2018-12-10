const uuidv4 = require('uuid/v4'); //랜덤하면서 중복되지 않는 값을 만들어준다. //npmjs.com에서 uuid검색해서 설치한 애

module.exports = function(server) {

    // 방 정보
    var rooms = [];

    var io = require('socket.io')(server, {
        transports: ['websocket'],
    });

    //이 줄 이후에 나오는 socket은 모두 클라이언트로 생각해도 됨
    io.on('connection', function(socket) {
        console.log('Connected: ' + socket.id);

        if(rooms.length > 0){ //한사람이 접속했을경우
            var rId = rooms.shift();
            socket.join(rId, function(){
                //console.log("JOIN ROOM: "+rId);
                socket.emit('joinRoom', {room:rId});
                io.to(rId).emit('startGame');
            });
        }else {
            var roomName = uuidv4();
            socket.join(roomName, function(){
                //console.log("CREATE ROOM: "+ roomName);
                socket.emit('createRoom', {room:roomName});
                rooms.push(roomName);
            });
        }

//익명함수 선언하는 두가지 방법
//function(){}
//(val) => {} 매개변수있을때

//socket에는 disconnect와 disconnecting으로 나뉘어져있다
//특정 소켓이 접속 해제할때 disconnecting이 먼저 호출된다.
//disconnecting:Object접속해지하지 직전의 상황 //disconneted : 접속해지한 후의 상황

        socket.on('disconnecting', function(reson) {
            console.log('Disconnected: ' + socket.id);
            //특정배열에있는 값을 가지고 어떤 값만 뽑아오는 변수가있음
            //자신이 속해있는 방의 정보가 나타남 //키와 밸류로 이루어져있음
            //Object.keys > 원래 딕셔너리였던 애들의 키값만 모아서 배열에 넣어주는 함수
            var socketRooms = Object.keys(socket.rooms).filter(item => item != socket.id);
            console.dir(socketRooms);

            socketRooms.forEach(function(room){
                socket.broadcast.to(room).emit("exitRoom");
                //혼자만든방의 유저가 disconnect되면 해당 방 제거
                var idx = rooms.indexOf(room);
                //indexOf함수 >> 못찾으면 -1을 반환
                if(idx != -1){
                    rooms.splice(idx, 1); //splice: 특정값을 삭제하거나 다른값으로 대체하는 함수 //나갈때 방을 1개 지워라
                }
            });
        });

        socket.on('doPlayer', function(playerInfo) {

            var roomId = playerInfo.room;
            var cellIndex = playerInfo.position;

            socket.broadcast.to(roomId).emit('doOpponent',
            { position: cellIndex });

        });

        // socket.on('hi', function(){
        //     console.log('Hi~~');
        //     socket.emit('hello');
        //     io.emit('hello');
        //     socket.broadcast.emit('hello'); //자신(메세지를 보낸 소켓)을 제외한 나머지에게 명령어를 보냄
        //     //굳이 자신을 제외할 필요가 있을까? ex오목)클라이언트 본인은 자신이 어떤일을 했는지 본인이 알기때문에 서버를 굳이 거칠필요가없다.
        //     //ex포트나이트) 클라이언트에서 메세지 보냈을때 서버에 갔다 오면 비교적 상대 player와 sync는 잘 맞지만 클라이언트의 조작성은 떨어진다.

        // });

        socket.on('message', function(msg){
            //console.dir 해당 객체의 구조를 볼 수 있는 명령어
            console.dir(msg);
            socket.broadcast.emit('chat', msg);
            //socket.broadcast.emit("chat");
        });
    });
};
