import { assert, describe, it } from "@effect/vitest"
import { createAction, isAction, isActionCreator } from "@reduxjs/toolkit"
import { Actions } from "redux-sonnet"

describe("Actions", () => {
  it("is congruous with createAction", () => {
    const prefix = "action" as const
    const trigger = createAction(`${prefix}/trigger`)
    const fulfilled = createAction(`${prefix}/fulfilled`)
    const rejected = createAction(`${prefix}/rejected`)

    const actual = Actions.make(prefix)<void, void, void>()

    assert.deepStrictEqual(trigger.toString(), actual.trigger.toString())
    assert.deepStrictEqual(fulfilled.toString(), actual.fulfilled.toString())
    assert.deepStrictEqual(rejected.toString(), actual.rejected.toString())
    assert.isTrue(isActionCreator(actual.trigger))
    assert.isTrue(isActionCreator(actual.fulfilled))
    assert.isTrue(isActionCreator(actual.rejected))
    assert.isTrue(isAction(actual.trigger()))
    assert.isTrue(isAction(actual.fulfilled()))
    assert.isTrue(isAction(actual.rejected()))
  })
})
