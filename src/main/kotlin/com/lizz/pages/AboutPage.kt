package com.lizz.pages

import com.lizz.mainContent
import com.lizz.page
import com.lizz.pageHeader
import io.ktor.server.application.*
import io.ktor.server.html.*
import kotlinx.html.p

internal suspend fun ApplicationCall.respondAboutPage() {
    respondHtml {
        page(this@respondAboutPage, "About • HTMX + Tailwind + Ktor") {
            mainContent {
                pageHeader("About")
                p(classes = "mt-4 text-neutral-300") { +"This sample showcases Ktor with HTMX and Tailwind, rendered server-side with kotlinx.html." }
            }
        }
    }
}
