---
title: Middleware Usage
description: An introductory guide to Redux Sonnet middleware usage with Redux.
---

## Declaring Side-effect Handlers

`Sonnet`s immediately execute the provided root [`Stanza`][stanza] in a forking
manner. `Stanza`s must be declared as part of `Sonnet` instantiation.

```ts twoslash
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="effect" />
/// <reference types="redux" />
// @paths: {"redux-sonnet": ["../packages/redux-sonnet/src"], "redux-sonnet/*": ["../packages/redux-sonnet/src/*"]}
// ---cut---
import { Effect } from "effect"
import { Sonnet } from "redux-sonnet"

declare const initialize: Effect.Effect<void>
declare const watchThingOne: Effect.Effect<void>
declare const watchThingTwo: Effect.Effect<void>

/**
 * Run `initialize` first, and then run `watchThingOne` and `watchThingTwo`
 * concurrently.
 */
const rootStanza = initialize.pipe(
  Effect.andThen(() =>
    Effect.all([
      watchThingOne,
      watchThingTwo
    ], {
      discard: true,
      concurrency: "unbounded"
    })
  )
)

// @errors: 2345
const sonnet = Sonnet.make(
  rootStanza,
  Sonnet.defaultLayer
)
```

## Deciding Data Structures

`Sonnet`s accept a [`Layer`][layer] which describes the data structures used to
communicate between side-effect declarations (`Stanza`s) and the Redux dispatcher.

Data structures are modeled as such:
* Actions -- A [`Queue`][queue] which has configurable capacity and bounding behaviors.
* Reducer State -- A [`SynchronizedRef`][synchronizedref] which has current
  value exposed as well as a `Stream` of its changes over time.
* Dispatch Actions -- An unbounded `Queue`.
  <sup>* this needs consideration</sup>
### Default 

```ts twoslash {3}
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="effect" />
/// <reference types="redux" />
// @paths: {"redux-sonnet": ["../packages/redux-sonnet/src"], "redux-sonnet/*": ["../packages/redux-sonnet/src/*"]}
import { Effect } from "effect"
import { Sonnet } from "redux-sonnet"
// ---cut---
// @errors: 2345
const sonnet = Sonnet.make(
  Effect.void,
  Sonnet.defaultLayer
  //      ^?
)
```

### Configurable

```ts twoslash {3-9}
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="effect" />
/// <reference types="redux" />
// @paths: {"redux-sonnet": ["../packages/redux-sonnet/src"], "redux-sonnet/*": ["../packages/redux-sonnet/src/*"]}
import { Effect } from "effect"
import { Sonnet } from "redux-sonnet"
// ---cut---
// @errors: 2345
const sonnet = Sonnet.make(
  Effect.void,
  Sonnet.layer({
    replay: 8,
    // ^?
    backing: {
      // ^?
      strategy: "bounded",
      capacity: 8
    }
  })
)
```

### Advanced

Any Effect service which satisfies `Sonnet.Service` may be constructed manually.

See [`Sonnet.Service`][sonnet.service] for reference.

## Adding to Redux

### With `@reduxjs/toolkit`
```ts twoslash
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="effect" />
/// <reference types="@reduxjs/toolkit" />
// @paths: {"redux-sonnet": ["../packages/redux-sonnet/src"], "redux-sonnet/*": ["../packages/redux-sonnet/src/*"]}
import { configureStore, Tuple } from "@reduxjs/toolkit"
import { Effect } from "effect"
import { Sonnet } from "redux-sonnet"
// ---cut---
const sonnet = Sonnet.make(
  Effect.void,
  Sonnet.defaultLayer
)

// @errors: 2345
const store = configureStore({
  //  ^?
  reducer: () => {},
  middleware: () => new Tuple(sonnet)
})
```

### With `redux`
```ts twoslash
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="effect" />
/// <reference types="redux" />
// @paths: {"redux-sonnet": ["../packages/redux-sonnet/src"], "redux-sonnet/*": ["../packages/redux-sonnet/src/*"]}
import { Effect } from "effect"
import { applyMiddleware, createStore } from "redux"
import { Sonnet } from "redux-sonnet"
// ---cut---
const sonnet = Sonnet.make(
  Effect.void,
  Sonnet.defaultLayer
)

// @errors: 2345
const store = applyMiddleware(sonnet)(createStore)(() => {})
//    ^?
```

## Provisioning Resources

Side-effect handlers, or `Stanza`s, are resourceful, meaning they can
request fulfillment of some set of services.

### Layers

The second argument to `Sonnet.make()` is a `Layer` comprising the resources
available to running side-effect handlers. See the below example for usage
guidance. Note that `SonnetService` must be provisioned for all `Sonnet`
instantiations.

### Re-using a `ManagedRuntime`

If the integrating application already makes use of a
[`ManagedRuntime`][managedruntime], a `MemoMap` may be provided at Sonnet
instantiation to facilitate [layer memoization][layer-memoization].

```ts twoslash
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="effect" />
/// <reference types="redux" />
// @paths: {"redux-sonnet": ["../packages/redux-sonnet/src"], "redux-sonnet/*": ["../packages/redux-sonnet/src/*"]}
// ---cut---
import { Context, Effect, Layer, ManagedRuntime } from "effect"
import { Sonnet } from "redux-sonnet"

class MyService extends Context.Tag("MyService")<
  MyService,
  { readonly _: Effect.Effect<unknown> }
>() {}

const layer = Layer.succeed(
  MyService,
  { _: Effect.succeed(void 0) }
)

const existingRuntime = ManagedRuntime.make(layer)
//    ^?

// @errors: 2304
const sonnet = Sonnet.make(
  //  ^?
  Effect.void,
  Layer.mergeAll(
    layer,
    Sonnet.defaultLayer
  ),
  existingRuntime.memoMap
  //              ^?
)
```

## Cleanup

> **TODO:** Unit test and document runtime disposal.

[stanza]: https://ehegnes.github.io/redux-sonnet/docs/getting-stared/what-is-a-stanza
[layer-memoization]: https://effect.website/docs/requirements-management/layer-memoization/
[managedruntime]: https://effect.website/docs/runtime/#managedruntime
[queue]: https://effect.website/docs/concurrency/queue/
[synchronizedref]: https://effect.website/docs/state-management/synchronizedref/
[layer]: https://effect.website/docs/requirements-management/layers
[sonnet.service]: /redux-sonnet/api/redux-sonnet/sonnetts/#service-interface