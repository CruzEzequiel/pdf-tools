import { BrowserRouter as Router } from 'react-router-dom'
import AppRoutes from './presentation/routes/routes'

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}

export default App
