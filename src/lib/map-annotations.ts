// Maps annotation utilities for handling both JSONB and dedicated table approaches
import { createSupabaseClient } from "@/lib/auth"

export interface MapAnnotations {
  pins: Pin[]
  labels: Label[]
  zones: Zone[]
  measurements: Measurement[]
  decorations: Decoration[]
}

// Types matching the component interfaces
export interface Pin {
  id: string
  type: 'pin'
  x: number
  y: number
  label: string
  description?: string
  color: string
  icon?: string
}

export interface Label {
  id: string
  type: 'label'
  x: number
  y: number
  text: string
  fontSize: number
  color: string
  backgroundColor?: string
  rotation?: number
}

export interface Zone {
  id: string
  type: 'zone'
  points: { x: number; y: number }[]
  fillColor: string
  borderColor: string
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double'
  borderWidth?: number
  opacity: number
}

export interface Measurement {
  id: string
  type: 'measurement'
  measurementType: 'distance' | 'area' | 'perimeter'
  points: { x: number; y: number }[]
  unit: 'px' | 'ft' | 'm' | 'km' | 'mi' | 'custom'
  customUnit?: string
  scale?: number
  color: string
  showLabel: boolean
  labelPosition?: 'auto' | 'start' | 'middle' | 'end'
}

export interface Decoration {
  id: string
  type: 'decoration'
  x: number
  y: number
  shape: string
  size: number
  color: string
  strokeColor?: string
  strokeWidth?: number
  fillOpacity?: number
  strokeOpacity?: number
  rotation?: number
  customSvg?: string
  text?: string
  fontSize?: number
  textColor?: string
  style?: 'solid' | 'dashed' | 'dotted' | 'gradient'
  gradient?: { from: string; to: string; direction: 'horizontal' | 'vertical' | 'radial' }
  shadow?: boolean
  layer?: number
  decorationType?: string
  gridColor?: string
  gridOpacity?: number
  textOverlay?: string
}

export class MapAnnotationsManager {
  private supabase = createSupabaseClient()
  private useTableApproach = false // Set to true to use dedicated tables

  constructor(useTableApproach = false) {
    this.useTableApproach = useTableApproach
  }

  // Load all annotations for a map
  async loadAnnotations(mapId: string): Promise<MapAnnotations> {
    if (this.useTableApproach) {
      return this.loadFromTables(mapId)
    } else {
      return this.loadFromJSON(mapId)
    }
  }

  // Save annotations for a map
  async saveAnnotations(mapId: string, annotations: MapAnnotations): Promise<void> {
    if (this.useTableApproach) {
      return this.saveToTables(mapId, annotations)
    } else {
      return this.saveToJSON(mapId, annotations)
    }
  }

  // JSONB approach - simpler, stores everything in the maps table
  private async loadFromJSON(mapId: string): Promise<MapAnnotations> {
    const { data, error } = await this.supabase
      .from('maps')
      .select('annotations')
      .eq('id', mapId)
      .single()

    if (error) throw error

    return data?.annotations || {
      pins: [],
      labels: [],
      zones: [],
      measurements: [],
      decorations: []
    }
  }

  private async saveToJSON(mapId: string, annotations: MapAnnotations): Promise<void> {
    const { error } = await this.supabase
      .from('maps')
      .update({ annotations })
      .eq('id', mapId)

    if (error) throw error
  }

  // Dedicated tables approach - better performance for complex queries
  private async loadFromTables(mapId: string): Promise<MapAnnotations> {
    const [pins, labels, zones, measurements, decorations] = await Promise.all([
      this.loadPins(mapId),
      this.loadLabels(mapId),
      this.loadZones(mapId),
      this.loadMeasurements(mapId),
      this.loadDecorations(mapId)
    ])

    return { pins, labels, zones, measurements, decorations }
  }

  private async saveToTables(mapId: string, annotations: MapAnnotations): Promise<void> {
    // Note: This is a simplified version. In production, you'd want to handle:
    // - Incremental updates (only changed items)
    // - Conflict resolution
    // - Bulk operations for better performance

    await Promise.all([
      this.savePins(mapId, annotations.pins),
      this.saveLabels(mapId, annotations.labels),
      this.saveZones(mapId, annotations.zones),
      this.saveMeasurements(mapId, annotations.measurements),
      this.saveDecorations(mapId, annotations.decorations)
    ])
  }

  // Helper methods for individual annotation types
  private async loadPins(mapId: string): Promise<Pin[]> {
    const { data, error } = await this.supabase
      .from('map_pins')
      .select('*')
      .eq('map_id', mapId)

    if (error) throw error
    return data?.map(pin => ({
      id: pin.id,
      type: 'pin' as const,
      x: pin.x,
      y: pin.y,
      label: pin.label,
      description: pin.description,
      color: pin.color,
      icon: pin.icon
    })) || []
  }

  private async loadLabels(mapId: string): Promise<Label[]> {
    const { data, error } = await this.supabase
      .from('map_labels')
      .select('*')
      .eq('map_id', mapId)

    if (error) throw error
    return data?.map(label => ({
      id: label.id,
      type: 'label' as const,
      x: label.x,
      y: label.y,
      text: label.text,
      fontSize: label.font_size,
      color: label.color,
      backgroundColor: label.background_color,
      rotation: label.rotation
    })) || []
  }

  private async loadZones(mapId: string): Promise<Zone[]> {
    const { data, error } = await this.supabase
      .from('map_zones')
      .select('*')
      .eq('map_id', mapId)

    if (error) throw error
    return data?.map(zone => ({
      id: zone.id,
      type: 'zone' as const,
      points: zone.points,
      fillColor: zone.fill_color,
      borderColor: zone.border_color,
      borderStyle: zone.border_style,
      borderWidth: zone.border_width,
      opacity: zone.opacity
    })) || []
  }

