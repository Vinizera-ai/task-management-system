import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import Header from './Header'
import NotificationPanel from './NotificationPanel'

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-aero">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          onNotificationClick={() => setNotificationPanelOpen(true)}
        />

        {/* Page Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={notificationPanelOpen}
        onClose={() => setNotificationPanelOpen(false)}
      />

      {/* Overlay para mobile quando sidebar está aberta */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default Layout