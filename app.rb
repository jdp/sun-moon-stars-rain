require 'rubygems'
require 'sinatra'
require 'sequel'
require 'pusher'

DB = Sequel.connect(ENV['DATABASE_URL'] || 'sqlite://db/local.db')
Sequel.extension :pagination

Pusher.key = 'a337f1f0e27defa52a95'

set :haml, { :format => :html5 }

class Post < Sequel::Model
  one_to_many :replies
end

class Reply < Sequel::Model
  many_to_one :thread
end

get '/' do
  redirect '/page/1'
end

get '/page/:page' do
  page = (params[:page] || 1).to_i
  @posts = Post.all
  @pagination = DB[:posts].paginate(page, 20)
  haml :post_list
end

post '/new-post' do
  post = Post.new do |p|
    p.title = params[:title].strip
    p.body = params[:body].strip
  end
  post.save
  redirect '/page/1'
end

get '/post/:id/:page' do
  id = (params[:id] || 1).to_i
  page = (params[:page] || 1).to_i
  @post = Post[id]
  @replies = @post.replies_dataset
  @pagination = @replies.paginate(page, 20)
  haml :single_post
end
