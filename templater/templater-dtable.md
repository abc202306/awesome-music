| | |
| --- | --- |
| description | <% tp.frontmatter.description||"" %> |
| tags | <% (tp.frontmatter.tags||[]).map((t)=>`#${t}`).join(", ") %> |