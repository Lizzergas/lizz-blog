local lapis = require("lapis")
local lunamark = require("lunamark")
local lpeg = require("lpeg")
local lfs = require("lfs")
local app = lapis.Application()

-- Function to read file content
local function read_file(filepath)
  local file = io.open(filepath, "r")
  if not file then
    return nil, "File not found: " .. filepath
  end
  local content = file:read("*all")
  file:close()
  return content
end

-- Custom syntax for headers
local function add_custom_syntax(syntax)
  -- Using default header handling by Lunamark

  local pre_tag = lpeg.P("&&") * lpeg.C((lpeg.P(1) - lpeg.P("&&"))^1) / function(header)
    return "<pre>" .. header .. "</pre>"
  end

  syntax.Inline = pre_tag + syntax.Inline
  return syntax
end

-- Navigation bar
local function nav_bar() 
  return function()
    a({href = "/"}, "Home")
    a({href = "/projects"}, "My Projects")
    a({href = "/journey"}, "Journey")
    a({href = "/blog"}, "Blog")
  end
end

-- Web head
local function web_head(ttl, desc)
  local css_style =
      [[
          body {
            font-family: Arial, sans-serif;
          }
          nav a {
            padding: 8px; 
          }
    ]]

  return function()
    title(ttl)
    meta({charset = "utf-8"})
    meta({name = "viewport", content = "width=device-width, initial-scale=1"})
    meta({naem = "description", content = desc})
    style(css_style)
  end
end

-- Function to get all blog files
local function get_blog_files()
  local blog_files = {}
  for file in lfs.dir("blogs") do
    if file:match("%.md$") then
      table.insert(blog_files, file)
    end
  end
  return blog_files
end

-- Home route
app:get("/", function(self)
  return self:html(function()
    html(function()
      head(web_head("Home", "Welcome to my blog! Explore my projects, journey, and latest blog posts."))
      body(function()
        nav(nav_bar())
        hr()
        h1("Lizz Development Blog")
        h2("Status: Under Construction")
        p("Hihi~ I've decided to start blogging on 2024-07-19. So far we got this crappy website. Yay. Not planning to update it, but planning to write some content.")
      end)
    end)
  end)
end)

-- Projects route
app:get("/projects", function(self)
  return self:html(function()
    html(function()
      head(web_head("My Projects", "Discover my projects and coding adventures."))
      body(function()
        nav(nav_bar())
        hr()
        h1("My Projects")
        p("Slacker with no projects yet...")
      end)
    end)
  end)
end)

-- Journey route
app:get("/journey", function(self)
  return self:html(function()
    html(function()
      head(web_head("Journey"), "Read about my journey and experiences.")
      body(function()
        nav(nav_bar())
        hr()
        h1("Journey")
        p("This is the Journey page.")
      end)
    end)
  end)
end)

-- Blogs route
app:get("/blog", function(self)
  local blog_files = get_blog_files()

  return self:html(function()
    html(function()
      head(web_head("Blog", "Browse my latest blog posts about my development experience."))
      body(function()
        nav(nav_bar())
        hr()
        h1("Blog")
        ul(function()
          for _, file in ipairs(blog_files) do
            local blog_title = file:gsub("%.md$", "")
            li(function()
              a({ href = "/blog/" .. blog_title }, blog_title)
            end)
          end
        end)
      end)
    end)
  end)
end)

-- Dynamic blog post routes
app:get("/blog/:post", function(self)
  local post_name = self.params.post
  local filepath = "blogs/" .. post_name .. ".md"
  local md_content, err = read_file(filepath)
  if not md_content then
    return "Error reading file: " .. err
  end

  local opts = {
    alter_syntax = add_custom_syntax
  }
  local writer = lunamark.writer.html.new(opts)
  local parse = lunamark.reader.markdown.new(writer, opts)
  local my_html = parse(md_content)

  return self:html(function()
    html(function()
      head(web_head(post_name))
      body(function()
        nav(nav_bar())
        hr()
        raw(my_html) -- Insert the raw HTML content here
      end)
    end)
  end)
end)

return app
