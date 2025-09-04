package com.lizz

import com.vladsch.flexmark.html.HtmlRenderer
import com.vladsch.flexmark.parser.Parser
import java.nio.charset.StandardCharsets
import java.util.Locale
import kotlinx.datetime.LocalDate


data class BlogPost(
    val title: String,
    val date: LocalDate,
    val slug: String,
    val contentMd: String,
    val contentHtml: String,
    val excerpt: String
)

object BlogService {
    private val parser: Parser = Parser.builder().build()
    private val renderer: HtmlRenderer = HtmlRenderer.builder()
        .build()

    private val posts: List<BlogPost> by lazy { loadAllPosts() }

    fun latest(n: Int): List<BlogPost> = posts.take(n)
    fun all(): List<BlogPost> = posts
    fun findBySlug(slug: String): BlogPost? = posts.find { it.slug == slug }

    private fun loadAllPosts(): List<BlogPost> {
        // Single source of truth: load from classpath resources under blogs/
        val cl = Thread.currentThread().contextClassLoader ?: this::class.java.classLoader
        val indexStream = cl.getResourceAsStream("blogs/_index.txt") ?: return emptyList()

        val fileNames = indexStream.bufferedReader(Charsets.UTF_8).use { br ->
            br.readLines()
                .map { it.trim() }
                .filter { it.isNotEmpty() && !it.startsWith("#") }
        }

        val loaded = fileNames.mapNotNull { fileName ->
            val mdStream = cl.getResourceAsStream("blogs/$fileName") ?: return@mapNotNull null
            val md = mdStream.use { it.readBytes().toString(StandardCharsets.UTF_8) }
            parseFile(fileName, md)
        }

        return loaded.sortedByDescending { it.date }
    }

    private fun parseFile(fileName: String, md: String): BlogPost? {
        // Expect filename: yyyy-MM-dd-some-slug.md
        val base = fileName.removeSuffix(".md")
        if (base.length < 12) return null
        // Date is first 10 chars yyyy-MM-dd
        val dateStr = base.take(10)
        val date = try { LocalDate.parse(dateStr) } catch (e: Exception) { return null }
        val slug = base.drop(11) // skip date and hyphen

        val title = extractTitle(md) ?: slugToTitle(slug)
        val mdNormalized = md
            .replace("\r\n", "\n")
        val html = renderer.render(parser.parse(mdNormalized))
        val excerpt = buildExcerpt(md, 200)

        return BlogPost(
            title = title,
            date = date,
            slug = slug,
            contentMd = md,
            contentHtml = html,
            excerpt = excerpt
        )
    }

    private fun extractTitle(md: String): String? {
        // Title from first ATX heading line starting with '# '
        return md.lineSequence()
            .firstOrNull { it.trimStart().startsWith("# ") }
            ?.trimStart()
            ?.removePrefix("# ")
            ?.trim()
    }

    private fun slugToTitle(slug: String): String = slug
        .split('-')
        .joinToString(" ") { it.replaceFirstChar { c -> c.titlecase(Locale.getDefault()) } }

    private fun buildExcerpt(md: String, maxChars: Int): String {
        // Strip simple markdown markers for excerpt and collapse whitespace
        val text = md
            .replace(Regex("^# .*$", RegexOption.MULTILINE), "")
            .replace("**", "")
            .replace("*", "")
            .replace("`", "")
            .replace("\n+".toRegex(), " ")
            .trim()
        if (text.length <= maxChars) return text
        val clipped = text.take(maxChars)
        // avoid mid-word cut if possible
        val lastSpace = clipped.lastIndexOf(' ')
        return ((if (lastSpace > 140) clipped.take(lastSpace) else clipped) + "…").trim()
    }
}
