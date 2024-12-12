import * as path from "node:path"
import type { UserConfig } from "vitest/config"

const alias = (pkg: string, dir = pkg) => {
  const name = pkg === "redux-sonnet" ? "redux-sonnet" : `@redux-sonnet/${pkg}`
  const target = process.env.TEST_DIST !== undefined ? "dist/dist/esm" : "src"
  return ({
    [`${name}/test`]: path.join(__dirname, "packages", dir, "test"),
    [`${name}`]: path.join(__dirname, "packages", dir, target)
  })
}

// This is a workaround, see https://github.com/vitest-dev/vitest/issues/4744
const config: UserConfig = {
  esbuild: {
    target: "es2020"
  },
  test: {
    // onStackTrace: (error, frame) => {
    //   console.error(error)
    //   console.info(frame)
    // },
    setupFiles: [path.join(__dirname, "setupTests.ts")],
    fakeTimers: {
      toFake: undefined
    },
    sequence: {
      concurrent: true
    },
    include: ["test/**/*.test.ts"],
    alias: {
      ...alias("redux-sonnet")
    }
  }
}

export default config
