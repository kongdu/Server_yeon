var util = {};
//이렇게 해놓으면 나중에 require로 사용할 수 있음

//이사람이 인증된적이 있는지만 확인하고 next를 통해 다른함수로 넘길거임
//next: 결과가 만족스러울때 실행해야할 함수
// Request의 인증확인-----------------
util.isLogined = function(req, res, next){
    if(req.session.isAuthenticated){
        return next();
    }
    res.status(403).send();
}

module.exports = util;