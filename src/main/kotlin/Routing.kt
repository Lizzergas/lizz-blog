@file:OptIn(ExperimentalKtorApi::class)

package com.lizz

import com.lizz.pages.respondAboutPage
import com.lizz.pages.respondBlogPage
import com.lizz.pages.respondIndexPage
import com.lizz.pages.respondTestPage
import io.ktor.server.application.*
import io.ktor.server.html.*
import io.ktor.server.http.content.*
import io.ktor.server.routing.*
import io.ktor.utils.io.ExperimentalKtorApi
import kotlinx.html.body
import kotlinx.html.div

fun Application.configureRouting() {
    routing {
        staticResources("/", "static")

        get("/") {
            call.respondIndexPage()
        }

        get("/test") {
            call.respondTestPage()
        }

        get("/blog/{slug}") {
            call.respondBlogPage()
        }

        get("/about") {
            call.respondAboutPage()
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