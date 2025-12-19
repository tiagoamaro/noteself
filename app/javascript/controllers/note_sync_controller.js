import { Controller } from "@hotwired/stimulus"
import { createConsumer } from "@rails/actioncable"

export default class extends Controller {
  static values = { noteId: Number }
  static targets = ["body", "title", "preview", "spinner", "successIcon"]

  connect() {
    if (this.hasNoteIdValue) {
      this.subscribe()
    }
    this.setupInputHandlers()
  }

  disconnect() {
    this.subscription?.unsubscribe()
    if (this.syncStatusTimeout) {
      clearTimeout(this.syncStatusTimeout)
    }
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

    // Hide success icon if visible
    this.hideSuccessIcon()

    // Show spinning icon
    this.showSpinner()

    const formData = new FormData()
    formData.append(`note[${field}]`, value)
    formData.append("note[body]", this.hasBodyTarget ? this.bodyTarget.value : "")
    formData.append("note[title]", this.hasTitleTarget ? this.titleTarget.value : "")

    try {
      const response = await fetch(`/notes/${this.noteIdValue}`, {
        method: "PATCH",
        headers: {
          "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content
        },
        body: formData
      })

      if (response.ok) {
        // Hide spinner and show success icon with transition
        this.hideSpinner()
        setTimeout(() => {
          this.showSuccessIcon()
        }, 150) // Small delay for smooth transition
      } else {
        // Hide spinner on error
        this.hideSpinner()
      }
    } catch (error) {
      console.error("Sync error:", error)
      // Hide spinner on error
      this.hideSpinner()
    }
  }

  showSpinner() {
    if (!this.hasSpinnerTarget) return

    // Clear any existing timeout
    if (this.syncStatusTimeout) {
      clearTimeout(this.syncStatusTimeout)
    }

    // Show the spinner with transition
    this.spinnerTarget.classList.remove("opacity-0", "scale-0")
    this.spinnerTarget.classList.add("opacity-100", "scale-100")
  }

  hideSpinner() {
    if (!this.hasSpinnerTarget) return

    // Hide spinner with transition
    this.spinnerTarget.classList.remove("opacity-100", "scale-100")
    this.spinnerTarget.classList.add("opacity-0", "scale-0")
  }

  showSuccessIcon() {
    if (!this.hasSuccessIconTarget) return

    // Clear any existing timeout
    if (this.syncStatusTimeout) {
      clearTimeout(this.syncStatusTimeout)
    }

    // Show success icon with transition
    this.successIconTarget.classList.remove("opacity-0", "scale-0")
    this.successIconTarget.classList.add("opacity-100", "scale-100")

    // Hide after 2 seconds
    this.syncStatusTimeout = setTimeout(() => {
      this.hideSuccessIcon()
    }, 2000)
  }

  hideSuccessIcon() {
    if (!this.hasSuccessIconTarget) return

    if (this.syncStatusTimeout) {
      clearTimeout(this.syncStatusTimeout)
      this.syncStatusTimeout = null
    }

    // Hide success icon with transition
    this.successIconTarget.classList.remove("opacity-100", "scale-100")
    this.successIconTarget.classList.add("opacity-0", "scale-0")
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

