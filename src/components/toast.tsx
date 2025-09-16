'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  show: (message: string, type?: ToastType, timeout?: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((message: string, type: ToastType = 'info', timeout = 4000) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts((t) => [...t, { id, type, message }])
    setTimeout(() => {
      setToasts((t) => t.filter(x => x.id !== id))
    }, timeout)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div aria-live="polite" className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
        {toasts.map((t) => (
          <div key={t.id} className={`max-w-sm w-full p-3 rounded-lg shadow-lg text-white font-medium ${t.type === 'success' ? 'bg-green-500' : t.type === 'error' ? 'bg-red-500' : 'bg-gray-800'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
