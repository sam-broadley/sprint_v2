import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import StoreHome from './pages/StoreHome'
import DesignPage from './pages/DesignPage'
import DesignsPage from './pages/DesignsPage'
import './index.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/:storeSlug/design/:designSlug" element={
            <Layout>
              <DesignPage />
            </Layout>
          } />
          <Route path="/:storeSlug/designs" element={
            <Layout>
              <DesignsPage />
            </Layout>
          } />
          <Route path="/:storeSlug" element={
            <Layout>
              <StoreHome />
            </Layout>
          } />
          <Route path="/" element={<Navigate to="/haloprintco" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App 