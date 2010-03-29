require 'rubygems'
require 'sinatra'
require 'sequel'
require 'pusher'
require 'rdiscount'

DB = Sequel.connect(ENV['DATABASE_URL'] || 'sqlite://db/local.db')
Sequel.extension :pagination

Pusher.key = 'a337f1f0e27defa52a95'
Pusher.secret = 'a337f1f0e27defa52a95'

set :haml, { :format => :html5 }

before do
  new_params = {}
  params.each_pair do |full_key, value|
    this_param = new_params
    split_keys = full_key.split(/\]\[|\]|\[/)
    split_keys.each_index do |index|
      break if split_keys.length == index + 1
      this_param[split_keys[index]] ||= {}
      this_param = this_param[split_keys[index]]
   end
   this_param[split_keys.last] = value
  end
  request.params.replace new_params
end

class Post < Sequel::Model
  one_to_many :replies

  def before_create
    super
    self.created_at = Time.now.utc
    self.html_body = RDiscount.new(body).to_html
  end
end

class Reply < Sequel::Model
  many_to_one :thread

  def before_create
    super
    self.created_at = Time.now.utc
    self.html_body = RDiscount.new(body).to_html
  end
end

get '/' do
  redirect '/page/1'
end

get '/page/:page' do
  page = (params[:page] || 1).to_i
  @posts = Post.order(:id.desc)
  @pagination = @posts.paginate(page, 20)
  haml :post_list, :layout => !request.xhr?
end

post '/new_post' do
  content_type :json
  post = Post.create(params[:post])
  if post.save
    Pusher['main'].trigger("post_created", post.values.merge({ :dom_id => "post-#{post.id}" }), params[:socket_id])
    {:status => :success}.to_json
  else
    {:status => :failure}.to_json
  end
end

post '/new_reply' do
  content_type :json
  reply = Reply.create(params[:reply])
  if reply.save
    Pusher['main'].trigger("reply_created", reply.values.merge({ :dom_id => "reply-#{reply.id}"}), params[:socket_id])
    {:status => :success}.to_json
  else
    {:status => :failure}.to_json
  end
end

get %r{/post/(\d+)(/(\d+))?} do
  id = (params[:captures][0] || 1).to_i
  page = (params[:captures][2] || 1).to_i
  @post = Post[id]
  @replies = @post.replies_dataset
  @paginated_replies = @replies.paginate(page, 20)
  haml :single_post
end
