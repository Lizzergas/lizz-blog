# Project Guidelines — ktor-pure-htmx

This document records project-specific practices for building, testing, and extending this Ktor + HTMX sample. It assumes familiarity with Kotlin, Gradle, and Ktor 3.x.

## Stack Overview
- Kotlin: 2.2.10 (versions defined in `gradle/libs.versions.toml`)
- Ktor: 3.2.3
- Gradle: via wrapper in repo
- Runtime entrypoint: `io.ktor.server.netty.EngineMain` (configured by Ktor Gradle plugin)
- Application module: `com.lizz.ApplicationKt.module` (wired in `src/main/resources/application.yaml`)
- Logging: Logback (`src/main/resources/logback.xml`)
- UI: HTMX + Tailwind CSS via CDN; server-side HTML via `kotlinx.html` DSL

## Build and Run
The project uses the Ktor Gradle plugin; standard tasks are available via the wrapper.

- Build: `./gradlew build`
- Run (dev): `./gradlew run`
  - Dev mode is enabled via `application.yaml` (`ktor.development: true`). You can also set `-Dio.ktor.development=true`.
- Fat JAR: `./gradlew buildFatJar`
- Docker image: `./gradlew buildImage`
- Run Docker image: `./gradlew runDocker`

Configuration is primarily driven by `src/main/resources/application.yaml`:

```
ktor:
  application:
    modules:
      - com.lizz.ApplicationKt.module
  deployment:
    port: 8080
  development: true
```

To override the port at runtime without editing the file:
- Env var: `KTOR_DEPLOYMENT_PORT=9090 ./gradlew run`
- Or JVM arg: `./gradlew run --args="-port=9090"` (Ktor also recognizes `-P:ktor.deployment.port=9090` style properties when passed as config properties).

Notes:
- The Ktor plugin wires `EngineMain` and picks up `application.yaml` automatically. If you change the module FQN or add modules, update `application.yaml` accordingly.
- Logging level is configured in `logback.xml`. For deeper diagnostics, temporarily change `<root level="INFO">` to `DEBUG`.

## Testing
Dependencies already present:
- `testImplementation(libs.ktor.server.test.host)`
- `testImplementation(libs.kotlin.test)`

Recommended conventions:
- Place tests under `src/test/kotlin`.
- Prefer `testApplication { ... }` from `ktor-server-test-host` for HTTP-level testing without starting a real server.
- Keep production wiring simple: `Application.module()` should install features and call small, focused configuration functions (e.g., `configureRouting()`), making it easy to boot in tests.

Run all tests:
- `./gradlew test`

Run a specific test class/method:
- By class: `./gradlew test --tests 'com.lizz.AppSmokeTest'`
- By method: `./gradlew test --tests 'com.lizz.AppSmokeTest.data endpoint returns dynamic content'`

Increase Gradle log verbosity when debugging CI/test issues:
- `./gradlew test --info` or `--stacktrace`

### Example: Minimal HTTP smoke tests (validated)
The following worked locally against this repository using `ktor-server-test-host`:

```kotlin
class AppSmokeTest {
    @Test
    fun `root page renders HTML with HTMX and Tailwind`() = testApplication {
        application { module() }

        val res = client.get("/")
        assertEquals(HttpStatusCode.OK, res.status)
        val body = res.bodyAsText()
        assertTrue(body.contains("htmx.min.js"), "Expected HTMX script tag")
        assertTrue(body.contains("HTMX + Tailwind + Ktor"), "Expected page title text")
        assertTrue(body.contains("Load Content"), "Expected load button")
    }

    @Test
    fun `data endpoint returns dynamic content`() = testApplication {
        application { module() }

        val res = client.get("/data")
        assertEquals(HttpStatusCode.OK, res.status)
        val body = res.bodyAsText()
        assertTrue(body.contains("Hello from dynamically loaded Ktor content"))
    }
}
```

How to add a new test:
- Create a new `*Test.kt` under `src/test/kotlin` in the `com.lizz` package (or another relevant package).
- Use `testApplication { application { module() } ... }` to hit routes via `client`.
- Assert status codes, headers, and relevant HTML fragments. Since UI is generated with `kotlinx.html`, verifying key text is typically sufficient for server-side correctness.

Tips:
- If your test requires different configuration (e.g., non-default port or features), you can install plugins directly inside the `testApplication` `application {}` block, or load an alternate HOCON/YAML with `createTestEnvironment` and a custom config if needed.
- Avoid network flakiness: `testApplication` runs in-memory; do not start Netty.

## Development Notes & Conventions
- Routing and HTML:
  - HTML is generated with `kotlinx.html` DSL. Keep rendering in small functions to ease reuse and testing.
  - HTMX integration uses `io.ktor.htmx.*` and `io.ktor.htmx.html.*` helpers. Attributes are set through `attributes.hx { ... }`. Example in `Routing.kt` uses `HxSwap.innerHtml` and `get = "/data"`.
  - Tailwind CSS v4 browser CDN is referenced directly. No local node pipeline is used; changes require only server restart (or dev auto-reload) to reflect HTML updates.
- Configuration management:
  - Centralize dependency versions in `gradle/libs.versions.toml` and reference them from `build.gradle.kts` (already in place). Update versions here first to keep plugin and libraries in sync.
  - `application.yaml` is the single source of truth for module wiring. If you add features/modules (e.g., ContentNegotiation, serialization), wire them in `Application.module()` and keep routing in separate functions.
- Logging & troubleshooting:
  - Use Logback config to elevate log levels temporarily.
  - For HTTP debugging in tests, print response bodies if assertions fail. Keep test logs concise in CI to reduce noise.
- Docker:
  - Ktor plugin tasks `buildImage` and `runDocker` require Docker installed and running. The produced image embeds the fat JAR built by `buildFatJar`.

## Verified Commands (on this repo)
- `./gradlew test` — executed successfully; sample tests passed.
- `./gradlew run` — starts server on `http://0.0.0.0:8080` as defined in `application.yaml`.
- `./gradlew build` — standard assemble with tests.

This document is intended to be maintained along with the codebase. Update it when changing build tooling, configuration, or testing practices.
