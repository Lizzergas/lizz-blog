# Hello World (2024-07-19)

Hello world! I’ve decided to start writing a simple blog about my “adventures” as a lazy developer. Probably the most cliche and boring intro, but whatever.

I’ve recently started playing around with Lua for Love2D. Due to this I’ve delved more into Lua by looking for other applications of it and found the most inconvenient - web frameworks. Compared to standards like Node.js Lua doesn’t have that power. However, LuaJIT is so powerful, that I’ve went FOMO and decided to try it out so here I am. This text comes straight from Lua, that of course later was transpiled into HTML.

I’ve picked up Lapis framework for this blog. Setting it up was HORRIBLE. Since Lapis uses OpenResty that uses LuaJIT 5.1, there were some problems with Lua versions. Natively on my Mac, I had 5.4.whatever version. When setting up Lapis via Luarocks I’ve encountered many path issues. Played around with PATHS, edited /opt/homebrew/etc luarock configs. Sourced .zshrc like 10-15 times with no luck fixing the issue where somehow lpeg library was missing. I checked all the folders and it was there. Tried to customly set up Luarock rock-trees setting. Still no luck. 

After lots of discussions with AI and Googling, I’ve decided to do a full purge and reinstall and it worked! 

The issue was that I installed Luarocks first, Lapis and then OpenResty… Can you imagine? I’ve wasted like 30-60 minutes trying to solve this issue… Finally I’ve set it up and now I know how to install packages… amm sorry, rocks and use them in my code. 

My first goal was to create a simple Markdown based website for a blog and here we are. At the moment when I am writing, I’ve set up only a simple hello world with some custom alternate parser syntax rules. I have no clue what I am doing, but all hail ChatGPT. WIth the help of it, I wrote some weird ass syntax using Lpeg (Lua parser lib?) to parse out headings and add <hx> to it.

So yeah, that’s pretty much it, lots of empty words in this blog, but fuck it. We ballin. Now I’ll try to host this website somewhere. Probably in github.io so I can spread the word about the great power of Lua and some of the fun I have while using it ^^

Thank you for reading and have a good one~
Lizz
#daily/blog