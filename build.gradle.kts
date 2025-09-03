plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.ktor)
}

group = "com.lizz"
version = "0.0.1"

application {
    mainClass = "io.ktor.server.netty.EngineMain"
}

dependencies {
    implementation(libs.ktor.server.core.jvm)
    implementation(libs.ktor.server.netty)
    implementation(libs.logback)
    implementation(libs.ktor.server.core)
    implementation(libs.ktor.server.config.yaml)

    // Datetime
    implementation(libs.kotlin.datetime)

    // Markdown
    implementation(libs.flexmark)

    // Htmx
    implementation(libs.ktor.htmx)
    implementation(libs.ktor.htmx.html)
    implementation(libs.ktor.server.htmx)
    implementation(libs.ktor.server.html.builder)

    testImplementation(libs.ktor.server.test.host)
    testImplementation(libs.kotlin.test)
}
