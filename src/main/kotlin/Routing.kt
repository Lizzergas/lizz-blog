@file:OptIn(ExperimentalKtorApi::class)

package com.lizz

import io.ktor.htmx.*
import io.ktor.htmx.html.*
import io.ktor.server.application.*
import io.ktor.server.html.*
import io.ktor.server.http.content.staticResources
import io.ktor.server.request.*
import io.ktor.server.routing.*
import io.ktor.utils.io.*
import kotlinx.datetime.LocalDate
import kotlinx.html.*

private fun HTML.siteHead(titleText: String = "HTMX + Tailwind + Ktor") {
    head {
        script(src = "https://cdn.jsdelivr.net/npm/htmx.org@2.0.6/dist/htmx.min.js") {}
        script { src = "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4" }
        title { +titleText }

        link {
            rel = "icon"
            type = "image/x-icon"
            href = "/favicon.png?v=1"
        }
    }
}

private fun formatDate(date: LocalDate): String {
    val months = arrayOf("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
    val mIdx = date.month.ordinal - 1
    val month =
        if (mIdx in months.indices) months[mIdx] else date.month.name.lowercase().replaceFirstChar { it.titlecase() }
    return "$month ${date.day}, ${date.year}"
}

private fun BODY.navbar(currentPath: String) {
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
                classes = "mr-auto font-mono text-2xl font-bold tracking-tight text-emerald-400 hover:text-emerald-300 transition-colors"
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
                    classes = "text-neutral-300 hover:text-emerald-400 transition-colors text-xl"
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
                    classes = "text-neutral-300 hover:text-emerald-400 transition-colors text-xl"
                ) {
                    attributes["aria-label"] = "Email: home@lizz.dev"
                    attributes["title"] = "Email"
                    +"\uD83D\uDCEA"
                }
            }
        }
    }
}

