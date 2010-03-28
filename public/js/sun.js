// Force WebSocket to work properly
WebSocket.__swfLocation = "/swf/WebSocketMain.swf";

// Create the Pusher instance
var main_listener = new Pusher("a337f1f0e27defa52a95", "main");

// Listen for new posts
main_listener.bind('new-post', function(post) {
	alert("New post '" + post.title + "' created");
});