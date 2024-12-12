import markdown from "eslint-plugin-markdown"
import baseConfig from "../eslint.config.mjs"

/** @type {import("eslint").Linter.Config} */
export default [
  // add more generic rule sets here, such as:
  // js.configs.recommended,
  ...baseConfig.slice(1),
  ...markdown.configs.recommended,
  {
    rules: {
      // override/add rules settings here, such as:
      // "astro/no-set-html-directive": "error"
    }
  }
]