  private async loadMeasurements(mapId: string): Promise<Measurement[]> {
    const { data, error } = await this.supabase
      .from('map_measurements')
      .select('*')
      .eq('map_id', mapId)

    if (error) throw error
    return data?.map(measurement => ({
      id: measurement.id,
      type: 'measurement' as const,
      measurementType: measurement.measurement_type,
      points: measurement.points,
      unit: measurement.unit,
      customUnit: measurement.custom_unit,
      scale: measurement.scale,
      color: measurement.color,
      showLabel: measurement.show_label,
      labelPosition: measurement.label_position
    })) || []
  }

  private async loadDecorations(mapId: string): Promise<Decoration[]> {
    const { data, error } = await this.supabase
      .from('map_decorations')
      .select('*')
      .eq('map_id', mapId)

    if (error) throw error
    return data?.map(decoration => ({
      id: decoration.id,
      type: 'decoration' as const,
      x: decoration.x,
      y: decoration.y,
      shape: decoration.shape,
      size: decoration.size,
      color: decoration.color,
      strokeColor: decoration.stroke_color,
      strokeWidth: decoration.stroke_width,
      fillOpacity: decoration.fill_opacity,
      strokeOpacity: decoration.stroke_opacity,
      rotation: decoration.rotation,
      customSvg: decoration.custom_svg,
      text: decoration.text,
      fontSize: decoration.font_size,
      textColor: decoration.text_color,
      style: decoration.style,
      gradient: decoration.gradient,
      shadow: decoration.shadow,
      layer: decoration.layer,
      decorationType: decoration.decoration_type,
      gridColor: decoration.grid_color,
      gridOpacity: decoration.grid_opacity,
      textOverlay: decoration.text_overlay
    })) || []
  }

  // Save methods (simplified - in production you'd want more sophisticated upsert logic)
  private async savePins(mapId: string, pins: Pin[]): Promise<void> {
    // Delete existing and insert new (simplified approach)
    await this.supabase.from('map_pins').delete().eq('map_id', mapId)
    
    if (pins.length > 0) {
      const { error } = await this.supabase
        .from('map_pins')
        .insert(pins.map(pin => ({
          id: pin.id,
          map_id: mapId,
          x: pin.x,
          y: pin.y,
          label: pin.label,
          description: pin.description,
          color: pin.color,
          icon: pin.icon
        })))
      
      if (error) throw error
    }
  }

  private async saveLabels(mapId: string, labels: Label[]): Promise<void> {
    await this.supabase.from('map_labels').delete().eq('map_id', mapId)
    
    if (labels.length > 0) {
      const { error } = await this.supabase
        .from('map_labels')
        .insert(labels.map(label => ({
          id: label.id,
          map_id: mapId,
          x: label.x,
          y: label.y,
          text: label.text,
          font_size: label.fontSize,
          color: label.color,
          background_color: label.backgroundColor,
          rotation: label.rotation
        })))
      
      if (error) throw error
    }
  }

  private async saveZones(mapId: string, zones: Zone[]): Promise<void> {
    await this.supabase.from('map_zones').delete().eq('map_id', mapId)
    
    if (zones.length > 0) {
      const { error } = await this.supabase
        .from('map_zones')
        .insert(zones.map(zone => ({
          id: zone.id,
          map_id: mapId,
          points: zone.points,
          fill_color: zone.fillColor,
          border_color: zone.borderColor,
          border_style: zone.borderStyle,
          border_width: zone.borderWidth,
          opacity: zone.opacity
        })))
      
      if (error) throw error
    }
  }

  private async saveMeasurements(mapId: string, measurements: Measurement[]): Promise<void> {
    await this.supabase.from('map_measurements').delete().eq('map_id', mapId)
    
    if (measurements.length > 0) {
      const { error } = await this.supabase
        .from('map_measurements')
        .insert(measurements.map(measurement => ({
          id: measurement.id,
          map_id: mapId,
          measurement_type: measurement.measurementType,
          points: measurement.points,
          unit: measurement.unit,
          custom_unit: measurement.customUnit,
          scale: measurement.scale,
          color: measurement.color,
          show_label: measurement.showLabel,
          label_position: measurement.labelPosition
        })))
      
      if (error) throw error
    }
  }

  private async saveDecorations(mapId: string, decorations: Decoration[]): Promise<void> {
    await this.supabase.from('map_decorations').delete().eq('map_id', mapId)
    
    if (decorations.length > 0) {
      const { error } = await this.supabase
        .from('map_decorations')
        .insert(decorations.map(decoration => ({
          id: decoration.id,
          map_id: mapId,
          x: decoration.x,
          y: decoration.y,
          shape: decoration.shape,
          size: decoration.size,
          color: decoration.color,
          stroke_color: decoration.strokeColor,
          stroke_width: decoration.strokeWidth,
          fill_opacity: decoration.fillOpacity,
          stroke_opacity: decoration.strokeOpacity,
          rotation: decoration.rotation,
          custom_svg: decoration.customSvg,
          text: decoration.text,
          font_size: decoration.fontSize,
          text_color: decoration.textColor,
          style: decoration.style,
          gradient: decoration.gradient,
          shadow: decoration.shadow,
          layer: decoration.layer,
          decoration_type: decoration.decorationType,
          grid_color: decoration.gridColor,
          grid_opacity: decoration.gridOpacity,
          text_overlay: decoration.textOverlay
        })))
      
      if (error) throw error
    }
  }
}