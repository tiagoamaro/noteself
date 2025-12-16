class NotesChannel < ApplicationCable::Channel
  def subscribed
    note = Note.find(params[:id])
    stream_for note
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end
end
