---
ctime: <% tp.frontmatter.ctime || tp.file.creation_date("YYYY-MM-DDTHH:mm:ssZ") %>
mtime: <% tp.frontmatter.mtime || tp.file.last_modified_date("YYYY-MM-DDTHH:mm:ssZ") %>
published: <% tp.frontmatter.date || "" %>
---
