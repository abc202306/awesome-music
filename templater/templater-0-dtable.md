| | |
| --- | --- |
| description | <% tp.frontmatter.description||"" %> |
| tags | <% (tp.frontmatter.tags||[]).map((t)=>`#${t}`).join(", ") %> |
| author | <% tp.frontmatter.author||"" %> |
| published | <% tp.frontmatter.published||"" %> |
| ctime | <% tp.frontmatter.ctime||"" %> |
| mtime | <% tp.frontmatter.mtime||"" %> |
| categories | <% tp.frontmatter.categories||"" %> |