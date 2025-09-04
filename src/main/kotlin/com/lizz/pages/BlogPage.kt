package com.lizz.pages

import com.lizz.*
import io.ktor.server.application.*
import io.ktor.server.html.*
import kotlinx.html.*

internal suspend fun ApplicationCall.respondBlogPage() {
    val slug = parameters["slug"] ?: return respondNotFound(this)
    val post = BlogService.findBySlug(slug)
    if (post == null) {
        return respondNotFound(this)
    } else {
        respondHtml {
            page(this@respondBlogPage, post.title, description = post.excerpt) {
                mainContent {
                    // HTMX hook to fetch raw markdown on load for client-side parsing (no visual swap by default)
                    div {
                        id = "md-source"
                        attributes["hx-get"] = "/blog/${'$'}{post.slug}.md"
                        attributes["hx-trigger"] = "load"
                        attributes["hx-swap"] = "none"
                    }

                    article(classes = "prose prose-invert max-w-none space-y-4 p-6 bg-neutral-900/50 border border-neutral-800 rounded-xl relative") {
                        // Clipboard button (top-right)
                        button(type = ButtonType.button, classes = "absolute top-3 right-3 inline-flex items-center justify-center w-9 h-9 rounded-md bg-neutral-800/70 hover:bg-neutral-700 text-neutral-200 text-lg ring-1 ring-neutral-700/60 shadow") {
                            attributes["title"] = "Copy clean article text to clipboard"
                            attributes["aria-label"] = "Copy clean article text to clipboard"
                            attributes["onclick"] = "copyWholePage(event)"
                            +"📋"
                        }

                        h1(classes = "text-3xl font-bold text-neutral-100 mb-2") { +post.title }
                        div(classes = "text-sm text-neutral-400 mb-6") {
                            attributes["data-role"] = "post-date"
                            +formatDate(post.date)
                        }
                        unsafe { +post.contentHtml }
                    }

                    // Lightweight client script to copy clean text (title, date, paragraphs)
                    script {
                        unsafe {
                            +"""
                            (function(){
                              window.copyWholePage = async function(evt){
                                try {
                                  var article = (evt && evt.currentTarget) ? evt.currentTarget.closest('article') : document.querySelector('article');
                                  if (!article) return;
                                  var titleEl = article.querySelector('h1');
                                  var title = titleEl ? (titleEl.textContent || '').trim() : '';
                                  var dateEl = article.querySelector('[data-role="post-date"]');
                                  var date = dateEl ? (dateEl.textContent || '').trim() : '';
                                  var paras = Array.from(article.querySelectorAll('p'))
                                    .map(function(p){ return (p.textContent || '').trim(); })
                                    .filter(function(t){ return t.length > 0; });
                                  var parts = [];
                                  if (title) parts.push(title);
                                  if (date) parts.push(date);
                                  if (paras.length) parts.push(paras.join('\n\n'));
                                  var text = parts.join('\n\n');
                                  if (navigator.clipboard && navigator.clipboard.writeText) {
                                    await navigator.clipboard.writeText(text);
                                  } else {
                                    var ta = document.createElement('textarea');
                                    ta.value = text;
                                    document.body.appendChild(ta);
                                    ta.select();
                                    document.execCommand('copy');
                                    document.body.removeChild(ta);
                                  }
                                  var btn = evt && evt.currentTarget;
                                  if (btn) {
                                    var prev = btn.textContent;
                                    btn.textContent = 'Copied!';
                                    setTimeout(function(){ btn.textContent = '📋'; }, 1200);
                                  }
                                } catch (e) {
                                  alert('Copy failed. You can Select All and copy manually.');
                                }
                              };
                            })();
                            """
                        }
                    }
                }
            }
        }
    }
}
