// Force WebSocket to work properly
WebSocket.__swfLocation = "/swf/WebSocketMain.swf";

var Sun = {

	pusherApiKey: "a337f1f0e27defa52a95",
	listeners: {},
	elements: {},

	/*
	 * Set up the application.
	 * Pusher listeners are initialized and default channels are created.
	 */
	setup: function() {
		Sun.listeners = {
			main: new Pusher(Sun.pusherApiKey, "main")
		};
		Sun.listeners.main.bind("connection_established", function(event) {
			$.ajaxSetup({
				data: {
					socket_id: event.socket_id
				}
			});
		});
		Sun.listeners.main.bind("post_created", function(post) {
			Sun.onPostCreated(post);
		});
		$(function() {
			Sun.elements = {
				posts: $("#posts"),
				newPost: $("#post_form")
			};
			Sun.elements.newPost.submit(function(form) {
				Sun.createPost();
				return false;
			});
		});
	},

	createPost: function() {
		$.post("/new_post", Sun.elements.newPost.serialize(), function(data) {
			if (data.status == "failure") {
				alert("failure creating new post!");
			}
		}, "json");
	},

	/*
	 * Callback for when new posts are created.
	 */
	onPostCreated: function(post) {
		var new_row = $([
			'<tr class="post new" style="background-color: white;">',
				'<td><a href="/post/' + post.id + '">' + post.title + '</a></td>',
			'</tr>'].join(""));
		Sun.elements.posts.prepend(new_row);
	}

}

// Start the show
$("document").ready(function() {
	Sun.setup();
});