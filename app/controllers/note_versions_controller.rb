class NoteVersionsController < ApplicationController
  include Authentication
  before_action :set_note
  before_action :set_version, only: [:restore]
  before_action :validate_note_ownership

  # GET /notes/:note_id/versions
  def index
    @pagy, @versions = pagy(:offset, @note.note_versions, items: 50)
  end

  # POST /notes/:note_id/versions/:id/restore
  def restore
    if @note.deleted?
      redirect_to note_versions_path(@note), alert: "Cannot restore a version of a deleted note. Please restore the note first."
      return
    end

    # Update the note with the version's content
    # Using update_column to bypass callbacks and avoid creating a new version
    @note.update_columns(
      title: @version.title,
      body: @version.body,
      updated_at: Time.current
    )

    # Broadcast the update via Action Cable for real-time sync
    NotesChannel.broadcast_to(@note, {
      body: @note.body,
      title: @note.title,
      note_id: @note.id
    })

    respond_to do |format|
      format.html { redirect_to @note, notice: "Note version was successfully restored.", status: :see_other }
      format.json { render json: { message: "Note version restored successfully" }, status: :ok }
    end
  end

  private

  def set_note
    @note = Note.find(params[:note_id])
  end

  def set_version
    @version = @note.note_versions.find(params[:id])
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
