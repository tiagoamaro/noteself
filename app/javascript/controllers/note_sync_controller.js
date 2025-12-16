import { Controller } from "@hotwired/stimulus"
import { createConsumer } from "@rails/actioncable"

export default class extends Controller {
  static values = { noteId: Number }
  static targets = ["body"]

  connect() {
    console.log("NoteSyncController connected, noteId:", this.noteIdValue)
    console.log("bodyTarget available:", this.hasBodyTarget)
    
    // Wait a tick to ensure DOM is ready
    setTimeout(() => {
      if (this.hasBodyTarget) {
        this.subscribe()
        this.setupInputHandler()
      } else {
        console.error("bodyTarget not found on connect!")
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

  setupInputHandler() {
    // Debounce input to avoid too many broadcasts
    let timeout
    this.bodyTarget.addEventListener("input", (e) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        this.syncBody(e.target.value)
      }, 500) // Wait 500ms after user stops typing
    })
  }

  async syncBody(body) {
    // Send update to server via HTTP
    const response = await fetch(`/notes/${this.noteIdValue}/sync_body`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content
      },
      body: JSON.stringify({ body: body })
    })
    
    if (!response.ok) {
      console.error("Failed to sync body")
    }
  }

  handleUpdate(data) {
    console.log("handleUpdate called with:", data)
    console.log("bodyTarget:", this.bodyTarget)
    console.log("activeElement:", document.activeElement)
    
    // Check if bodyTarget exists
    if (!this.bodyTarget) {
      console.error("bodyTarget not found!")
      return
    }
    
    // Only update if the field doesn't have focus (to avoid interrupting user typing)
    if (document.activeElement !== this.bodyTarget) {
      const newValue = data.body || ""
      console.log("Updating textarea value to:", newValue)
      this.bodyTarget.value = newValue
      
      // Trigger input event to ensure any listeners are notified
      this.bodyTarget.dispatchEvent(new Event('input', { bubbles: true }))
    } else {
      console.log("Skipping update - user is typing")
    }
  }
}

