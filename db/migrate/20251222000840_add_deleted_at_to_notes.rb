class AddDeletedAtToNotes < ActiveRecord::Migration[8.1]
  def change
    add_column :notes, :deleted_at, :datetime
  end
end
