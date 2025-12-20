class NoteVersionsController < ApplicationController
  include Authentication
  before_action :set_note
  before_action :validate_note_ownership

  # GET /notes/:note_id/versions
  def index
    @pagy, @versions = pagy(:offset, @note.note_versions, items: 50)
  end

  private

  def set_note
    @note = Note.find(params[:note_id])
  end

  def validate_note_ownership
    unless @note.user == Current.user
      respond_to do |format|
        format.html { redirect_to notes_path, alert: "You don't have permission to access this note." }
        format.json { render json: { error: "You don't have permission to access this note." }, status: :forbidden }
      end
    end
  end
end
