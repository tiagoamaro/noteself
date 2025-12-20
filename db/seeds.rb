# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

# We don't want to run seeds in production or test environments
return unless Rails.env.local?

User.create!(
  email_address: "foo@bar.com",
  password: "password",
)

# Create 4 comprehensive markdown kitchen sink notes
notes_data = [
  {
    title: "Markdown Basics & Text Formatting",
    body: <<~MARKDOWN
      # Heading 1
      ## Heading 2
      ### Heading 3
      #### Heading 4
      ##### Heading 5
      ###### Heading 6

      This is a paragraph with **bold text**, *italic text*, and ***bold italic text***. You can also use __bold__ and _italic_ with underscores.

      Here's some ~~strikethrough text~~ and `inline code`.

      This paragraph has a [link to GitHub](https://github.com) and an [email link](mailto:example@example.com).

      ---

      ## Lists

      ### Unordered List
      - First item
      - Second item
        - Nested item
        - Another nested item
      - Third item
        - Deeply nested
          - Even deeper

      ### Ordered List
      1. First numbered item
      2. Second numbered item
      3. Third numbered item
        1. Nested numbered
        2. Another nested

      ### Task List
      - [x] Completed task
      - [ ] Incomplete task
      - [x] Another completed task
      - [ ] Another incomplete task

      ---

      ## Emphasis Examples

      **Bold** and *italic* can be combined: ***bold italic***.

      You can also use `code` within **bold** or *italic* text: **`bold code`** and *`italic code`*.
    MARKDOWN
  },
  {
    title: "Code Blocks & Technical Content",
    body: <<~MARKDOWN
      # Code Examples

      ## Inline Code
      Use `const variable = "value"` for inline code snippets.

      ## Code Blocks

      ### JavaScript
      ```javascript
      function greet(name) {
        return `Hello, ${name}!`;
      }

      const user = {
        name: "John",
        age: 30,
        email: "john@example.com"
      };

      console.log(greet(user.name));
      ```

      ### Ruby
      ```ruby
      class User
        attr_accessor :name, :email

        def initialize(name, email)
          @name = name
          @email = email
        end

        def to_s
          "#{@name} <#{@email}>"
        end
      end

      user = User.new("Alice", "alice@example.com")
      puts user
      ```

      ### Python
      ```python
      def fibonacci(n):
          """Generate Fibonacci sequence up to n."""
          a, b = 0, 1
          while a < n:
              yield a
              a, b = b, a + b

      # Usage
      for num in fibonacci(100):
          print(num)
      ```

      ### SQL
      ```sql
      SELECT users.name, users.email, COUNT(notes.id) as note_count
      FROM users
      LEFT JOIN notes ON notes.user_id = users.id
      WHERE users.created_at > '2024-01-01'
      GROUP BY users.id
      ORDER BY note_count DESC;
      ```

      ### Shell Commands
      ```bash
      # Install dependencies
      npm install

      # Run tests
      npm test

      # Build for production
      npm run build
      ```

      ## Indented Code Block
          This is an indented code block
          It preserves whitespace
          And line breaks
    MARKDOWN
  },
  {
    title: "Advanced Markdown Features",
    body: <<~MARKDOWN
      # Advanced Markdown Features

      ## Blockquotes

      > This is a blockquote.
      > It can span multiple lines.
      >#{' '}
      > And include multiple paragraphs.

      > ### Blockquote with Header
      >#{' '}
      > You can include headers, lists, and other markdown inside blockquotes.
      >#{' '}
      > - List item one
      > - List item two
      >#{' '}
      > > Nested blockquote!

      ---

      ## Tables

      ### Basic Table
      | Column 1 | Column 2 | Column 3 |
      |----------|----------|----------|
      | Row 1    | Data     | Value    |
      | Row 2    | More     | Info     |
      | Row 3    | Even     | More     |

      ### Table with Alignment
      | Left Aligned | Center Aligned | Right Aligned |
      |:-------------|:--------------:|--------------:|
      | Left         | Center         | Right         |
      | Text         | Text           | Text          |
      | Example      | Example        | Example       |

      ### Complex Table
      | Feature | Status | Notes |
      |---------|:------:|-------|
      | Markdown | ✅ | Fully supported |
      | Tables | ✅ | With alignment |
      | Code blocks | ✅ | Syntax highlighting |
      | Task lists | ✅ | Checkbox support |
      | Math | ❌ | Not supported |

      ---

      ## Horizontal Rules

      Above this line

      ---

      Below this line

      ***

      Another horizontal rule

      ___

      And another one

      ---

      ## Escaped Characters

      You can escape special characters: \\*not italic\\*, \\#not a header\\, \\`not code\\`.

      ## Line Breaks

      This line has two spaces at the end.#{'  '}
      So it creates a line break.

      This line doesn't have spaces.
      So it's just a new paragraph.
    MARKDOWN
  },
  {
    title: "Mixed Content & Real-World Example",
    body: <<~MARKDOWN
      # Project Documentation Example

      ## Overview

      This is a **comprehensive example** combining various markdown features in a realistic documentation format.

      ## Features

      - [x] User authentication
      - [x] Note management
      - [ ] Real-time collaboration
      - [ ] Export to PDF
      - [ ] Mobile app

      ## Installation

      ```bash
      git clone https://github.com/example/project.git
      cd project
      bundle install
      rails db:setup
      ```

      ## Configuration

      Create a `.env` file with the following variables:

      ```env
      DATABASE_URL=postgresql://localhost/myapp
      SECRET_KEY_BASE=your_secret_key
      RAILS_ENV=development
      ```

      ## API Endpoints

      | Method | Endpoint | Description | Auth Required |
      |--------|----------|-------------|---------------|
      | GET | `/api/notes` | List all notes | ✅ |
      | POST | `/api/notes` | Create a note | ✅ |
      | GET | `/api/notes/:id` | Get a note | ✅ |
      | PUT | `/api/notes/:id` | Update a note | ✅ |
      | DELETE | `/api/notes/:id` | Delete a note | ✅ |

      ## Usage Examples

      ### Creating a Note

      ```ruby
      note = Note.create!(
        user: current_user,
        title: "My First Note",
        body: "# Hello World\\n\\nThis is my note."
      )
      ```

      ### Querying Notes

      ```ruby
      # Get all notes for a user
      user.notes.order(created_at: :desc)

      # Search notes
      Note.where("title ILIKE ?", "%search%")
      ```

      ## Best Practices

      > **Note:** Always validate user input before saving to the database.

      ### Security

      1. **Authentication**: Use secure password hashing
      2. **Authorization**: Check permissions before actions
      3. **Validation**: Validate all user inputs
      4. **Sanitization**: Sanitize markdown content

      ## Troubleshooting

      ### Common Issues

      #### Issue: Database connection error

      ```bash
      # Check database status
      rails db:version

      # Reset database
      rails db:reset
      ```

      #### Issue: Missing dependencies

      ```bash
      bundle install
      yarn install
      ```

      ---

      ## Resources

      - [Official Documentation](https://example.com/docs)
      - [API Reference](https://example.com/api)
      - [GitHub Repository](https://github.com/example/project)
      - [Issue Tracker](https://github.com/example/project/issues)

      ## Contact

      For questions, email us at [support@example.com](mailto:support@example.com) or open an issue on GitHub.

      ---

      *Last updated: 2024-01-15*
    MARKDOWN
  }
]

notes_data.each do |note_data|
  Note.create!(
    user: User.first,
    title: note_data[:title],
    body: note_data[:body]
  )
end

# Create 100 versions for the first note to test pagination
if (first_note = Note.first)
  base_title = first_note.title
  base_body = first_note.body

  # Start from 101 hours ago and work forward (so these are older than the initial version)
  base_time = Time.current - 101.hours

  100.times do |i|
    # Create versions with slight variations to make them distinct
    version_title = base_title
    version_body = if i == 0
                     base_body
    else
                     "#{base_body}\n\n---\n\n*Version #{i + 1}*"
    end

    NoteVersion.create!(
      note: first_note,
      title: version_title,
      body: version_body,
      created_at: base_time + i.hours
    )
  end
end
