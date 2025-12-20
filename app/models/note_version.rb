class NoteVersion < ApplicationRecord
  belongs_to :note

  # Default scope to order by created_at descending (newest first)
  default_scope { order(created_at: :desc) }
end
