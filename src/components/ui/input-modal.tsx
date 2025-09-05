'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Folder, Edit3 } from 'lucide-react'

interface InputModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (value: string) => void
  title: string
  description?: string
  placeholder?: string
  defaultValue?: string
  confirmText?: string
  cancelText?: string
  type?: 'folder' | 'rename' | 'general'
}

export default function InputModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  placeholder = "Enter name...",
  defaultValue = "",
  confirmText = "Create",
  cancelText = "Cancel",
  type = 'general'
}: InputModalProps) {
  const [inputValue, setInputValue] = useState(defaultValue)

  // Reset input when modal opens/closes or defaultValue changes
  useEffect(() => {
    setInputValue(defaultValue)
  }, [isOpen, defaultValue])

  const handleConfirm = () => {
    const trimmedValue = inputValue.trim()
    if (trimmedValue) {
      onConfirm(trimmedValue)
      onClose()
      setInputValue("")
    }
  }

  const handleCancel = () => {
    onClose()
    setInputValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const getIconColor = () => {
    switch (type) {
      case 'folder':
        return 'text-blue-500'
      case 'rename':
        return 'text-orange-500'
      default:
        return 'text-gray-500'
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'folder':
        return 'from-blue-50 via-blue-25 to-white'
      case 'rename':
        return 'from-orange-50 via-orange-25 to-white'
      default:
        return 'from-gray-50 via-gray-25 to-white'
    }
  }

  const getFloatingIcons = () => {
    if (type === 'general') return null
    
    const IconComponent = type === 'folder' ? Folder : Edit3
    const colorClass = type === 'folder' ? 'text-blue-200' : 'text-orange-200'
    
    return Array.from({ length: 12 }, (_, i) => (
      <IconComponent
        key={i}
        className={`absolute ${colorClass} opacity-30`}
        style={{
          left: `${15 + (i % 4) * 25}%`,
          top: `${20 + Math.floor(i / 4) * 30}%`,
          fontSize: `${1 + (i % 3) * 0.5}rem`,
          animation: `float ${3 + (i % 3)}s infinite ease-in-out`,
          animationDelay: `${i * 0.5}s`,
        }}
      />
    ))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto p-0 overflow-hidden bg-white border-0 shadow-2xl">
        {/* Visually hidden title for accessibility */}
        <DialogTitle className="sr-only">
          {title}
        </DialogTitle>
        
        <style jsx>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px) scale(1);
              opacity: 0.3;
            }
            50% {
              transform: translateY(-20px) scale(1.1);
              opacity: 0.1;
            }
          }
        `}</style>
        
        {/* Background with floating icons */}
        <div className={`relative min-h-[280px] bg-gradient-to-br ${getBackgroundColor()}`}>
          {/* Floating background icons */}
          {(type === 'folder' || type === 'rename') && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {getFloatingIcons()}
            </div>
          )}
          
          {/* Content */}
          <div className="relative z-10 p-8 text-center">
            {/* Main Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center">
                {type === 'folder' ? (
                  <Folder className={`w-8 h-8 ${getIconColor()}`} />
                ) : type === 'rename' ? (
                  <Edit3 className={`w-8 h-8 ${getIconColor()}`} />
                ) : (
                  <div className="w-8 h-8 rounded bg-gray-200"></div>
                )}
              </div>
            </div>
            
            {/* Title */}
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              {title}
            </h2>
            
            {/* Description */}
            {description && (
              <p className="text-gray-600 mb-6 leading-relaxed">
                {description}
              </p>
            )}
            
            {/* Input Field */}
            <div className="mb-8">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="h-12 text-base text-center border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white/90 backdrop-blur-sm shadow-sm"
                autoFocus
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="px-6 h-11 text-gray-600 border-gray-200 hover:bg-gray-50 bg-white/90 backdrop-blur-sm shadow-sm"
              >
                {cancelText}
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={!inputValue.trim()}
                className={`px-6 h-11 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none ${
                  type === 'folder' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : type === 'rename'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
