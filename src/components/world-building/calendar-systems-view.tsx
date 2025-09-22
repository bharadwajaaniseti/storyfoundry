import React, { useState } from 'react'
import { CalendarIcon, Settings, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CalendarSystemsViewProps {
  selectedCalendarType: 'default' | 'custom' | null
  setSelectedCalendarType: (type: 'default' | 'custom' | null) => void
  newCalendarName: string
  setNewCalendarName: (name: string) => void
  onCreateNew: () => void
  onSelect: (system: any) => void
  onBack: () => void
  existingCalendarSystems?: any[]
  activeCalendarSystem?: any
}

export default function CalendarSystemsView({
  selectedCalendarType,
  setSelectedCalendarType,
  newCalendarName,
  setNewCalendarName,
  onCreateNew,
  onSelect,
  onBack,
  existingCalendarSystems = [],
  activeCalendarSystem
}: CalendarSystemsViewProps) {

  const handleReset = () => {
    setSelectedCalendarType(null)
    setNewCalendarName('')
  }

  // If there are existing calendar systems, show them first
  if (existingCalendarSystems.length > 0 && !selectedCalendarType) {
    return (
      <div className="h-full bg-white flex items-center justify-center">
        <div className="text-center space-y-12 max-w-4xl mx-auto px-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">Calendar Systems</h1>
            <p className="text-xl text-gray-600">
              Select a calendar system or create a new one
            </p>
          </div>

          {/* Existing Calendar Systems */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">Existing Calendar Systems</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {existingCalendarSystems.map((system) => (
                <button
                  key={system.id}
                  onClick={() => onSelect(system)}
                  className={`group relative overflow-hidden border rounded-xl p-6 transition-all duration-300 hover:scale-105 ${
                    activeCalendarSystem?.id === system.id
                      ? 'bg-orange-50 border-orange-500 text-orange-900'
                      : 'bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className="relative z-10">
                    <CalendarIcon className={`w-12 h-12 mx-auto mb-3 ${
                      activeCalendarSystem?.id === system.id ? 'text-orange-500' : 'text-gray-500'
                    }`} />
                    <h3 className="text-xl font-bold mb-2">{system.name}</h3>
                    <p className="text-gray-600 text-sm">
                      {system.description || 'Custom calendar system'}
                    </p>
                    {activeCalendarSystem?.id === system.id && (
                      <div className="mt-3 text-orange-600 text-sm font-medium">
                        ✓ Currently Active
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Create New Button */}
            <div className="pt-6 border-t border-gray-200">
              <Button
                onClick={() => setSelectedCalendarType('custom')}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 text-lg"
              >
                + Create New Calendar System
              </Button>
            </div>
          </div>

          {/* Back Button */}
          <div className="pt-6">
            <Button variant="outline" onClick={onBack} className="px-8 py-3">
              Back to Calendar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white flex items-center justify-center">
      <div className="text-center space-y-12 max-w-2xl mx-auto px-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Choose Calendar Type</h1>
          <p className="text-xl text-gray-600">
            Select how you want to manage time in your story
          </p>
        </div>

        {!selectedCalendarType ? (
          // Calendar Type Selection
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Default Calendar Button */}
              <button
                onClick={() => setSelectedCalendarType('default')}
                className="group relative overflow-hidden bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-orange-500 rounded-xl p-8 transition-all duration-300 hover:scale-105"
              >
                <div className="relative z-10">
                  <CalendarIcon className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Default Calendar</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Use Earth-like calendar system with 12 months, weeks, and standard time
                  </p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>

              {/* Custom Calendar Button */}
              <button
                onClick={() => setSelectedCalendarType('custom')}
                className="group relative overflow-hidden bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-purple-500 rounded-xl p-8 transition-all duration-300 hover:scale-105"
              >
                <div className="relative z-10">
                  <Settings className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Custom Calendar</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Create your own calendar with custom eras, months, moons, and seasons
                  </p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </div>
        ) : (
          // Calendar Name Input & Configuration
          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">
                {selectedCalendarType === 'default' ? 'Default Calendar' : 'Custom Calendar'}
              </h2>
              
              {/* Calendar Name Input */}
              <div className="space-y-3">
                <Label className="text-lg font-medium text-gray-700">Calendar Name</Label>
                <Input
                  value={newCalendarName}
                  onChange={(e) => setNewCalendarName(e.target.value)}
                  placeholder={selectedCalendarType === 'default' ? 'Standard Calendar' : 'Enter calendar name...'}
                  className="text-xl p-6 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>

              {selectedCalendarType === 'default' && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <p className="text-gray-700 text-center">
                    🌍 Earth-like calendar with 12 months, 7-day weeks, and standard seasons
                  </p>
                </div>
              )}

              {selectedCalendarType === 'custom' && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <p className="text-gray-700 text-center">
                    ⚡ Create a unique calendar system with custom months, moons, and seasons
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-6">
              <Button 
                variant="outline"
                onClick={handleReset}
                className="px-8 py-4 text-lg bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              >
                Back
              </Button>
              <Button 
                onClick={onCreateNew}
                disabled={!newCalendarName.trim()}
                className="px-12 py-4 text-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Create Calendar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}