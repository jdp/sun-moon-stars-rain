class AddPostsReplies < Sequel::Migration
  def up
    create_table :posts do
      primary_key :id
      varchar :title, :size => 128
      text :body
      timestamp :created_at
      timestamp :updated_at
    end

    create_table :replies do
      primary_key :id
      foreign_key :post_id, :posts
      text :body
      timestamp :created_at
      timestamp :updated_at
    end
  end

  def down
    drop_table :posts
    drop_table :replies
  end
end