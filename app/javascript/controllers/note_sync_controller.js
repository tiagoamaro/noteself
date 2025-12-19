import { Controller } from "@hotwired/stimulus"
import { createConsumer } from "@rails/actioncable"

export default class extends Controller {
  static values = { noteId: Number }
  static targets = ["body", "title", "preview"]

  connect() {
    if (this.hasNoteIdValue) {
      this.subscribe()
    }
    this.setupInputHandlers()
  }

  disconnect() {
    this.subscription?.unsubscribe()
  }

  subscribe() {
    const consumer = createConsumer()
    this.subscription = consumer.subscriptions.create(
      { channel: "NotesChannel", id: this.noteIdValue },
      {
        received: (data) => this.handleUpdate(data)
      }
    )
  }

  setupInputHandlers() {
    this.timeouts = {}
    
    if (this.hasBodyTarget) {
      this.bodyTarget.addEventListener("input", (e) => {
        clearTimeout(this.timeouts.body)
        this.timeouts.body = setTimeout(() => this.sync(e.target.value, "body"), 500)
      })
    }
    
    if (this.hasTitleTarget) {
      this.titleTarget.addEventListener("input", (e) => {
        clearTimeout(this.timeouts.title)
        this.timeouts.title = setTimeout(() => this.sync(e.target.value, "title"), 500)
      })
    }
  }

  async sync(value, field) {
    if (!this.hasNoteIdValue) return
    
    const formData = new FormData()
    formData.append(`note[${field}]`, value)
    formData.append("note[body]", this.hasBodyTarget ? this.bodyTarget.value : "")
    formData.append("note[title]", this.hasTitleTarget ? this.titleTarget.value : "")
    
    await fetch(`/notes/${this.noteIdValue}`, {
      method: "PATCH",
      headers: {
        "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content
      },
      body: formData
    })
  }

  handleUpdate(data) {
    if (this.hasBodyTarget && document.activeElement !== this.bodyTarget && data.body !== undefined) {
      this.bodyTarget.value = data.body || ""
    }
    
    if (this.hasTitleTarget && document.activeElement !== this.titleTarget && data.title !== undefined) {
      this.titleTarget.value = data.title || ""
    }
    
    if (this.hasPreviewTarget && data.body !== undefined) {
      this.updatePreview()
    }
  }

  updatePreview() {
    if (!this.hasNoteIdValue) return
    
    const turboFrame = this.previewTarget.querySelector('turbo-frame')
    if (turboFrame) {
      turboFrame.src = `/notes/${this.noteIdValue}/preview`
    }
  }
}

