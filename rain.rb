require 'rubygems'
require 'sinatra'
require 'sequel'
require 'pusher'
require 'rdiscount'

DB = Sequel.connect(ENV['DATABASE_URL'] || 'sqlite://db/local.sqlite')
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

  def validate
    errors.add(:title, "cannot be empty") if title.strip.empty?
    errors.add(:body, "cannot be empty") if body.strip.empty?
  end

  def before_create
    super
    self.created_at = Time.now
    self.updated_at = Time.now
    self.html_body = RDiscount.new(body).to_html
  end

  def update_new_reply_time time
    self.updated_at = time
    self.save
  end
end

class Reply < Sequel::Model
  many_to_one :post

  def validate
    errors.add(:body, "cannot be empty") if body.strip.empty?
  end

  def before_create
    super
    self.created_at = Time.now
    self.updated_at = Time.now
    self.html_body = RDiscount.new(body).to_html
  end

  def after_create
    super
    self.post.update_new_reply_time self.created_at
  end
end

get '/' do
  redirect '/page/1'
end

get '/page/:page' do
  page = (params[:page] || 1).to_i
  @posts = Post.order(:updated_at.desc)
  @paged_posts = @posts.paginate(page, 10)
  haml :post_list, :layout => !request.xhr?
end

post '/new_post' do
  content_type :json
  post = Post.new(params[:post])
  begin
    post.save
    Pusher['main'].trigger("post_created", post.values, params[:socket_id])
    {:status => :success}.to_json
  rescue Sequel::ValidationFailed
    {:status => :failure, :errors => post.errors}.to_json
  end
end

get %r{/post/(\d+)(/page/(\d+))?} do
  post_id = (params[:captures][0] || 1).to_i
  page = (params[:captures][2] || 1).to_i
  @post = Post[post_id]
  @replies = @post.replies_dataset.order(:created_at.asc)
  @paged_replies = @replies.paginate(page, 20)
  haml :single_post, :layout => !request.xhr?
end

post '/new_reply' do
  content_type :json
  reply = Reply.new(params[:reply])
  begin
    reply.save
    Pusher['main'].trigger("reply_created", reply.values, params[:socket_id])
    {:status => :success}.to_json
  rescue Sequel::ValidationFailed
    {:status => :failure, :errors => reply.errors}.to_json
  end
end