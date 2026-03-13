import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'




/*The entry point of the CCTV Design Tool frontend application. It renders the App component, which contains the routing and main logic for the application.
*/

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
