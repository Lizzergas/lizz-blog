package com.lizz.pages

import com.lizz.*
import io.ktor.server.application.*
import io.ktor.server.html.*
import kotlinx.html.*

internal suspend fun ApplicationCall.respondIndexPage() {
    val latest = BlogService.latest(5)
    val all = BlogService.all()
    respondHtml {
        page(this@respondIndexPage, "Blog • HTMX + Tailwind + Ktor") {
            div(classes = "mx-auto max-w-5xl px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8") {
                div(classes = "md:col-span-2 space-y-6") {
                    id = "blog-content"
                    attributes["hx-boost"] = "true"
                    pageHeader("Just tinkering around...", "mb-4")
                    latest.forEach { post ->
                        postCard(post)
                    }
                }
                allPostsList(all)
            }
        }
    }
}

internal fun FlowContent.allPostsList(posts: List<BlogPost>) {
    aside(classes = "space-y-3") {
        h2(classes = "text-xl font-bold text-neutral-100") { +"All posts" }
        ul(classes = "divide-y divide-neutral-800 rounded-xl border border-neutral-800 overflow-hidden") {
            posts.forEach { post ->
                li(classes = "p-3 hover:bg-neutral-900") {
                    a(
                        href = "/blog/${post.slug}",
                        classes = "text-emerald-400 hover:text-emerald-300 font-medium"
                    ) { +post.title }
                    div(classes = "text-xs text-neutral-400") { +formatDate(post.date) }
                }
            }
        }
    }
}