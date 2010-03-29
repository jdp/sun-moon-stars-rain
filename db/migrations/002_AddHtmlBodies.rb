class AddHtmlBodies < Sequel::Migration
  def up
    alter_table :posts do
      add_column :html_body, :text
    end
    alter_table :replies do
      add_column :html_body, :text
    end
  end

  def down
    alter_table :posts do
      remove_column :html_body
    end
    alter_table :replies do
      remove_column :html_body
    end
  end
end
