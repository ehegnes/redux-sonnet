import { useState } from 'react'
import './App.css'
import { useDispatch } from 'react-redux'
import { LOAD_USER_PAGE } from './actions'

function App() {
  const dispatch = useDispatch()

  return (
    <>
      hello world
      <button onClick={() => dispatch(LOAD_USER_PAGE({ login: 'ehegnes', requiredFields: [] }))}>load</button>
    </>
  )
}

export default App
