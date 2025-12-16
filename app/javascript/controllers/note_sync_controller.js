import { Controller } from "@hotwired/stimulus"
import { createConsumer } from "@rails/actioncable"

export default class extends Controller {
  static values = { noteId: Number }
  static targets = ["body", "title"]

  connect() {
    console.log("NoteSyncController connected, noteId:", this.noteIdValue)
    console.log("bodyTarget available:", this.hasBodyTarget)
    console.log("titleTarget available:", this.hasTitleTarget)
    
    // Wait a tick to ensure DOM is ready
    setTimeout(() => {
      if (this.hasBodyTarget || this.hasTitleTarget) {
        this.subscribe()
        this.setupInputHandlers()
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
    
    // Update body if target exists and doesn't have focus
    if (this.hasBodyTarget && document.activeElement !== this.bodyTarget) {
      const newBodyValue = data.body || ""
      console.log("Updating body value to:", newBodyValue)
      this.bodyTarget.value = newBodyValue
      this.bodyTarget.dispatchEvent(new Event('input', { bubbles: true }))
    } else if (this.hasBodyTarget) {
      console.log("Skipping body update - user is typing")
    }
    
    // Update title if target exists and doesn't have focus
    if (this.hasTitleTarget && document.activeElement !== this.titleTarget) {
      const newTitleValue = data.title || ""
      console.log("Updating title value to:", newTitleValue)
      this.titleTarget.value = newTitleValue
      this.titleTarget.dispatchEvent(new Event('input', { bubbles: true }))
    } else if (this.hasTitleTarget) {
      console.log("Skipping title update - user is typing")
    }
  }
}

