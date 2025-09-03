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
            page(this@respondBlogPage, "${post.title} • Blog") {
                mainContent {
                    article(classes = "prose prose-invert max-w-none space-y-4 p-6 bg-neutral-900/50 border border-neutral-800 rounded-xl animated-border") {
                        h1(classes = "text-3xl font-bold text-neutral-100 mb-2") { +post.title }
                        div(classes = "text-sm text-neutral-400 mb-6") { +formatDate(post.date) }
                        unsafe { +post.contentHtml }
                    }
                }
            }
        }
    }
}
