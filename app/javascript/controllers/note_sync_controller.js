import { Controller } from "@hotwired/stimulus"
import { createConsumer } from "@rails/actioncable"

export default class extends Controller {
  static values = { noteId: Number }
  static targets = ["body", "title", "preview"]

  connect() {
    console.log("NoteSyncController connected, noteId:", this.noteIdValue)
    console.log("bodyTarget available:", this.hasBodyTarget)
    console.log("titleTarget available:", this.hasTitleTarget)
    console.log("previewTarget available:", this.hasPreviewTarget)
    
    // Wait a tick to ensure DOM is ready
    setTimeout(() => {
      if (this.hasBodyTarget || this.hasTitleTarget) {
        this.subscribe()
        this.setupInputHandlers()
        
        // Preview will be loaded automatically via turbo_frame_tag src attribute
        // No need to manually initialize
      } else {
        console.error("No targets found on connect!")
      }
    }, 0)
  }

  disconnect() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  subscribe() {
    // Only subscribe if we have a noteId (i.e., editing existing note)
    if (!this.hasNoteIdValue) return
    
    try {
      const consumer = createConsumer()
      console.log("Creating subscription for note:", this.noteIdValue)
      this.subscription = consumer.subscriptions.create(
        { channel: "NotesChannel", id: this.noteIdValue },
        {
          connected: () => {
            console.log("✅ Connected to NotesChannel for note", this.noteIdValue)
          },
          disconnected: () => {
            console.log("❌ Disconnected from NotesChannel")
          },
          received: (data) => {
            console.log("📨 Received data from channel:", data)
            this.handleUpdate(data)
          },
          rejected: () => {
            console.error("🚫 Subscription rejected")
          }
        }
      )
    } catch (error) {
      console.error("Failed to create subscription:", error)
    }
  }

  setupInputHandlers() {
    // Debounce input to avoid too many broadcasts
    let bodyTimeout
    let titleTimeout
    
    if (this.hasBodyTarget) {
      this.bodyTarget.addEventListener("input", (e) => {
        clearTimeout(bodyTimeout)
        bodyTimeout = setTimeout(() => {
          this.syncBody(e.target.value)
        }, 500) // Wait 500ms after user stops typing
        
        // Preview will update automatically via Action Cable broadcast after sync
        // No need to update preview here - it will fetch from database after sync
      })
    }
    
    if (this.hasTitleTarget) {
      this.titleTarget.addEventListener("input", (e) => {
        clearTimeout(titleTimeout)
        titleTimeout = setTimeout(() => {
          this.syncTitle(e.target.value)
        }, 500) // Wait 500ms after user stops typing
      })
    }
  }

  async syncBody(body) {
    // Only sync if we have a noteId (i.e., editing existing note)
    if (!this.hasNoteIdValue) return
    
    // Get current title value to preserve it
    const title = this.hasTitleTarget ? this.titleTarget.value : ""
    
    // Send update to server via HTTP using standard update endpoint
    const formData = new FormData()
    formData.append("note[body]", body)
    formData.append("note[title]", title)
    
    const response = await fetch(`/notes/${this.noteIdValue}`, {
      method: "PATCH",
      headers: {
        "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content
      },
      body: formData
    })
    
    if (!response.ok) {
      console.error("Failed to sync body")
    }
  }

  async syncTitle(title) {
    // Only sync if we have a noteId (i.e., editing existing note)
    if (!this.hasNoteIdValue) return
    
    // Get current body value to preserve it
    const body = this.hasBodyTarget ? this.bodyTarget.value : ""
    
    // Send update to server via HTTP using standard update endpoint
    const formData = new FormData()
    formData.append("note[title]", title)
    formData.append("note[body]", body)
    
    const response = await fetch(`/notes/${this.noteIdValue}`, {
      method: "PATCH",
      headers: {
        "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content
      },
      body: formData
    })
    
    if (!response.ok) {
      console.error("Failed to sync title")
    }
  }

  handleUpdate(data) {
    console.log("handleUpdate called with:", data)
    
    const newBodyValue = data.body || ""
    const newTitleValue = data.title || ""
    
    // Update body if target exists and doesn't have focus
    if (this.hasBodyTarget && document.activeElement !== this.bodyTarget) {
      console.log("Updating body value to:", newBodyValue)
      this.bodyTarget.value = newBodyValue
    } else if (this.hasBodyTarget) {
      console.log("Skipping body update - user is typing")
    }
    
    // Always update preview when body changes via Action Cable
    // This fetches the current database value (no text parameter needed)
    if (this.hasPreviewTarget && data.body !== undefined) {
      console.log("Updating preview from database after Action Cable broadcast")
      this.updatePreview()
    }
    
    // Update title if target exists and doesn't have focus
    if (this.hasTitleTarget && document.activeElement !== this.titleTarget) {
      console.log("Updating title value to:", newTitleValue)
      this.titleTarget.value = newTitleValue
    } else if (this.hasTitleTarget) {
      console.log("Skipping title update - user is typing")
    }
  }

  updatePreview() {
    if (!this.hasPreviewTarget) {
      console.warn("Preview target not available")
      return
    }
    
    // Only update preview if we have a noteId (i.e., editing existing note)
    // The preview will fetch the current database value
    if (!this.hasNoteIdValue) {
      console.log("Skipping preview update - note not yet saved")
      return
    }
    
    // Find the turbo-frame element inside the preview target
    const turboFrame = this.previewTarget.querySelector('turbo-frame#note_preview') || this.previewTarget.querySelector('turbo-frame')
    
    if (!turboFrame) {
      console.error("Turbo frame not found")
      return
    }
    
    // Reload the turbo frame - it will fetch the current database value
    const previewUrl = `/notes/${this.noteIdValue}/preview`
    console.log("Updating preview from database for note:", this.noteIdValue)
    turboFrame.src = previewUrl
  }
}

