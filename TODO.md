# TODO

## Core Decisions
- [ ] Make arguments to `Middleware.run()` variadic

## Undecided Considerations
- [x] Decide if `Sonnet` should be a subtype of `Effect` or just an alias (i.e.
is opaqueness important?)
  This makes no sense anyway, since the type goes back to being an `Effect` if
  layers are to be provisioned per-Sonnet.
- [ ] How to submit an empty action in a `Sonnet`?
- [ ] Can the data structures be reduced?
- [ ] Should web worker pool or clustering be implemented?

## Testing
- [ ] Backpressure behaviors
- [ ] `PubSub` replay behavior
