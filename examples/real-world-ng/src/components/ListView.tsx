import { ReactNode } from "react"
import * as I from "effect/Iterable"

interface ListProps<T> {
  loadingLabel: string
  pageCount: number | undefined
  renderItem: (_: T) => ReactNode
  items: T[]
  isFetching: boolean
  onLoadMoreClick: () => void
  nextPageUrl: string | undefined
}

export const ListView = <T,>(props: ListProps<T>) => {
  const renderLoadMore = () => {
    const { isFetching, onLoadMoreClick } = props
    return (
      <button
        style={{ fontSize: "150%" }}
        onClick={onLoadMoreClick}
        disabled={isFetching}
      >
        {isFetching ? "Loading..." : "Load More"}
      </button>
    )
  }

  const {
    isFetching = true,
    nextPageUrl,
    pageCount,
    items,
    renderItem,
    loadingLabel = "Loading...",
  } = props

  const isEmpty = items.length === 0
  if (isEmpty && isFetching) {
    return (
      <h2>
        <i>{loadingLabel}</i>
      </h2>
    )
  }

  const isLastPage = !nextPageUrl
  if (isEmpty && isLastPage) {
    return (
      <h1>
        <i>Nothing here!</i>
      </h1>
    )
  }

  return (
    <div>
      {I.map(items, renderItem)}
      {(pageCount ?? 0) > 0 && !isLastPage && renderLoadMore()}
    </div>
  )
}
