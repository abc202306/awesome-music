| | |
| --- | --- |
| up | <% tp.frontmatter.up?.map(s=>s.replace(/\|/,"\\|"))?.join(", ")||"" %> |
| title | <% tp.frontmatter.title||"" %> |
| url | <% tp.frontmatter.url||"" %> |
| description | <% tp.frontmatter.description||"" %> |
| tags | <% (tp.frontmatter.tags||[]).map((t)=>`#${t}`).join(", ") %> |
| categories | <% tp.frontmatter.categories?.map(s=>s.replace(/\|/,"\\|"))?.join(", ")||"" %> |
| cover | <% tp.frontmatter.cover||"" %> |
| author | <% tp.frontmatter.author||"" %> |
| notes | <% tp.frontmatter.notes?.map(s=>s.replace(/\|/,"\\|"))?.join(", ")||"" %> |
| published | <% tp.frontmatter.published||"" %> |
| ctime | <% tp.frontmatter.ctime||"" %> |
| mtime | <% tp.frontmatter.mtime||"" %> |