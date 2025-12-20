class Note < ApplicationRecord
  belongs_to :user
  has_many :note_versions, dependent: :destroy

  after_create :create_initial_version
  before_update :create_version, if: :should_create_version?

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
