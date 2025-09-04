package com.lizz.pages

import com.lizz.mainContent
import com.lizz.page
import com.lizz.pageHeader
import io.ktor.htmx.HxSwap
import io.ktor.htmx.html.hx
import io.ktor.server.application.*
import io.ktor.server.html.*
import kotlinx.html.*

internal suspend fun ApplicationCall.respondTestPage() {
    respondHtml {
        page(this@respondTestPage, "Test") {
            mainContent {
                div(classes = "flex items-start justify-center") {
                    div(classes = "max-w-lg w-full bg-neutral-900 border border-neutral-800 shadow-xl rounded-2xl p-8 space-y-6 animated-border") {
                        pageHeader("🚀 Hello from Ktor!", "text-center")

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
}
