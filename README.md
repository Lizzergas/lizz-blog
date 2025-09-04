# Lizz's Blog Engine

A modern, animated, and component-based blog engine built with Ktor, htmx, and Tailwind CSS. This project uses server-side rendering with `kotlinx.html` to create a fast and dynamic user experience.

## Features

*   **Backend**: [Ktor](https://ktor.io/) for handling routes and server logic.
*   **Frontend**: [htmx](https://htmx.org/) for seamless AJAX-powered navigation without writing complex JavaScript.
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) (via the JIT CDN) for rapid, utility-first styling.
*   **Templating**: [kotlinx.html](https://github.com/Kotlin/kotlinx.html) for type-safe, server-side HTML rendering.
*   **Animations**: Smooth page transitions via the View Transitions API and custom CSS animations for a retro, terminal-like aesthetic.
*   **Content**: Blog posts are written in Markdown and loaded dynamically.

## Project Structure

The project is organized into a component-based and page-based architecture to promote reusability and separation of concerns.

```
/
├── build.gradle.kts        # Project dependencies and build configuration
├── src/
│   ├── main/
│   │   ├── kotlin/com/lizz/
│   │   │   ├── Application.kt  # Main Ktor application setup
│   │   │   ├── Blog.kt         # BlogService for loading and parsing Markdown posts
│   │   │   ├── Components.kt   # Shared, reusable UI components (the design system)
│   │   │   ├── Routing.kt      # Defines all application routes
│   │   │   └── pages/          # Contains the rendering logic for each page
│   │   │       ├── AboutPage.kt
│   │   │       ├── BlogPage.kt
│   │   │       ├── IndexPage.kt
│   │   │       └── TestPage.kt
│   │   └── resources/
│   │       ├── application.yaml # Ktor configuration
│   │       ├── blogs/           # Markdown content for blog posts
│   │       │   └── _index.txt   # Index of blog posts to load
│   │       └── static/
│   │           ├── style.css    # Custom CSS for animations and styling
│   │           └── favicon.png
│   └── test/
└── README.md               # This file
```

## How It Works

The application follows a simple request-response cycle, with the frontend enhanced by htmx.

1.  A user requests a URL (e.g., `/`).
2.  Ktor's routing mechanism in `Routing.kt` maps the URL to a handler function (e.g., `call.respondIndexPage()`).
3.  The handler function, located in the `pages/` directory, is called.
4.  This function uses UI components from `Components.kt` and `kotlinx.html` to build the HTML page server-side.
5.  The complete HTML page is sent to the browser.
6.  `htmx` intercepts clicks on links. Instead of a full page reload, it fetches the new page via AJAX and smoothly swaps the `<body>` content. The View Transitions API, enabled via `hx-ext="view-transitions"`, handles the animation.

## Development Guide

This project is designed to be easy to extend. Here’s how to add new components and pages.

### How to Create a New Component

Components are reusable pieces of UI defined as Kotlin extension functions in `src/main/kotlin/com/lizz/Components.kt`.

1.  **Open `Components.kt`**.
2.  **Create a new `internal` function**. Most components will be extensions on `FlowContent`, which allows them to be used inside most HTML tags (like `div`).
3.  **Example**: Let's create a simple alert box component.

    ```kotlin
    // In Components.kt
    internal fun FlowContent.alert(message: String, level: String = "info") {
        val colorClasses = when (level) {
            "success" -> "bg-emerald-900 border-emerald-700 text-emerald-300"
            "error" -> "bg-red-900 border-red-700 text-red-300"
            else -> "bg-sky-900 border-sky-700 text-sky-300"
        }
        div(classes = "border rounded-lg p-4 $colorClasses") {
            +message
        }
    }
    ```
4.  **Use the component** in any page file: `alert("This is an informational message.")`

### How to Create a New Page

1.  **Create a new page file** in `src/main/kotlin/com/lizz/pages/`. For example, `ContactPage.kt`.
2.  **Define a handler function** inside the new file. This function should be an extension on `ApplicationCall`.

    ```kotlin
    // In pages/ContactPage.kt
    package com.lizz.pages

    import com.lizz.*
    import io.ktor.server.application.*
    import io.ktor.server.html.*

    internal suspend fun ApplicationCall.respondContactPage() {
        respondHtml {
            page(this@respondContactPage, "Contact • lizz.dev") {
                mainContent {
                    pageHeader("Contact Me")
                    p(classes = "mt-4 text-neutral-300") {
                        +"You can reach me via email."
                    }
                }
            }
        }
    }
    ```
3.  **Register the new route** in `src/main/kotlin/com/lizz/Routing.kt`.

    ```kotlin
    // In Routing.kt
    import com.lizz.pages.respondContactPage // Add this import

    // ... inside configureRouting -> routing
    get("/contact") {
        call.respondContactPage()
    }
    ```

### How to Write a New Blog Post

1.  Create a new Markdown file in `src/main/resources/blogs/`.
2.  The filename **must** follow the format `YYYY-MM-DD-your-post-slug.md`.
3.  The first H1 heading (`# My Post Title`) in the file will be used as the post title.
4.  Add the new filename (e.g., `2025-09-05-my-new-post.md`) to a new line in `src/main/resources/blogs/_index.txt`. This tells the `BlogService` to load it.

## Building & Running

To build or run the project, use the corresponding Gradle tasks.

| Task          | Description                                 |
|---------------|---------------------------------------------|
| `./gradlew run` | Run the application locally.                |
| `./gradlew test`  | Run the tests.                              |
| `./gradlew build` | Build the project and create artifacts.   |

The server will start on `http://0.0.0.0:8080`.