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
		Sun.listeners.main.bind("reply_created", function(reply) {
			Sun.onReplyCreated(reply);
		});
		$(function() {
			Sun.elements = {
				posts: $("#posts"),
				newPost: $("#post_form"),
				replies: $("#replies"),
				newReply: $("#reply_form"),
				replyBox: $("#reply_box")
			};
			Sun.elements.newPost.submit(function(form) {
				Sun.createPost();
				return false;
			});
			Sun.elements.newReply.submit(function(form) {
				Sun.createReply();
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

	createReply: function() {
		$.post("/new_reply", Sun.elements.newReply.serialize(), function(data) {
			if (data.status == "failure") {
				alert("failure creating new reply!");
			}
		}, "json");
	},

	/*
	 * Callback for when new posts are created.
	 */
	onPostCreated: function(post) {
		var new_row = $([
			'<li class="post new">',
				'<div class="wrapper">',
					'<span class="thread-link"><a href="/post/' + post.id + '">' + post.title + '</a></span>',
				'</div>',
			'</li>'].join(""));
		Sun.elements.posts.prepend(new_row);
	},

	/*
	 * Callback for when new replies are created.
	 */
	onReplyCreated: function(reply) {
		if (Sun.elements.replies.length && $("#post-" + reply.post_id).length) {
			// Currently viewing same thread as new reply
			var new_reply = $([
				'<li class="reply new">',
					'<div class="wrapper">',
						'<div class="body">' + reply.body + '</div>',
					'</div>',
				'</li>'
			].join(""));
			Sun.elements.replies.append(new_reply);
		}
		else {
			// Swallow it, do something later
		}
	}

}

// Start the show
$("document").ready(function() {
	Sun.setup();
});