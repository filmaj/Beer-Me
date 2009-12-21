var toggleCheck = "";
var UTweet_ref = "";
var MTweet_ref = "";
var LTweet_ref = "";
var tweet_verify_url = "http://twitter.com/account/verify_credentials.json";
var tweet_post_url = "http://www.twitter.com/statuses/update.json";
var tweet_friends_url = "http://twitter.com/statuses/friends_timeline.json";
var tweet_user_url = "http://twitter.com/statuses/user_timeline.json?count=10";
var user = "";
var passw = "";
var authCheck = "";

function defaults(){
	document.getElementById("titleScreen").style.display = "block";
}

//code snippet and library taken from http://cubiq.org/scrolling-div-on-iphone-ipod-touch/5
function scrolling() { setTimeout(function(){ new iScroll(document.getElementById('scroller')) }, 100) }

window.onload = function(){
	defaults(); 
	scrolling();
}

document.documentElement.addEventListener('touchmove', function(e) {e.preventDefault();});

//status update functions
function StatusUpdate(){
	if (authCheck=="allow"){
		document.getElementById("titleScreen").style.display = "none";
		UTweet_ref = document.getElementById("StatusUpdate");
		checkToggle(UTweet_ref.id);
		UTweet_ref.style.display = "block";
		toggleCheck = UTweet_ref.id;
	}else{
		alert("Login Please");
	}
}
function doStatusUpdate(){
	var container_id = document.getElementById("upload");
	var status = document.getElementById("textbox").value;
	var params = "status=" + encodeURIComponent(status);
	x$(container_id).xhr(tweet_post_url,
                         { callback: function() { errorCheck2(this.responseText); }, 
						 headers: [{
								   name: "Authorization",
								   value: "Basic " + btoa(user + ":" + passw)
								   },
								   {
								   name: "Content-Length",
								   value: params.length
								   },
								   {
								   name: "Content-type",
								   value: "application/x-www-form-urlencoded"
								   },
								   {
								   name: "Connection",
								   value: "close"
								   }],
						 username: user,
						 passw: passw,
						 method: "post",
						 data: params
						 });
}
//user_timeline functions
function userTweets(){
	document.getElementById("titleScreen").style.display = "none";
	MTweet_ref = document.getElementById("myTweetsScreen");
	checkToggle(MTweet_ref.id);
	MTweet_ref.style.display = "block";
	toggleCheck = MTweet_ref.id;
}
function getUserTweets(){
	if (authCheck=="allow"){
		var id = document.getElementById("twitter_update_list");
		var script1 = document.createElement("script");
		script1.type= "text/javascript";
		script1.src = "http://twitter.com/javascripts/blogger.js";
		id.appendChild(script1);
		var script2 = document.createElement("script");
		script2.type= "text/javascript";
		var src1 = "http://twitter.com/statuses/user_timeline/"+user+".json?callback=twitterCallback2&count=10";
		script2.src = src1;
		id.appendChild(script2);
		userTweets();
	}else{
		alert("Login Please");
	}
}
//friend_timeline functions code taken from http://github.com/alunny/Pigeon/blob/master/iphone/www/script/pigeon.js
function friendTweets(){
	if (authCheck=="allow"){
		document.getElementById("titleScreen").style.display = "none";
		LTweet_ref = document.getElementById("friendTweetsScreen");
		checkToggle(LTweet_ref.id);
		LTweet_ref.style.display = "block";
		toggleCheck = LTweet_ref.id;
	
		var container_id = document.getElementById("friendTweetsScreen");
		x$(container_id).xhr(tweet_friends_url,
							 { callback: function() { displayFriends(container_id, this.responseText); },
							 headers: [{
									   name: "Authorization",
									   value: "Basic " + btoa(user + ":" + passw)
									   },
									   {
									   name: "Content-type",
									   value: "application/x-www-form-urlencoded"
									   },
									   {
									   name: "Connection",
									   value: "close"
									   }],
							 method: "get"
							 });
	}else{
		alert("Login Please");
	}
}
function displayFriends(container_id, friendTweets){
	var tweetstream = eval(friendTweets);
	var i=0;
	for (i=0; i<tweetstream.length; i++) {
		x$(container_id).html("bottom",
							  format_tweet({
										   user_name:tweetstream[i].user.name,
										   tweet_text:tweetstream[i].text
										   }));
	}
}
var format_tweet = function(options) {
	var tweetString = "<div class=\"tweet\"\n<p class=\"user_name\">{USER_NAME}: </p> <p class=\"tweet_text\">{TWEET_TEXT}</p>\n</div>";
	tweetString = tweetString.replace("{USER_NAME}",options.user_name);
	tweetString = tweetString.replace("{TWEET_TEXT}",options.tweet_text);
	return tweetString;
}

//Verify userName & password
function accountVerify(){
	user = document.getElementById("userName").value;
	passw = document.getElementById("password").value;
	var container_id = document.getElementById("login");
	x$(container_id).xhr(tweet_verify_url,
						 { callback: function() { errorCheck(this.responseText); },
						 headers: [{
								   name: "Authorization",
								   value: "Basic " + btoa(user + ":" + passw)
								   },
								   {
								   name: "Content-type",
								   value: "application/x-www-form-urlencoded"
								   },
								   {
								   name: "Connection",
								   value: "close"
								   }],
						 method: "get"
						 });
}
//code snippet taken and modified from http://javascript.internet.com/forms/limit-textarea.html
function textCounter(field, countfield, maxlimit) {
	if (field.value.length > maxlimit)
		field.value = field.value.substring(0, maxlimit);
	else 
		countfield.value = maxlimit - field.value.length;
}
function errorCheck(str){
	var test = str;
	test = test.search(/error/i);
	var numb = parseInt(test);
	if(0>numb){
		alert("Login Succeeded");
		authCheck = "allow";
		StatusUpdate();
	}else{
		alert("Login Failed. Please try again");
		authCheck = "";
	}
} 
function errorCheck2(str){
	var test = str;
	test = test.search(/error/i);
	var numb = parseInt(test);
	if(0>numb){
		alert("Status Uploaded");
		authCheck = "allow";
		document.getElementById("textbox").value = "";
		StatusUpdate();
	}else{
		alert("Status Failed to Upload");
		authCheck = "";
	}
} 
//view controller
function checkToggle(name){
	if(toggleCheck!=name){
		if(toggleCheck=="StatusUpdate"){
			UTweet_ref.style.display = "none";
		}
		if(toggleCheck=="myTweetsScreen"){
			MTweet_ref.style.display = "none";
		}
		if(toggleCheck=="friendTweetsScreen"){
			LTweet_ref.style.display = "none";
		}
	}
}
