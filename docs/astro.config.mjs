// @ts-check
import starlight from "@astrojs/starlight"
import { defineConfig } from "astro/config"
import ecTwoSlash from "expressive-code-twoslash"
import catppuccin from "starlight-theme-catppuccin"

// https://astro.build/config
export default defineConfig({
  site: "https://ehegnes.github.io",
  base: "redux-sonnet",
  integrations: [
    starlight({
      logo: {
        light: "./src/assets/logo-light.svg",
        dark: "./src/assets/logo-dark.svg"
      },
      expressiveCode: {
        themes: ["catppuccin-latte", "catppuccin-mocha"],
        plugins: [
          ecTwoSlash()
        ]
      },
      customCss: [
        "@fontsource/nunito-sans",
        "@fontsource/dejavu-mono",
        "./src/styles/font.css"
      ],
      title: "Redux Sonnet",
      social: {
        github: "https://github.com/ehegnes/redux-sonnet"
      },
      sidebar: [
        {
          label: "Getting Started",
          items: [
            {
              label: "Introduction",
              slug: "docs/getting-started/introduction"
            },
            {
              label: "Why Redux Sonnet?",
              slug: "docs/getting-started/why-redux-sonnet"
            },
            {
              label: "Installation",
              slug: "docs/getting-started/installation"
            },
            {
              label: "Middleware Usage",
              slug: "docs/getting-started/middleware-usage"
            },
            {
              label: "What is a Stanza?",
              slug: "docs/getting-started/what-is-a-stanza"
            },
            {
              label: "Error Handling",
              slug: "docs/getting-started/error-handling"
            }
          ]
        },
        {
          label: "Migrating from Redux Saga",
          autogenerate: { directory: "docs/migrating/from-redux-saga" }
        },
        {
          label: "Migrating from Redux Observable",
          autogenerate: { directory: "docs/migrating/from-redux-observable" }
        },
        {
          label: "API",
          autogenerate: { directory: "api" }
        }
      ],
      plugins: [
        catppuccin({ dark: "mocha-mauve", light: "latte-flamingo" })
      ]
    })
  ]
})