fun Application.configureRouting() {
    routing {
        staticResources("/", "static")
        get("/") {
            call.respondHtml {
                siteHead("Blog • HTMX + Tailwind + Ktor")
                val currentPath = call.request.path()
                val latest = BlogService.latest(5)
                val all = BlogService.all()
                body(classes = "bg-neutral-950 min-h-screen text-neutral-200 font-mono") {
                    navbar(currentPath)
                    div(classes = "mx-auto max-w-5xl px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8") {
                        div(classes = "md:col-span-2 space-y-6") {
                            id = "blog-content"
                            attributes["hx-boost"] = "true"
                            h1(classes = "text-3xl font-bold text-neutral-100 mb-4") { +"Just tinkering around..." }
                            latest.forEach { post ->
                                article(classes = "bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-3") {
                                    a(
                                        href = "/blog/${post.slug}",
                                        classes = "text-2xl font-semibold text-emerald-400 hover:text-emerald-300"
                                    ) {
                                        +post.title
                                    }
                                    div(classes = "text-sm text-neutral-400") {
                                        +formatDate(post.date)
                                    }
                                    p(classes = "text-neutral-300") { +post.excerpt }
                                    div {
                                        a(
                                            href = "/blog/${post.slug}",
                                            classes = "inline-block mt-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-semibold ring-1 ring-emerald-500/40 shadow transition"
                                        ) {
                                            +"Read More"
                                        }
                                    }
                                }
                            }
                        }
                        aside(classes = "space-y-3") {
                            h2(classes = "text-xl font-bold text-neutral-100") { +"All posts" }
                            ul(classes = "divide-y divide-neutral-800 rounded-xl border border-neutral-800 overflow-hidden") {
                                all.forEach { post ->
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
                }
            }
        }

        get("/test") {
            call.respondHtml {
                siteHead()
                val currentPath = call.request.path()
                body(classes = "bg-neutral-950 min-h-screen text-neutral-200 font-mono") {
                    navbar(currentPath)
                    div(classes = "mx-auto max-w-5xl px-4 py-10 flex items-start justify-center") {
                        div(classes = "max-w-lg w-full bg-neutral-900 border border-neutral-800 shadow-xl rounded-2xl p-8 space-y-6") {
                            h1(classes = "text-3xl font-bold text-neutral-100 text-center") {
                                +"🚀 Hello from Ktor!"
                            }

                            p(classes = "text-neutral-300 text-center") {
                                +"This is a demo of "
                                span(classes = "font-semibold text-emerald-400") { +"Ktor + HTMX + TailwindCSS" }
                            }

                            div(classes = "flex justify-center") {
                                button(classes = "px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-semibold ring-1 ring-emerald-500/40 shadow-md transition") {
                                    id = "load-button"
                                    attributes.hx {
                                        get = "/data"
                                        target = "#result"
                                        swap = HxSwap.innerHtml
                                    }
                                    +"✨ Load Content"
                                }
                            }

                            div {
                                id = "result"
                                classes =
                                    setOf("mt-6 p-4 rounded-lg bg-neutral-900/60 text-neutral-200 text-center border border-neutral-800 shadow-sm transition")
                                +"📦 Data will appear here..."
                            }
                        }
                    }
                }
            }
        }

        get("/blog/{slug}") {
            val slug = call.parameters["slug"] ?: return@get call.respondHtml(io.ktor.http.HttpStatusCode.NotFound) {
                siteHead("Not Found • HTMX + Tailwind + Ktor")
                val currentPath = call.request.path()
                body(classes = "bg-neutral-950 min-h-screen text-neutral-200 font-mono") {
                    navbar(currentPath)
                    div(classes = "mx-auto max-w-5xl px-4 py-10") {
                        h1(classes = "text-3xl font-bold text-neutral-100") { +"Post Not Found" }
                        p(classes = "mt-4 text-neutral-300") { +"The requested post could not be found." }
                    }
                }
            }
            val post = BlogService.findBySlug(slug)
            if (post == null) {
                call.respondHtml(io.ktor.http.HttpStatusCode.NotFound) {
                    siteHead("Not Found • HTMX + Tailwind + Ktor")
                    val currentPath = call.request.path()
                    body(classes = "bg-neutral-950 min-h-screen text-neutral-200 font-mono") {
                        navbar(currentPath)
                        div(classes = "mx-auto max-w-5xl px-4 py-10") {
                            h1(classes = "text-3xl font-bold text-neutral-100") { +"Post Not Found" }
                            p(classes = "mt-4 text-neutral-300") { +"The requested post could not be found." }
                        }
                    }
                }
            } else {
                call.respondHtml {
                    siteHead("${post.title} • Blog • HTMX + Tailwind + Ktor")
                    val currentPath = call.request.path()
                    body(classes = "bg-neutral-950 min-h-screen text-neutral-200 font-mono") {
                        navbar(currentPath)
                        div(classes = "mx-auto max-w-5xl px-4 py-10") {
                            article(classes = "prose prose-invert max-w-none space-y-4") {
                                h1(classes = "text-3xl font-bold text-neutral-100 mb-2") { +post.title }
                                div(classes = "text-sm text-neutral-400 mb-6") { +formatDate(post.date) }
                                unsafe { +post.contentHtml }
                            }
                        }
                    }
                }
            }
        }

        get("/about") {
            call.respondHtml {
                siteHead("About • HTMX + Tailwind + Ktor")
                val currentPath = call.request.path()
                body(classes = "bg-neutral-950 min-h-screen text-neutral-200 font-mono") {
                    navbar(currentPath)
                    div(classes = "mx-auto max-w-5xl px-4 py-10") {
                        h1(classes = "text-3xl font-bold text-neutral-100") { +"About" }
                        p(classes = "mt-4 text-neutral-300") { +"This sample showcases Ktor with HTMX and Tailwind, rendered server-side with kotlinx.html." }
                    }
                }
            }
        }

        get("/data") {
            call.respondHtml {
                body {
                    div(classes = "p-6 bg-neutral-900 border border-neutral-800 rounded-lg shadow text-emerald-400 text-lg font-medium") {
                        +"✅ Hello from dynamically loaded Ktor content!"
                    }
                }
            }
        }
    }
}
