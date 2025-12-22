class NotesController < ApplicationController
  include Authentication
  before_action :set_note, only: %i[ show edit update destroy preview restore ]
  before_action :validate_note_ownership, only: %i[ show edit update destroy preview restore ]

  # GET /notes or /notes.json
  def index
    @notes = Current.user.notes
  end

  # GET /notes/deleted
  def deleted
    @pagy, @notes = pagy(Note.with_deleted.where(user: Current.user).deleted.order(deleted_at: :desc), items: 20)
  end

  # GET /notes/1 or /notes/1.json
  def show
  end

  # GET /notes/new
  def new
    @note = Note.new
  end

  # GET /notes/1/edit
  def edit
    if @note.deleted?
      redirect_to notes_path, alert: "Cannot edit a deleted note. Please restore it first."
    end
  end

  # POST /notes or /notes.json
  def create
    @note = Note.new(note_params)
    @note.user = Current.user

    respond_to do |format|
      if @note.save
        format.html { redirect_to @note, notice: "Note was successfully created." }
        format.json { render :show, status: :created, location: @note }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @note.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /notes/1 or /notes/1.json
  def update
    if @note.deleted?
      redirect_to notes_path, alert: "Cannot update a deleted note. Please restore it first."
      return
    end

    respond_to do |format|
      if @note.update(note_params)
        # Broadcast the update via Action Cable for real-time sync
        NotesChannel.broadcast_to(@note, {
          body: @note.body,
          title: @note.title,
          note_id: @note.id
        })

        format.html { redirect_to @note, notice: "Note was successfully updated.", status: :see_other }
        format.json { render :show, status: :ok, location: @note }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @note.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /notes/1 or /notes/1.json
  def destroy
    @note.destroy!

    respond_to do |format|
      format.html { redirect_to notes_path, notice: "Note was successfully deleted.", status: :see_other }
      format.json { head :no_content }
    end
  end

  # POST /notes/1/restore
  def restore
    @note.restore

    respond_to do |format|
      format.html { redirect_to deleted_notes_path, notice: "Note was successfully restored.", status: :see_other }
      format.json { render :show, status: :ok, location: @note }
    end
  end

  # GET /notes/:id/preview
  def preview
    # Always use the current database value for the preview
    text = @note.body || ""
    html = Commonmarker.to_html(text.to_s, options: {
      parse: { smart: true },
      render: { hardbreaks: true },
      extension: {
        strikethrough: true,
        tagfilter: true,
        table: true,
        autolink: true,
        tasklist: true
      }
    })

    # Store the HTML for the view to render
    @preview_html = html

    respond_to do |format|
      format.turbo_stream
      format.html { render "preview_frame", layout: false }
    end
  end


  private
    # Use callbacks to share common setup or constraints between actions.
    def set_note
      # Use with_deleted to find notes including deleted ones for restore action
      @note = Note.with_deleted.find(params.expect(:id))
    end

    # Validate that the note belongs to the current user
    def validate_note_ownership
      unless @note.user == Current.user
        respond_to do |format|
          format.html { redirect_to notes_path, alert: "You don't have permission to access this note." }
          format.json { render json: { error: "You don't have permission to access this note." }, status: :forbidden }
        end
      end
    end

    # Only allow a list of trusted parameters through.
    def note_params
      params.expect(note: [ :title, :body ])
    end
end
