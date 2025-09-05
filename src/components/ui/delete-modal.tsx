'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, Trash2 } from 'lucide-react'

interface DeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  itemName?: string
  type?: 'folder' | 'element' | 'chapter' | 'general'
  confirmText?: string
  cancelText?: string
}

export default function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  type = 'general',
  confirmText = 'Delete',
  cancelText = 'Cancel'
}: DeleteModalProps) {
  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const getDefaultDescription = () => {
    if (description) return description
    
    switch (type) {
      case 'folder':
        return itemName 
          ? `Are you sure you want to delete the folder "${itemName}" and all its contents? This action cannot be undone and all elements within this folder will be permanently lost.`
          : 'Are you sure you want to delete this folder and all its contents? This action cannot be undone.'
      case 'chapter':
        return itemName
          ? `Are you sure you want to delete the chapter "${itemName}"? This action cannot be undone and all content will be permanently lost.`
          : 'Are you sure you want to delete this chapter? This action cannot be undone.'
      case 'element':
        return itemName
          ? `Are you sure you want to delete "${itemName}"? This action cannot be undone and this element will be permanently removed.`
          : 'Are you sure you want to delete this element? This action cannot be undone.'
      default:
        return 'Are you sure you want to delete this item? This action cannot be undone.'
    }
  }

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-lg flex items-center justify-center z-50 overflow-hidden">
      {/* Flowing recycle bins animation - bottom to top */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Large bins */}
        <div className="absolute left-1/4 w-8 h-8 text-red-400/60 animate-float-up-wiggle" style={{ animationDelay: '0s', animationDuration: '6s', filter: 'drop-shadow(0 0 8px rgba(248, 113, 113, 0.6))' }}>
          <Trash2 className="w-full h-full" />
        </div>
        <div className="absolute right-1/3 w-10 h-10 text-red-500/50 animate-float-up" style={{ animationDelay: '1.5s', animationDuration: '7s', filter: 'drop-shadow(0 0 12px rgba(239, 68, 68, 0.7))' }}>
          <Trash2 className="w-full h-full" />
        </div>
        
        {/* Medium bins */}
        <div className="absolute left-1/6 w-6 h-6 text-red-400/40 animate-float-up" style={{ animationDelay: '0.8s', animationDuration: '5.5s', filter: 'drop-shadow(0 0 6px rgba(248, 113, 113, 0.4))' }}>
          <Trash2 className="w-full h-full" />
        </div>
        <div className="absolute right-1/4 w-7 h-7 text-red-500/45 animate-float-up-wiggle" style={{ animationDelay: '2.2s', animationDuration: '6.5s', filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.5))' }}>
          <Trash2 className="w-full h-full" />
        </div>
        <div className="absolute left-1/2 w-6 h-6 text-red-400/35 animate-float-up" style={{ animationDelay: '3s', animationDuration: '5s', filter: 'drop-shadow(0 0 6px rgba(248, 113, 113, 0.4))' }}>
          <Trash2 className="w-full h-full" />
        </div>
        
        {/* Small bins */}
        <div className="absolute left-1/3 w-4 h-4 text-red-300/50 animate-float-up-wiggle" style={{ animationDelay: '0.3s', animationDuration: '4.5s', filter: 'drop-shadow(0 0 4px rgba(252, 165, 165, 0.6))' }}>
          <Trash2 className="w-full h-full" />
        </div>
        <div className="absolute right-1/6 w-5 h-5 text-red-400/30 animate-float-up" style={{ animationDelay: '1.8s', animationDuration: '5.8s', filter: 'drop-shadow(0 0 5px rgba(248, 113, 113, 0.3))' }}>
          <Trash2 className="w-full h-full" />
        </div>
        <div className="absolute right-1/2 w-4 h-4 text-red-300/40 animate-float-up-wiggle" style={{ animationDelay: '2.5s', animationDuration: '4.2s', filter: 'drop-shadow(0 0 4px rgba(252, 165, 165, 0.5))' }}>
          <Trash2 className="w-full h-full" />
        </div>
      </div>
      
      <div className="bg-white/60 backdrop-blur-2xl border border-white/20 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl relative z-10">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">
          {getDefaultDescription()}
        </p>
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleConfirm}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {confirmText}
          </Button>
        </div>
      </div>
      
      {/* Add the required CSS animations in a style tag */}
      <style jsx>{`
        @keyframes float-up {
          from {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          to {
            transform: translateY(-20vh) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes float-up-wiggle {
          from {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          25% {
            transform: translateY(75vh) rotate(90deg) translateX(10px);
          }
          50% {
            transform: translateY(50vh) rotate(180deg) translateX(-10px);
          }
          75% {
            transform: translateY(25vh) rotate(270deg) translateX(10px);
          }
          90% {
            opacity: 1;
          }
          to {
            transform: translateY(-20vh) rotate(360deg);
            opacity: 0;
          }
        }
        
        .animate-float-up {
          animation: float-up infinite linear;
        }
        
        .animate-float-up-wiggle {
          animation: float-up-wiggle infinite linear;
        }
      `}</style>
    </div>
  )
}
