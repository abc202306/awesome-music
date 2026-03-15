# @author abc202306
# @description Jekyll 插件：路径重写器

Jekyll::Hooks.register [:pages, :documents], :pre_render do |item|
  # --- 配置表：[ 正则表达式, 替换值, 描述, 适用路径过滤 ] ---
  rules = [
    # 规则 1: 重写 LFS 资源路径
    [/([^"\(\[:\s]*\/)?assets\//, 'https://media.githubusercontent.com/media/abc202306/awesome-music/refs/heads/main/assets/', "LFS 路径重写", :all],

    [/!\[(\d*?)\]\((.*?)\)/, '<img src="\2" width=\1>', "图片转换", :all],

    # 规则 2: _posts 目录下的相对路径修正
    [/\.\.\//, "../../../", "Posts 深度修正", :posts_only],

    # 规则 3: Post 源码路径转为永久链接路径
    [/\.\/_posts\/(\d{4})-(\d{2})-(\d{2})-([^\)]*)(\.md)?/, './\1/\2/\3/\4.html', "Markdown 转 HTML 链接", :all],

    # 规则 4: 去除括号中的 .md 后缀
    [/\(([^)]*)\.md/, '(\1', "清理 MD 括号链接", :all],

    # 规则 5: 去除 href 里的 .md 后缀
    [/href="([^"]*)\.md"/, 'href="\1"', "清理 href 链接", :all]
  ]

  # --- 执行引擎 ---
  rel_path = item.relative_path

  rules.each do |regex, replacement, description, scope|
    # 如果范围是 :posts_only，则跳过非 _posts 文件夹的文件
    next if scope == :posts_only && !rel_path.start_with?("_posts/")

    # 1. 处理正文 (doc.content)
    item.content.gsub!(regex, replacement)

    # 2. 处理 Front Matter (doc.data)
    # 遍历所有 Key-Value，如果值是字符串，则执行替换
    item.data.each do |key, value|
      if value.is_a?(String)
        # 注意：这里不能用 gsub! 因为会直接修改原始 YAML 引用
        item.data[key] = value.gsub(regex, replacement)
      end
    end
  end
end