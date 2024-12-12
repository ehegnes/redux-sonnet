---
title: Actions.ts
description: This module provides utility for creating custom Redux actions.
sidebar:
  order: 1
tableOfContents:
  minHeadingLevel: 1
---

This module provides utility for creating custom Redux actions.

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_

# constructors

## make

Constructs trigger, fulfillment, and rejection actions based on a prefix.

**Signature**

```ts
export declare const make: <Prefix extends string>(
  prefix: Prefix
) => <
  TriggerPayload = void,
  FulfilledPayload = void,
  RejectedPayload = void
>() => AsyncActionSet<
  Prefix,
  TriggerPayload,
  FulfilledPayload,
  RejectedPayload
>
```

**Example**

```ts twoslash
/// <reference types="effect" />
/// <reference types="@reduxjs/toolkit" />
/// <reference types="redux" />
// @paths: {"redux-sonnet": ["../packages/redux-sonnet/src"], "redux-sonnet/*": ["../packages/redux-sonnet/src/*"]}

import * as assert from "node:assert"
// ---cut---
import * as Actions from "redux-sonnet/Actions"

const { fulfilled, rejected, trigger } = Actions.make("increment")<
  void,
  void,
  never
>()

assert.strictEqual(trigger.type, "increment/trigger")
assert.strictEqual(fulfilled.type, "increment/fulfilled")
assert.strictEqual(rejected.type, "increment/rejected")
```

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_

# models

## AsyncActionSet (interface)

**Signature**

```ts
export interface AsyncActionSet<
  Prefix extends string,
  TriggerPayload = void,
  FulfilledPayload = void,
  RejectedPayload = void
> {
  trigger: PayloadActionCreator<TriggerPayload, `${Prefix}/trigger`>
  fulfilled: PayloadActionCreator<FulfilledPayload, `${Prefix}/fulfilled`>
  rejected: PayloadActionCreator<RejectedPayload, `${Prefix}/rejected`>
}
```

_Added in [v0.0.0](https://github.com/ehegnes/redux-sonnet/releases/tag/v0.0.0)_
