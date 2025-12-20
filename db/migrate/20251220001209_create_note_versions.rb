class CreateNoteVersions < ActiveRecord::Migration[8.1]
  def change
    create_table :note_versions do |t|
      t.references :note, null: false, foreign_key: true
      t.string :title
      t.text :body

      t.timestamps
    end

    add_index :note_versions, [ :note_id, :created_at ]
  end
end
