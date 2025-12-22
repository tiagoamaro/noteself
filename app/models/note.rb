class Note < ApplicationRecord
  belongs_to :user
  has_many :note_versions, dependent: :destroy

  # Soft delete scopes
  scope :not_deleted, -> { where(deleted_at: nil) }
  scope :deleted, -> { where.not(deleted_at: nil) }

  # Default scope excludes deleted notes
  default_scope { where(deleted_at: nil) }

  # Unscope to access all notes including deleted ones
  def self.with_deleted
    unscoped
  end

  after_create :create_initial_version
  before_update :create_version, if: :should_create_version?

  # Soft delete instead of hard delete
  def destroy
    update_column(:deleted_at, Time.current)
  end

  def destroy!
    unless update_column(:deleted_at, Time.current)
      raise ActiveRecord::RecordNotDestroyed.new("Failed to delete note", self)
    end
  end

  def deleted?
    deleted_at.present?
  end

  def restore
    update_column(:deleted_at, nil)
  end

  private

  def create_initial_version
    note_versions.create!(
      title: title,
      body: body
    )
  end

  def should_create_version?
    title_changed? || body_changed?
  end

  def create_version
    # Save the current state (before update) as a version
    note_versions.create!(
      title: title,
      body: body
    )

    # Keep only the last 1000 versions
    if note_versions.count > 1000
      note_versions.order(created_at: :desc).offset(1000).destroy_all
    end
  end
end
