package com.lizz

import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.testing.*
import kotlin.math.min
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class AppSmokeTest {
    @Test
    fun `root page renders HTML with navbar, HTMX and Tailwind`() = testApplication {
        application { module() }

        val res = client.get("/")
        assertEquals(HttpStatusCode.OK, res.status)
        val body = res.bodyAsText()
        assertTrue(body.contains("htmx.min.js"), "Expected HTMX script tag")
        assertTrue(body.contains("HTMX + Tailwind + Ktor"), "Expected page title text")
        assertTrue(body.contains("lizz.dev"), "Expected brand title lizz.dev in navbar")
        assertTrue(body.contains(">Blog<"), "Expected navbar Blog link")
        assertTrue(body.contains(">About<"), "Expected navbar About link")
        assertTrue(body.contains("href=\"https://github.com/Lizzergas\""), "Expected GitHub link in navbar")
        assertTrue(body.contains("href=\"mailto:home@lizz.dev\""), "Expected Email link in navbar")
    }

    @Test
    fun `about page renders with navbar`() = testApplication {
        application { module() }

        val res = client.get("/about")
        assertEquals(HttpStatusCode.OK, res.status)
        val body = res.bodyAsText()
        assertTrue(body.contains("About"), "Expected About page content")
        assertTrue(body.contains("lizz.dev"), "Expected brand title lizz.dev in navbar")
        assertTrue(body.contains(">Blog<"), "Expected navbar Blog link")
        assertTrue(body.contains(">About<"), "Expected navbar About link")
        assertTrue(body.contains("href=\"https://github.com/Lizzergas\""), "Expected GitHub link in navbar")
        assertTrue(body.contains("href=\"mailto:home@lizz.dev\""), "Expected Email link in navbar")
    }
}

class ActiveStateTest {
    @Test
    fun `root navbar shows Blog as active with aria-current once`() = testApplication {
        application { module() }
        val res = client.get("/")
        assertEquals(HttpStatusCode.OK, res.status)
        val body = res.bodyAsText()
        val count = Regex("aria-current=\"page\"").findAll(body).count()
        assertEquals(1, count, "Expected exactly one aria-current=\"page\"")
        val idx = body.indexOf("aria-current=\"page\"")
        assertTrue(idx >= 0)
        val snippet = body.substring(idx, min(idx + 200, body.length))
        assertTrue(snippet.contains(">Blog<"), "Expected active state on Blog link")
    }

    @Test
    fun `about navbar shows About as active with aria-current once`() = testApplication {
        application { module() }
        val res = client.get("/about")
        assertEquals(HttpStatusCode.OK, res.status)
        val body = res.bodyAsText()
        val count = Regex("aria-current=\"page\"").findAll(body).count()
        assertEquals(1, count, "Expected exactly one aria-current=\"page\"")
        val idx = body.indexOf("aria-current=\"page\"")
        assertTrue(idx >= 0)
        val snippet = body.substring(idx, min(idx + 200, body.length))
        assertTrue(snippet.contains(">About<"), "Expected active state on About link")
    }
}
