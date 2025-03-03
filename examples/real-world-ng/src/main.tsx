import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createStore } from "./store/store.js"
import { Provider } from "react-redux"
import App from "./App.jsx"
import "./index.css"

const container = document.getElementById("root")

const store = createStore()

if (container) {
  const root = createRoot(container)

  root.render(
    <StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </StrictMode>,
  )
}
