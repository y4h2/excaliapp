// Fix for Excalidraw trying to access Node.js globals
if (typeof window !== 'undefined') {
  if (!(window as any).process) {
    (window as any).process = {
      env: {},
      version: '',
      platform: 'browser'
    } as any
  }
  if (!(window as any).global) {
    (window as any).global = window
  }
}

import React from 'react'
import {createRoot} from 'react-dom/client'
import App from './App'

const container = document.getElementById('root')

const root = createRoot(container!)

root.render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>
)
