/*
 *  OAuth global object
 */

var auth = new oauth.OAuth(
        'https://api.twitter.com/oauth/request_token',  // Request token URL
        'https://api.twitter.com/oauth/access_token',   // Access token URL
        'Put your Consumer Key here!',                  // Consumer key
        'Put your Secret Key here!',                    // Consumer secret
        '1.0',
        'http://' + mprint.id + '.mprints.themprinter.com/oauth_callback/',
        'HMAC-SHA1'
);
/*
 *  Print handler
 */
mprint.preparePrint(function (options) {
    // Get our account information
    getOAuthAccessToken(function(token, tokenSecret) {
        auth.get("https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=grandst&count=12", token, tokenSecret, function(error, data, response) {
            json = JSON.parse(data);
            
            var tweets = new Array();
            var times = new Array();
            var profile_img = new String();
            
            profile_img = json[0].profile_image_url;
            
            for (var i = 0; i<json.length; i++) {
                tweets.push(json[i].text);
                var short_time = json[i].created_at.slice(0,9); //This allows us to grab the first 9 chars of the time String
                times.push(short_time);
            }
            
            var myData = { tweets: tweets, times: times, profile_img: profile_img } //get the data we want to output in a parsed format!
            
            mprint.debug(myData);
            mprint.renderTemplate("template", { data: myData }, function(err) {
                mprint.publish();
            });
        });
    });
});
/*
 *  OAuth initiation function
 */
mprint.willAuthorize(function() {
    auth.getOAuthRequestToken(function(error, oauthToken, oauthTokenSecret, results) {
        if (error) {
            mprint.debug("Error requesting OAuth token");
            mprint.debug(error);
        }
        mprint.set("oauth_token", oauthToken);
        mprint.set("oauth_token_secret", oauthTokenSecret);
        mprint.authorize({ 'type': 'oauth', 'token': oauthToken, 'tokenSecret': oauthTokenSecret, 'redirectUrl': 'https://api.twitter.com/oauth/authorize?oauth_token=' + oauthToken });
    });    
});
/*
 *  External URL handlers
 */
mprint.registerURL("/oauth_callback", function(req, res) {
    getOAuthRequestToken(function (token, tokenSecret) {
        auth.getOAuthAccessToken(token, tokenSecret, req.query.oauth_verifier, function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
            mprint.set("oauth_access_token", oauthAccessToken);
            mprint.set("oauth_access_token_secret", oauthAccessTokenSecret);
            res.redirect("https://manage.themprinter.com/mprints/edit/" + mprint.id);
        });
    });
});

//Auth checks!

mprint.registerURL("/check_request_token", function(req, res) {
    getOAuthRequestToken(function (token, tokenSecret) {
        res.send("Request token " + token + ", secret " + tokenSecret + "\n"); 
    });
});

mprint.registerURL("/check_access_token", function(req, res) {
    getOAuthAccessToken(function (token, tokenSecret) {
        res.send("Access token " + token + ", secret " + tokenSecret + "\n"); 
    });
});

function getOAuthRequestToken(cb) {
    mprint.get("oauth_token", function(err, data) {
        var oauthToken = data;
        mprint.get("oauth_token_secret", function(err, data) {
            var oauthTokenSecret = data;
            cb(oauthToken, oauthTokenSecret);
        });
    });
}

function getOAuthAccessToken(cb) {
    mprint.get("oauth_access_token", function(err, data) {
        var oauthToken = data;
        mprint.get("oauth_access_token_secret", function(err, data) {
            var oauthTokenSecret = data;
            cb(oauthToken, oauthTokenSecret);
        });
    });
}
