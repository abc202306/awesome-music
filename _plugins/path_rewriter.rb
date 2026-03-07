Jekyll::Hooks.register [:pages, :documents], :pre_render do |item|
  # 获取相对路径用于条件判断
  rel_path = item.relative_path
  content = item.content

  # --- 规则 1: 重写 LFS 路径 (全局) ---
  # 对应: s|src="([^"]*/)?assets/|src="https://media.githubusercontent.com..."|g
  content.gsub!(/src="([^"]*\/)?assets\//, 'src="https://media.githubusercontent.comabc202306/awesome-music/refs/heads/main/assets/')

  # --- 规则 2: 重写 _posts 文件夹内的相对路径 ---
  # 对应: find ./_posts/ ... sed 's|\.\./|../../../|g'
  if rel_path.start_with?("_posts/")
    content.gsub!("../", "../../../")
  end

  # --- 规则 3: 将 Markdown 内部链接重写为目录结构 (全局) ---
  # 对应: s|\./_posts/([0-9]{4})-([0-9]{2})-([0-9]{2})-([^)]*)\.md|./\1/\2/\3/\4.html|g
  content.gsub!(/\.\/_posts\/(\d{4})-(\d{2})-(\d{2})-([^\)]*)\.md/, './\1/\2/\3/\4.html')

  # --- 规则 4 & 5: 去除 Markdown 文件链接的扩展名 (全局) ---
  # 对应: s|\(([^\)]*)\.md|\(\1|g  以及  s|href="([^"]*)\.md"|href="\1"|g
  content.gsub!(/\(([^)]*)\.md/, '(\1') # 处理 (link.md) -> (link)
  content.gsub!(/href="([^"]*)\.md"/, 'href="\1"') # 处理 href="link.md" -> href="link"

  item.content = content
end
