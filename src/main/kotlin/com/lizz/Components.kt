package com.lizz

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.html.*
import io.ktor.server.request.*
import kotlinx.datetime.LocalDate
import kotlinx.html.*

internal fun HTML.siteHead(titleText: String = "lizz.dev", description: String? = null) {
    head {
        meta {
            name = "viewport"
            content = "width=device-width, initial-scale=1"
        }
        meta {
            name = "description"
            content = (description?.takeIf { it.isNotBlank() }
                ?: "Personal blog by Lizz. Developed with Ktor + HTMX + Tailwind")
        }
        script(src = "https://cdn.jsdelivr.net/npm/htmx.org@2.0.6/dist/htmx.min.js") {}
        script { src = "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4" }
        title { +titleText }

        link(rel = "stylesheet", href = "/style.css?v=1")
        link {
            rel = "icon"
            type = "image/x-icon"
            href = "/favicon.png?v=1"
        }
    }
}

internal fun formatDate(date: LocalDate): String {
    val months = arrayOf("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
    val mIdx = date.month.ordinal - 1
    val month =
        if (mIdx in months.indices) months[mIdx] else date.month.name.lowercase().replaceFirstChar { it.titlecase() }
    return "$month ${date.day}, ${date.year}"
}

internal fun BODY.navbar(currentPath: String) {
    fun linkClasses(active: Boolean): String = if (active) {
        "text-lg font-semibold text-emerald-400 border-b-2 border-emerald-500"
    } else {
        "text-lg font-medium text-neutral-400 hover:text-neutral-200"
    }
    nav(classes = "w-full bg-neutral-900/95 backdrop-blur border-b border-neutral-800 sticky top-0 z-10") {
        div(classes = "mx-auto max-w-5xl px-4 py-3 flex items-center gap-6") {
            // Brand / title
            a(
                href = "/",
                classes = "mr-auto font-mono text-2xl font-bold tracking-tight text-emerald-400 hover:text-emerald-300"
            ) {
                attributes["aria-label"] = "lizz.dev home"
                +"lizz.dev"
            }
            // Nav links
            a(href = "/", classes = linkClasses(currentPath == "/")) {
                if (currentPath == "/") attributes["aria-current"] = "page"
                +"Blog"
            }
            a(href = "/about", classes = linkClasses(currentPath.startsWith("/about"))) {
                if (currentPath.startsWith("/about")) attributes["aria-current"] = "page"
                +"About"
            }
            a(href = "/test", classes = linkClasses(currentPath == "/test")) {
                if (currentPath == "/test") attributes["aria-current"] = "page"
                +"Test"
            }
            // Social / contact icons
            div(classes = "ml-2 flex items-center gap-3") {
                // GitHub (code emoji)
                a(
                    href = "https://github.com/Lizzergas",
                    classes = "text-neutral-300 hover:text-emerald-400 text-xl"
                ) {
                    attributes["aria-label"] = "GitHub: Lizzergas"
                    attributes["title"] = "GitHub"
                    attributes["target"] = "_blank"
                    attributes["rel"] = "noopener noreferrer"
                    +"</>"
                }
                // Email (mail emoji)
                a(
                    href = "mailto:home@lizz.dev",
                    classes = "text-neutral-300 hover:text-emerald-400 text-xl"
                ) {
                    attributes["aria-label"] = "Email: home@lizz.dev"
                    attributes["title"] = "Email"
                    +"\uD83D\uDCEA"
                }
            }
        }
    }
}

internal fun HTML.page(call: ApplicationCall, title: String, description: String? = null, block: BODY.() -> Unit) {
    // Accessibility / i18n
    attributes["lang"] = "en"
    siteHead(title, description)
    body(classes = "bg-neutral-950 min-h-screen text-neutral-200 font-mono") {
        navbar(call.request.path())
        block()
    }
}

internal fun FlowContent.mainContent(block: DIV.() -> Unit) {
    div(classes = "mx-auto max-w-5xl px-4 py-10") {
        block()
    }
}

internal fun FlowContent.pageHeader(text: String, vararg classes: String, withCursor: Boolean = true) {
    val cursorClass = if (withCursor) " blinking-cursor" else ""
    h1(classes = "text-3xl font-bold text-neutral-100 ${classes.joinToString(" ")}$cursorClass") { +text }
}

internal fun FlowContent.postCard(post: BlogPost) {
    article(classes = "bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-3") {
        a(href = "/blog/${post.slug}", classes = "text-2xl font-semibold text-emerald-400 hover:text-emerald-300") {
            +post.title
        }
        div(classes = "text-sm text-neutral-400") { +formatDate(post.date) }
        p(classes = "text-neutral-300") { +post.excerpt }
        div {
            a(
                href = "/blog/${post.slug}",
                classes = "inline-block mt-1 px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-neutral-950 text-sm font-semibold ring ring-emerald-500/40 shadow-sm"
            ) {
                attributes["aria-label"] = "Read more about ${post.title}"
                +"Read more"
            }
        }
    }
}

internal suspend fun respondNotFound(call: ApplicationCall) {
    call.respondHtml(HttpStatusCode.NotFound) {
        page(call, "Not Found • lizz.dev") {
            mainContent {
                pageHeader("Post Not Found")
                p(classes = "mt-4 text-neutral-300") { +"The requested post could not be found." }
            }
        }
    }
}
