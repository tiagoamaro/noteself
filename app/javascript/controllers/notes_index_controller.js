import { Controller } from "@hotwired/stimulus"
import { createConsumer } from "@rails/actioncable"

export default class extends Controller {
  static values = { 
    noteIds: Array 
  }

  connect() {
    console.log("NotesIndexController connected, noteIds:", this.noteIdsValue)
    this.subscriptions = []
    this.subscribeToAllNotes()
  }

  disconnect() {
    this.subscriptions.forEach(subscription => {
      if (subscription) {
        subscription.unsubscribe()
      }
    })
  }

  subscribeToAllNotes() {
    const consumer = createConsumer()
    
    this.noteIdsValue.forEach(noteId => {
      const subscription = consumer.subscriptions.create(
        { channel: "NotesChannel", id: noteId },
        {
          connected: () => {
            console.log(`✅ Connected to NotesChannel for note ${noteId}`)
          },
          disconnected: () => {
            console.log(`❌ Disconnected from NotesChannel for note ${noteId}`)
          },
          received: (data) => {
            console.log(`📨 Received update for note ${noteId}:`, data)
            if (data.body !== undefined) {
              this.updateNoteBody(noteId, data.body)
            }
            if (data.title !== undefined) {
              this.updateNoteTitle(noteId, data.title)
            }
          }
        }
      )
      this.subscriptions.push(subscription)
    })
  }

  updateNoteBody(noteId, body) {
    // Find the note element using the dom_id
    const noteElement = document.getElementById(`note_${noteId}`)
    if (!noteElement) {
      console.warn(`Note element not found for note ${noteId}`)
      return
    }

    // Find the body element within the note
    const bodyElement = noteElement.querySelector('[data-note-body]')
    if (!bodyElement) {
      console.warn(`Body element not found for note ${noteId}`)
      return
    }

    // Update the body text
    bodyElement.textContent = body || ""
    console.log(`✅ Updated body for note ${noteId}`)
  }

  updateNoteTitle(noteId, title) {
    // Find the note element using the dom_id
    const noteElement = document.getElementById(`note_${noteId}`)
    if (!noteElement) {
      console.warn(`Note element not found for note ${noteId}`)
      return
    }

    // Find the title element within the note
    const titleElement = noteElement.querySelector('[data-note-title]')
    if (!titleElement) {
      console.warn(`Title element not found for note ${noteId}`)
      return
    }

    // Update the title text
    titleElement.textContent = title || ""
    console.log(`✅ Updated title for note ${noteId}`)
  }
}

