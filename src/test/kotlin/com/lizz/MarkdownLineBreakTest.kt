package com.lizz

import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.testing.*
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class MarkdownLineBreakTest {
    @Test
    fun `linebreaks markdown renders soft breaks as br and escapes raw html`() = testApplication {
        application { module() }

        // Slug derived from 2024-01-01-linebreaks.md
        val res = client.get("/blog/linebreaks")
        assertEquals(HttpStatusCode.OK, res.status)
        val body = res.bodyAsText()

        // Title present
        assertTrue(body.contains("Line breaks test"), "Expected post title present")

        // Expect at least two <br> emitted from normalized soft line breaks
        val brCount = Regex("<br>").findAll(body).count()
        assertTrue(brCount >= 2, "Expected at least two <br> tags, found $brCount. Body: ${body.take(500)}")

        // Raw HTML like <p> in source markdown should be escaped, not interpreted
        assertTrue(body.contains("&lt;p&gt;"), "Expected literal <p> to be escaped to &lt;p&gt;. Body: ${body.take(500)}")
        assertTrue(!body.contains("</p><p> block"), "Unexpected raw HTML paragraph split found. Body: ${body.take(500)}")
    }
}
