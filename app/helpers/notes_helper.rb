module NotesHelper
  def render_markdown(text, truncate: false, length: 150, prose_class: "prose prose-sm max-w-none")
    return content_tag(:div, "", class: prose_class) if text.blank?

    markdown_text = text.to_s

    if truncate && markdown_text.length > length
      # Truncate at word boundary, trying to preserve markdown structure
      truncated = markdown_text.truncate(length, separator: " ", omission: "...")
      markdown_text = truncated
    end

    html = Commonmarker.to_html(markdown_text, options: {
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

    content_tag(:div, html.html_safe, class: prose_class)
  end
end
