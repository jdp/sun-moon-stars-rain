var Sun = {

	pusherApiKey: "a337f1f0e27defa52a95",
	listeners: {},
	elements: {},
	ui: {},

	/*
	 * Set up the application.
	 * Pusher listeners are initialized and default channels are created.
	 */
	setup: function() {
		Sun.ui = {
			appendNewReplies: false,
			socketId: null
		};
		Sun.listeners = {
			main: new Pusher(Sun.pusherApiKey, "main")
		};
		Sun.listeners.main.bind("connection_established", function(event) {
			Sun.ui.socketId = event.socket_id;
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
			Sun.elements.newPost.submit(function(event) {
				Sun.createPost($(event.currentTarget));
				return false;
			});
			Sun.elements.newReply.submit(function(event) {
				Sun.createReply($(event.currentTarget));
				return false;
			});
			// Only allow newly-created replies to be shown in reply list if
			// the user has seen them all
			Sun.ui.appendNewReplies = Sun.elements.replies.children().length < 20;
			if (Sun.elements.replies.length) {
				$(Sun.elements.replies).infinitescroll({
					navSelector: ".pagination",
					nextSelector: ".pagination .next",
					itemSelector: "#replies .reply",
					errorCallback: function() {
						Sun.ui.appendNewReplies = true
					}
				}, function() {
					Sun.updateTimes();
				});
			}
			else if (Sun.elements.posts.length) {
				$(Sun.elements.posts).infinitescroll({
					navSelector: ".pagination",
					nextSelector: ".pagination .next",
					itemSelector: "#posts .post"
				}, function() {
					Sun.updateTimes();
				});
			}
		});
	},

	createPost: function(form) {
		form.find("input, textarea").css("background-color", "#eee");
		var submit_button = form.find('input[type="submit"]');
		submit_button.attr("disabled", "true");
		$.post("/new_post", form.serialize(), function(data) {
			if (data.status == "success") {
				form.find('input[type!="submit"], textarea').val("");
			}
			else if (data.status == "failure") {
				for (var name in data.errors) {
					form.find('*[name="post[' + name + ']"]').animate({
						backgroundColor: "#ffe8e8"
					}, 1000);
				}
			}
			submit_button.removeAttr("disabled");
		}, "json");
	},

	createReply: function(form) {
		form.find("input, textarea").css("background-color", "#eee");
		var submit_button = form.find('input[type="submit"]');
		submit_button.attr("disabled", "true");
		$.post("/new_reply", form.serialize(), function(data) {
			if (data.status == "success") {
				form.find("textarea").val("");
			}
			else if (data.status == "failure") {
				for (var name in data.errors) {
					form.find('*[name="reply[' + name + ']"]').animate({
						backgroundColor: "#ffe8e8"
					}, 1000);
				}
			}
			submit_button.removeAttr("disabled");
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
			'</li>'
		].join("")).click(function() {
			$(this).removeClass("new");
		});
		Sun.elements.posts.prepend(new_row);
	},

	/*
	 * Callback for when new replies are created.
	 */
	onReplyCreated: function(reply) {
		if ($("div#post-" + reply.post_id).length) {
			// Currently viewing same thread as new reply
			if (Sun.ui.appendNewReplies) {
				var new_reply = $([
					'<li id="reply-"' + reply.id + '" class="reply new">',
						'<div class="wrapper">',
							'<div class="body">' + reply.html_body + '</div>',
						'</div>',
					'</li>'
				].join("")).click(function() {
					$(this).removeClass("new");
				});
				Sun.elements.replies.append(new_reply);
			}
		}
		else {
			var thread_row = $("#post-" + reply.post_id);
			var reply_counter = thread_row.find(".new-replies > .count");
			reply_counter.text(parseInt(reply_counter.text()) + 1);
			reply_counter.parent().addClass("new").show();
		}
	},

	updateTimes: function() {
		$("time.timeago").timeago();
	}

}

// Start the show
$("document").ready(function() {
	Sun.setup();
	Sun.updateTimes();
});