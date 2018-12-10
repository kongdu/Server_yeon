var express = require('express'); // npm으로 불러온걸 써보자! npm불러온거는 이름만 명시하면됨
var util = require('../util'); //우리가 직접 만든 걸 써보자! 직접만든건 위치도 알려줘야한다
const {objectId} = require('mongodb');
var router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;

var ResponseType = {
  INVALID_USERNAME:0,
  INVALID_PASSWORD:1,
  SUCCESS:2
}


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

//User Info-----------------------
router.get('/info', util.isLogined, function(req, res, next){
  // var cookies = req.cookies;
  // //로그인을 하면 쿠키를 준다
  // if(cookies.username !== undefined){ 
  //   res.send('Welcome '+ cookies.username);
  // }else{
  //   res.send('who are you?');
  // }
//  if(req.session.isAuthenticated){  //isAuthenticated가 true면
//util.isLogined에서 인증여부를 확인하기로 했으니까 더이상 필요 X
    res.json({
      username: req.session.username,
      nickname: req.session.nickname
    });


});



//로그인  1128 추가
//서버주소 + /users/signin
router.post('/signin', function(req, res, next){
  var username = req.body.username;
  var password = req.body.password;

  var database = req.app.get('database');
  var users = database.collection('users');

  if(username !== undefined && password !== undefined){
    users.findOne({username: username}, //몽고 DB에서 해당 사용자 이름으로 찾은 후
      function(err, result){
        if (result) {
            var compareResult = bcrypt.compareSync(password, result.password);
            if(compareResult){  //if (password === result.password){
            req.session.isAuthenticated = true;
            req.session.userid = result._id.toString();
            req.session.username = result.username;
            req.session.nickname = result.nickname;
          
            res.json({result: ResponseType.SUCCESS});

            //쿠키를 보내는 코드-----------------------------------
            // res.writeHead(200, {'Set-Cookie':['username='+ result.username +'; Path=/']});
            // var ret = JSON.stringify({result: ResponseType.SUCCESS});
            // res.write(ret); 
            //write 객체로 만들어져있는 함수를 클라이언트로 전달할때 문자열로 변화해주는 함수
            // res.json({result:ResponseType.SUCCESS}); 
            // res.end();
            //res.send 로 보내면 텍스트로 보내기
            //res.Json으로 보내면 json 텍스트로 보내기
            //키:밸류 형식으로 이루어져있음-------------------------------
          } else {
            res.json({result:ResponseType.INVALID_PASSWORD});
          }
        } else {
          res.json({result:ResponseType.INVALID_USERNAME});
        }
    });
  }
});

//1128과제 닉네임 가져오기
router.post('/shownick', function(req, res, next) 
{
  var username = req.body.username;
  var password = req.body.password;

  var database = req.app.get('database');
  var users = database.collection('users');

  if(username !== undefined && password !== undefined)
  {
    users.findOne({username: username}, //몽고 DB에서 해당 사용자 이름으로 찾은 후
      function(err, result)
      {
        if (result) 
        {
          if (password === result.password) 
          {
            res.send(result.nickname); //유니티의 downloadHandler

          }
        }
      }
    );
  }
  
});


//사용자 등록
router.post('/add',function(req, res, next){ 
  var username = req.body.username;
  var password = req.body.password;
  var nickname = req.body.nickname;
 // var score = req.body.score;

  var salt = bcrypt.genSaltSync(saltRounds);
  var hash = bcrypt.hashSync(password, salt);

  var database = req.app.get("database");
  var users = database.collection('users');
  if(username !== undefined && password !== undefined 
    // && nickname !== undefined){// && score !== undefined){
   && nickname !== undefined){
     users.insert([{ "username": username, "password": hash, "nickname" :nickname }],function(err, result){
    //"score": score}],function(err, result){
      res.status(200).send("success");
    });
  }
});

//Score 추가
router.get('/addscore/:score', util.isLogined, function(req, res, next){
  var database = req.app.get("database");
  var users = database.collection('users');

  var score = req.params.score;
  var userid = req.session.userid;
  
  if( userid != undefined){
    result = users.updateOne(
      { _id : ObjectID(userid) },   //{username : username},
      { $set: {score: Number(score) , updateAt: Date.now()} }, 
      { upsert: true},
      function(err) 
      {
        if(err)
        {
          res.status(200).send("failure");
        }
        res.status(200).send("success");
      }
    ); 
  }
});

//score 불러오기
router.get('/score', util.isLogined, function(req, res, next){
  var database = req.app.get("database");
  var users = database.collection('users');

  var userid = req.session.userid;  //var username = req.session.username;

  users.findOne( {_id : ObjectID(userid)}, function(err, result) {
    if (err) throw err;

    var resultObj = {
      id : result._id.toString(),
      score: result.score
    };
    res.json(resultObj);
  });
});

module.exports = router;
