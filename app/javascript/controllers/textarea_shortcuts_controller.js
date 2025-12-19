import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.textarea = this.element
    this.textarea.addEventListener("keydown", this.handleKeyDown.bind(this))
  }

  disconnect() {
    this.textarea.removeEventListener("keydown", this.handleKeyDown.bind(this))
  }

  handleKeyDown(event) {
    // Handle Ctrl+B (Windows/Linux) or Cmd+B (Mac) for bold
    if ((event.ctrlKey || event.metaKey) && event.key === "b") {
      event.preventDefault()
      this.wrapSelection("**", "**")
      return
    }

    // Handle Ctrl+I (Windows/Linux) or Cmd+I (Mac) for italic
    if ((event.ctrlKey || event.metaKey) && event.key === "i") {
      event.preventDefault()
      this.wrapSelection("_", "_")
      return
    }

    // Handle Tab key for indentation
    if (event.key === "Tab") {
      event.preventDefault()
      this.handleTabKey(event)
      return
    }

    // Handle Enter key for list items
    if (event.key === "Enter") {
      const handled = this.handleEnterKey(event)
      if (handled) {
        event.preventDefault()
        return
      }
    }
  }

  handleTabKey(event) {
    const textarea = this.textarea
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const textBeforeCursor = text.substring(0, start)

    // Find the start of the current line
    const lineStart = textBeforeCursor.lastIndexOf("\n") + 1
    const lineEnd = text.indexOf("\n", end) === -1 ? text.length : text.indexOf("\n", end)
    const currentLine = text.substring(lineStart, lineEnd)

    // Check if we're on a list item line (task list, bullet list, or numbered list)
    const taskMatch = currentLine.match(/^(\s*)([-*])\s\[([ x])\]\s/)
    const bulletMatch = currentLine.match(/^(\s*)([-*])\s/)
    const numberedMatch = currentLine.match(/^(\s*)(\d+)\.\s/)

    // If there's a selection spanning multiple lines, indent all selected lines
    if (start !== end) {
      const selectedText = text.substring(start, end)
      const textBeforeSelection = text.substring(0, start)
      const textAfterSelection = text.substring(end)

      // Check if selection spans multiple lines
      if (selectedText.includes("\n")) {
        const lines = selectedText.split("\n")
        const indentedLines = lines.map(line => {
          // If Shift+Tab, remove indentation; otherwise add it
          if (event.shiftKey) {
            // Remove 2 spaces or a tab from the start of the line
            return line.replace(/^(\t|  )/, "")
          } else {
            // Add 2 spaces at the start of the line
            return "  " + line
          }
        })
        const newText = indentedLines.join("\n")
        
        textarea.value = textBeforeSelection + newText + textAfterSelection
        
        // Adjust selection to account for indentation changes
        const indentChange = event.shiftKey ? -2 : 2
        const lineCount = lines.length - 1
        textarea.selectionStart = start
        textarea.selectionEnd = end + (indentChange * lineCount)
      } else {
        // Single line selection - check if it's a list item
        if (taskMatch || bulletMatch || numberedMatch) {
          // Indent/unindent the list item
          this.indentListLine(textarea, lineStart, lineEnd, event.shiftKey)
        } else {
          // Not a list item - just insert tab/spaces at cursor
          const indent = event.shiftKey ? "" : "  "
          textarea.value = textBeforeSelection + indent + selectedText + textAfterSelection
          textarea.selectionStart = textarea.selectionEnd = start + (event.shiftKey ? 0 : indent.length)
        }
      }
    } else {
      // No selection - check if cursor is on a list item line
      if (taskMatch || bulletMatch || numberedMatch) {
        // Indent/unindent the list item
        this.indentListLine(textarea, lineStart, lineEnd, event.shiftKey)
      } else {
        // Not a list item - insert tab/spaces at cursor position
        const indent = event.shiftKey ? "" : "  "
        textarea.value = text.substring(0, start) + indent + text.substring(end)
        textarea.selectionStart = textarea.selectionEnd = start + (event.shiftKey ? 0 : indent.length)
      }
    }

    textarea.focus()
  }

  indentListLine(textarea, lineStart, lineEnd, unindent) {
    const text = textarea.value
    const currentLine = text.substring(lineStart, lineEnd)
    const textBeforeLine = text.substring(0, lineStart)
    const textAfterLine = text.substring(lineEnd)
    const cursorPos = textarea.selectionStart
    const relativeCursorPos = cursorPos - lineStart

    // Extract the current indentation and the rest of the line
    const match = currentLine.match(/^(\s*)(.*)$/)
    if (!match) return

    const currentIndent = match[1]
    const lineContent = match[2]

    let newIndent
    if (unindent) {
      // Remove 2 spaces from indentation (but don't go negative)
      newIndent = currentIndent.length >= 2 ? currentIndent.substring(2) : ""
    } else {
      // Add 2 spaces to indentation
      newIndent = currentIndent + "  "
    }

    const newLine = newIndent + lineContent
    textarea.value = textBeforeLine + newLine + textAfterLine

    // Adjust cursor position to maintain relative position in the line
    const indentChange = unindent ? -Math.min(2, currentIndent.length) : 2
    textarea.selectionStart = textarea.selectionEnd = Math.max(lineStart, cursorPos + indentChange)
  }

  handleEnterKey(event) {
    const textarea = this.textarea
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const textBeforeCursor = text.substring(0, start)

    // Find the start of the current line
    const lineStart = textBeforeCursor.lastIndexOf("\n") + 1
    const currentLine = text.substring(lineStart, start)

    // Check if we're in a task list item (- [ ] or - [x]) - check this FIRST since it's more specific
    const taskMatch = currentLine.match(/^(\s*)([-*])\s\[([ x])\]\s(.*)$/)
    if (taskMatch) {
      const indent = taskMatch[1]
      const bullet = taskMatch[2]
      const content = taskMatch[4]
      
      // If the line only contains the list marker with no content, allow normal line break
      if (!content || content.trim() === "") {
        return false
      }
      
      const newLine = `\n${indent}${bullet} [ ] `
      
      // Insert the new list item
      textarea.value = text.substring(0, start) + newLine + text.substring(end)
      textarea.selectionStart = textarea.selectionEnd = start + newLine.length
      return true
    }

    // Check if we're in a bullet list item (- or *)
    const bulletMatch = currentLine.match(/^(\s*)([-*])\s(.*)$/)
    if (bulletMatch) {
      const indent = bulletMatch[1]
      const bullet = bulletMatch[2]
      const content = bulletMatch[3]
      
      // If the line only contains the list marker with no content, allow normal line break
      if (!content || content.trim() === "") {
        return false
      }
      
      const newLine = `\n${indent}${bullet} `
      
      // Insert the new list item
      textarea.value = text.substring(0, start) + newLine + text.substring(end)
      textarea.selectionStart = textarea.selectionEnd = start + newLine.length
      return true
    }

    // Check if we're in a numbered list item
    const numberedMatch = currentLine.match(/^(\s*)(\d+)\.\s(.*)$/)
    if (numberedMatch) {
      const indent = numberedMatch[1]
      const currentNumber = parseInt(numberedMatch[2])
      const content = numberedMatch[3]
      
      // If the line only contains the list marker with no content, allow normal line break
      if (!content || content.trim() === "") {
        return false
      }
      
      const nextNumber = currentNumber + 1
      const newLine = `\n${indent}${nextNumber}. `
      
      // Insert the new list item
      textarea.value = text.substring(0, start) + newLine + text.substring(end)
      textarea.selectionStart = textarea.selectionEnd = start + newLine.length
      return true
    }

    return false
  }

  wrapSelection(before, after) {
    const textarea = this.textarea
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)

    // If there's no selection, wrap empty string (cursor position)
    if (selectedText) {
      // Wrap the selected text
      textarea.value = 
        textarea.value.substring(0, start) +
        before + selectedText + after +
        textarea.value.substring(end)
      
      // Set cursor position after the closing marker
      textarea.selectionStart = textarea.selectionEnd = end + before.length + after.length
    } else {
      // No selection - insert markers and place cursor between them
      textarea.value = 
        textarea.value.substring(0, start) +
        before + after +
        textarea.value.substring(end)
      
      // Place cursor between the markers
      textarea.selectionStart = textarea.selectionEnd = start + before.length
    }

    // Focus the textarea
    textarea.focus()
  }
}
