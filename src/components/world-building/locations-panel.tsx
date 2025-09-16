"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Plus, Search, MapPin, Edit3, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { createSupabaseClient } from "@/lib/auth";

/**
 * FIX: Input losing focus inside modal was caused by declaring the modal
 * component (AttributePicker) inside the parent component. That creates a new
 * component type on every parent render, causing React to unmount/remount the
 * dialog contents on each keystroke. 
 *
 * Solution: Move AttributePicker (and Field) to top-level components with
 * stable identities, and pass state via props. This preserves focus.
 */

/** ---------------- Attribute Catalog ---------------- */
const ATTRIBUTE_DEFS = {
  basic_information: [
    { id: "area", label: "Area", type: "Number" },
    { id: "ethnic_groups", label: "Ethnic Groups", type: "Multi-Text" },
    { id: "languages", label: "Languages", type: "Multi-Text" },
    { id: "population", label: "Population", type: "Number" },
    { id: "average_temperature", label: "Average Temperature", type: "Number" },
    { id: "biome", label: "Biome", type: "Multi-Text" },
    { id: "natural_resources", label: "Natural Resources", type: "Multi-Text" },
    { id: "aliases", label: "Aliases", type: "Multi-Text" },
  ],
  location_details: [
    { id: "location_type", label: "Location Type", type: "Multi-Text" },
    { id: "location_age", label: "Location Age", type: "Number" },
    { id: "created_built_by", label: "Created/Built by", type: "Multi-Text" },
    { id: "date_created_built", label: "Date Created/Built", type: "Text" },
    { id: "purpose_of_construction", label: "Purpose of Construction", type: "Text" },
  ],
  demographics: [
    { id: "dominant_cultures", label: "Dominant Cultures", type: "Multi-Text" },
    { id: "religions", label: "Religions", type: "Multi-Text" },
    { id: "migration_trends", label: "Migration Trends", type: "Multi-Text" },
  ],
  economy: [
    { id: "primary_industries", label: "Primary Industries", type: "Multi-Text" },
    { id: "currency", label: "Currency", type: "Text" },
    { id: "gdp_estimate", label: "GDP Estimate", type: "Number" },
  ],
  geography: [
    { id: "terrain", label: "Terrain", type: "Multi-Text" },
    { id: "climate", label: "Climate", type: "Multi-Text" },
    { id: "notable_landmarks", label: "Notable Landmarks", type: "Multi-Text" },
  ],
  government: [
    { id: "government_type", label: "Government Type", type: "Multi-Text" },
    { id: "ruling_body", label: "Ruling Body", type: "Multi-Text" },
    { id: "laws_notable", label: "Notable Laws", type: "Multi-Text" },
  ],
  stellar_objects: [
    { id: "sunlight_hours", label: "Sunlight Hours", type: "Number" },
    { id: "tides_influence", label: "Tides Influence", type: "Multi-Text" },
  ],
  utilities: [
    { id: "notes", label: "Notes", type: "Multi-Text" },
    { id: "tags_text", label: "Tags (text)", type: "Multi-Text" },
  ],
} as const;

const CATEGORY_META: Record<keyof typeof ATTRIBUTE_DEFS, { name: string; icon: string }> = {
  basic_information: { name: "Basic Information", icon: "●" },
  location_details: { name: "Location Details", icon: "◆" },
  demographics: { name: "Demographics", icon: "👥" },
  economy: { name: "Economy", icon: "💰" },
  geography: { name: "Geography", icon: "🗺️" },
  government: { name: "Government", icon: "🏛️" },
  stellar_objects: { name: "Stellar Objects", icon: "🌘" },
  utilities: { name: "Utilities", icon: "🔧" },
};

/** ---------------- Types ---------------- */
interface WorldElement {
  id: string;
  project_id: string;
  category: string;
  name: string;
  description: string;
  attributes: Record<string, any>;
  tags: string[];
  image_url?: string;
  created_at: string;
  updated_at: string;
}

interface LocationsPanelProps {
  projectId: string;
  selectedElement?: WorldElement | null;
  onLocationsChange?: () => void;
  onClearSelection?: () => void;
  openCreateOnOpen?: boolean;
}

/** ---------------- Field (top-level) ---------------- */
interface FieldProps {
  attrId: string;
  editing: WorldElement | null;
  setEditing: React.Dispatch<React.SetStateAction<WorldElement | null>>;
  getAllForCategory: (cat: keyof typeof ATTRIBUTE_DEFS) => any[];
}

const Field: React.FC<FieldProps> = React.memo(({ attrId, editing, setEditing, getAllForCategory }) => {
  if (!editing) return null;

  const all = (Object.keys(ATTRIBUTE_DEFS) as Array<keyof typeof ATTRIBUTE_DEFS>)
    .flatMap((k) => getAllForCategory(k));
  const meta = all.find((a: any) => a.id === attrId) as { id: string; label: string; type: string } | undefined;

  const label = meta?.label || attrId;
  const type = meta?.type || "Text";
  const value = (editing.attributes && editing.attributes[attrId]) ?? (type === "Multi-Text" ? [""] : "");

  const setValue = (v: any) =>
    setEditing((ed) => (ed ? { ...ed, attributes: { ...(ed.attributes || {}), [attrId]: v } } : ed));

  if (type === "Multi-Text") {
    const arr = Array.isArray(value) ? value : [value];
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {arr.map((item: string, idx: number) => (
          <input
            key={`${attrId}-${idx}`}
            type="text"
            value={item}
            placeholder={`Add ${label.toLowerCase()}`}
            onChange={(e) => {
              const next = [...arr];
              next[idx] = e.target.value;
              setValue(next);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
          />
        ))}
        <button
          type="button"
          onClick={() => setValue([...(arr || []), ""])}
          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          + Add {label}
        </button>
      </div>
    );
  }

  if (type === "Number") {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => setValue(Number(e.target.value))}
          placeholder={label}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
        placeholder={label}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
      />
    </div>
  );
});

/** ---------------- AttributePicker (top-level) ---------------- */
interface AttributePickerProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  target: "details" | "basic";
  selected: string[];
  togglePick: (id: string, target: "details" | "basic") => void;
  activeCategory: keyof typeof ATTRIBUTE_DEFS;
  setActiveCategory: (k: keyof typeof ATTRIBUTE_DEFS) => void;
  searchAttr: string;
  setSearchAttr: (s: string) => void;
  customAttribute: { name: string; type: string };
  setCustomAttribute: (u: { name: string; type: string }) => void;
  addCustomAttribute: (cat: keyof typeof ATTRIBUTE_DEFS) => void;
  showCustomAttributeForm: boolean;
  setShowCustomAttributeForm: (b: boolean) => void;
  getAllForCategory: (cat: keyof typeof ATTRIBUTE_DEFS) => any[];
  customAttributes: Record<string, Array<{ id: string; label: string; type: string; isCustom: boolean }>>;
}

const AttributePicker: React.FC<AttributePickerProps> = React.memo((props) => {
  const {
    open,
    onOpenChange,
    target,
    selected,
    togglePick,
    activeCategory,
    setActiveCategory,
    searchAttr,
    setSearchAttr,
    customAttribute,
    setCustomAttribute,
    addCustomAttribute,
    showCustomAttributeForm,
    setShowCustomAttributeForm,
    getAllForCategory,
    customAttributes,
  } = props;

  const allForActive = getAllForCategory(activeCategory).filter((a: any) =>
    `${a.label} ${a.id}`.toLowerCase().includes(searchAttr.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 rounded-2xl bg-white/95 backdrop-blur-lg border-0 shadow-2xl overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Manage Attributes</DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Manage Attributes</h2>
            <p className="text-sm text-gray-600">Select any number of attributes below to add them to this Attributes Panel (uncheck them to remove attributes).</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
          >
          </button>
        </div>

        {/* Two-column layout */}
        <div className="flex min-h-[500px]">
          {/* Left sidebar - Category buttons */}
          <div className="w-1/3 bg-gray-50/50 border-r border-gray-200/50 p-4">
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500 mb-3 px-2">Categories</div>
              {(Object.keys(ATTRIBUTE_DEFS) as Array<keyof typeof ATTRIBUTE_DEFS>).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    activeCategory === key
                      ? "bg-orange-500 text-white shadow-sm font-medium"
                      : "text-gray-700 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{CATEGORY_META[key].icon}</span>
                    <span>{CATEGORY_META[key].name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right content area */}
          <div className="flex-1 p-6">
            {/* Selected attributes tags */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 min-h-[2rem]">
                {selected.length > 0 ? (
                  selected.map((attrId) => {
                    const attr = (Object.keys(ATTRIBUTE_DEFS) as Array<keyof typeof ATTRIBUTE_DEFS>)
                      .flatMap((k) => getAllForCategory(k))
                      .find((a: any) => a.id === attrId);
                    return attr ? (
                      <span key={`chip-${attrId}`} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 border border-gray-300 rounded-full text-xs font-medium text-gray-700">
                        {attr.label}
                      </span>
                    ) : null;
                  })
                ) : (
                  <span className="text-sm text-gray-400 italic">No attributes selected</span>
                )}
              </div>
            </div>

            {/* Custom Attribute Form */}
            {showCustomAttributeForm && (
              <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <h4 className="text-sm font-semibold text-orange-800 mb-3">Create Custom Attribute</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Attribute Name</label>
                    <Input
                      placeholder="Enter attribute name..."
                      value={customAttribute.name}
                      onChange={(e) => setCustomAttribute({ ...customAttribute, name: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Attribute Type</label>
                    <select
                      value={customAttribute.type}
                      onChange={(e) => setCustomAttribute({ ...customAttribute, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-300"
                    >
                      <option value="Text">Text</option>
                      <option value="Multi-Text">Multi-Text</option>
                      <option value="Number">Number</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        addCustomAttribute(activeCategory);
                        setShowCustomAttributeForm(false);
                      }}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 text-xs"
                    >
                      Add Attribute
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowCustomAttributeForm(false);
                      }}
                      className="px-3 py-1 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Search and Add Custom Attribute */}
            <div className="mb-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search attributes..."
                  className="pl-9 rounded-xl border-gray-200 focus:border-orange-300 focus:ring-orange-100"
                  value={searchAttr}
                  onChange={(e) => setSearchAttr(e.target.value)}
                />
              </div>
              {!showCustomAttributeForm && (
                <button
                  onClick={() => setShowCustomAttributeForm(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-orange-300 rounded-xl text-orange-600 hover:border-orange-400 hover:bg-orange-50 transition-all duration-200 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Custom Attribute
                </button>
              )}
            </div>

            {/* Attribute list */}
            <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-hide">
              {allForActive.map((attr: any) => (
                <div
                  key={`attr-${attr.id}`}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                    attr.isCustom
                      ? "border-orange-200 bg-orange-50 hover:bg-orange-100 hover:shadow-sm"
                      : "border-gray-200 bg-gray-50 hover:bg-white hover:shadow-sm"
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <Checkbox
                      checked={selected.includes(attr.id)}
                      onCheckedChange={() => togglePick(attr.id, target)}
                      className="w-4 h-4 rounded border-2 border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">{attr.label}</span>
                      {attr.isCustom && (
                        <span className="ml-2 text-xs text-orange-600 font-medium">Custom</span>
                      )}
                    </div>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-full px-2 py-1">
                      {attr.type}
                    </span>
                    {attr.isCustom && (
                      <button
                        onClick={() => {
                          // Remove from custom attributes
                          const list = customAttributes[activeCategory] || [];
                          const filtered = list.filter((a) => a.id !== attr.id);
                          customAttributes[activeCategory] = filtered as any; // local update ok, parent keeps source of truth
                          // Unselect if selected
                          if (selected.includes(attr.id)) togglePick(attr.id, target);
                          // Force a tiny state change via search text to refresh list without remount
                          setSearchAttr((s) => s + "");
                        }}
                        className="w-6 h-6 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors"
                        title="Delete custom attribute"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {allForActive.length === 0 && (
                <div className="text-center py-12 text-sm text-gray-500">No attributes match your search.</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200/50 bg-gray-50/30">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 rounded-lg">
            Cancel
          </Button>
          <Button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg">
            Select Attributes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

/** ---------------- Main Component ---------------- */
export default function LocationsPanel({
  projectId,
  selectedElement,
  onLocationsChange,
  onClearSelection,
  openCreateOnOpen,
}: LocationsPanelProps) {
  const supabase = useMemo(() => createSupabaseClient(), []);

  const [locations, setLocations] = useState<WorldElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isCreating, setIsCreating] = useState(false);
  const [editing, setEditing] = useState<WorldElement | null>(null);
  const [saving, setSaving] = useState(false);

  const defaultDetails = [
    "location_type",
    "location_age",
    "created_built_by",
    "date_created_built",
    "purpose_of_construction",
  ];
  const defaultBasic = [
    "area",
    "ethnic_groups",
    "languages",
    "population",
    "average_temperature",
    "biome",
    "natural_resources",
    "aliases",
  ];

  const [selectedDetails, setSelectedDetails] = useState<string[]>(defaultDetails);
  const [selectedBasic, setSelectedBasic] = useState<string[]>(defaultBasic);

  // modal state + picker shared state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBasicModal, setShowBasicModal] = useState(false);
  const [showCustomAttributeForm, setShowCustomAttributeForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState<keyof typeof ATTRIBUTE_DEFS>("location_details");
  const [searchAttr, setSearchAttr] = useState("");
  const [customAttribute, setCustomAttribute] = useState({ name: "", type: "Text" });
  const [customAttributes, setCustomAttributes] = useState<
    Record<string, Array<{ id: string; label: string; type: string; isCustom: boolean }>>
  >({});

  useEffect(() => {
    loadLocations();
  }, [projectId]);

  useEffect(() => {
    if (selectedElement && selectedElement.category === "locations") {
      setIsCreating(true);
      setEditing({ ...selectedElement });
      const sDetails = selectedElement.attributes?.__ui_selected_details as string[] | undefined;
      const sBasic = selectedElement.attributes?.__ui_selected_basic as string[] | undefined;
      if (sDetails?.length) setSelectedDetails(sDetails);
      if (sBasic?.length) setSelectedBasic(sBasic);
    }
  }, [selectedElement]);

  useEffect(() => {
    if (openCreateOnOpen) startCreate();
  }, [openCreateOnOpen]);

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from("world_elements")
        .select("*")
        .eq("project_id", projectId)
        .eq("category", "locations")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setLocations(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = locations.filter((l) =>
    [l.name, l.description].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const startCreate = () => {
    onClearSelection?.();
    setIsCreating(true);
    setEditing({
      id: "",
      project_id: projectId,
      category: "locations",
      name: "New Location",
      description: "",
      attributes: {},
      tags: [],
      created_at: "",
      updated_at: "",
    });
    setSelectedDetails(defaultDetails);
    setSelectedBasic(defaultBasic);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name?.trim()) return;
    setSaving(true);

    try {
      const payload = {
        project_id: projectId,
        category: "locations" as const,
        name: editing.name.trim(),
        description: editing.description,
        tags: editing.tags || [],
        attributes: {
          ...(editing.attributes || {}),
          __ui_selected_details: selectedDetails,
          __ui_selected_basic: selectedBasic,
        },
      };

      if (!editing.id) {
        const { data, error } = await supabase.from("world_elements").insert(payload).select().single();
        if (error) throw error;
        setEditing({ ...editing, id: data.id, created_at: data.created_at, updated_at: data.updated_at });
        setLocations((prev) => [data, ...prev]);
      } else {
        const { data, error } = await supabase.from("world_elements").update(payload).eq("id", editing.id).select().single();
        if (error) throw error;
        setLocations((prev) => prev.map((x) => (x.id === data.id ? data : x)));
      }

      onLocationsChange?.();
      setIsCreating(false);
      setEditing(null);
    } catch (error) {
      console.error("Error saving location:", error);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this location?")) return;
    const { error } = await supabase.from("world_elements").delete().eq("id", id);
    if (!error) setLocations((prev) => prev.filter((x) => x.id !== id));
  };

  const getAllForCategory = (cat: keyof typeof ATTRIBUTE_DEFS) => {
    const base = (ATTRIBUTE_DEFS[cat] || []) as unknown as any[];
    const custom = (customAttributes[cat] || []) as unknown as any[];
    return [...base, ...custom];
  };

  const togglePick = useCallback((id: string, target: "details" | "basic") => {
    if (target === "details") {
      setSelectedDetails((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    } else {
      setSelectedBasic((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }
  }, []);

  const addCustomAttribute = useCallback(
    (cat: keyof typeof ATTRIBUTE_DEFS) => {
      const label = customAttribute.name.trim();
      if (!label) return;
      const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      const entry = { id, label, type: customAttribute.type, isCustom: true } as const;
      setCustomAttributes((prev) => ({ ...prev, [cat]: [...(prev[cat] || []), entry as any] }));
      setCustomAttribute({ name: "", type: "Text" });
    },
    [customAttribute]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Loading locations…</p>
        </div>
      </div>
    );
  }

  if (isCreating && editing) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{editing.id ? "Edit Location" : "Create New Location"}</h1>
                <p className="text-gray-600">Build detailed location profiles for your story</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditing(null);
                    onClearSelection?.();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editing.id ? "Save Changes" : "Create Location"}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="rounded-xl border p-6 hover:shadow-lg transition-shadow duration-200 bg-white border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBasicModal(true)}
                    className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg p-2 transition-all duration-200"
                    title="Add"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {selectedBasic.length === 0 && (
                  <div className="text-sm text-gray-500">No attributes selected. Click Add to include fields.</div>
                )}
                {selectedBasic.map((id) => (
                  <Field key={`basic-${id}`} attrId={id} editing={editing} setEditing={setEditing} getAllForCategory={getAllForCategory} />
                ))}
              </div>
            </div>

            {/* Location Details */}
            <div className="rounded-xl border p-6 hover:shadow-lg transition-shadow duration-200 bg-white border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Location Details</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDetailsModal(true)}
                    className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg p-2 transition-all duration-200"
                    title="Add"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {selectedDetails.length === 0 && (
                  <div className="text-sm text-gray-500">No attributes selected. Click Add to include fields.</div>
                )}
                {selectedDetails.map((id) => (
                  <Field key={`details-${id}`} attrId={id} editing={editing} setEditing={setEditing} getAllForCategory={getAllForCategory} />
                ))}
              </div>
            </div>

            {/* Overview */}
            <div className="rounded-xl border p-6 hover:shadow-lg transition-shadow duration-200 bg-white border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Overview</h3>
              </div>
              <Textarea
                placeholder="Type here to add notes, backstories, and anything else you need in this Text Panel!"
                className="min-h-[140px] w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                value={(editing.attributes?.overview as string) || ""}
                onChange={(e) => setEditing((ed) => (ed ? { ...ed, attributes: { ...(ed.attributes || {}), overview: e.target.value } } : ed))}
              />
            </div>

            {/* Geography */}
            <div className="rounded-xl border p-6 hover:shadow-lg transition-shadow duration-200 bg-white border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Geography</h3>
              </div>
              <Textarea
                placeholder="Notes about geography..."
                className="min-h-[120px] w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                value={(editing.attributes?.geography_text as string) || ""}
                onChange={(e) => setEditing((ed) => (ed ? { ...ed, attributes: { ...(ed.attributes || {}), geography_text: e.target.value } } : ed))}
              />
            </div>
          </div>
        </div>

        {/* Modals */}
        <AttributePicker
          open={showDetailsModal}
          onOpenChange={setShowDetailsModal}
          target="details"
          selected={selectedDetails}
          togglePick={togglePick}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          searchAttr={searchAttr}
          setSearchAttr={setSearchAttr}
          customAttribute={customAttribute}
          setCustomAttribute={setCustomAttribute}
          addCustomAttribute={addCustomAttribute}
          showCustomAttributeForm={showCustomAttributeForm}
          setShowCustomAttributeForm={setShowCustomAttributeForm}
          getAllForCategory={getAllForCategory}
          customAttributes={customAttributes}
        />

        <AttributePicker
          open={showBasicModal}
          onOpenChange={setShowBasicModal}
          target="basic"
          selected={selectedBasic}
          togglePick={togglePick}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          searchAttr={searchAttr}
          setSearchAttr={setSearchAttr}
          customAttribute={customAttribute}
          setCustomAttribute={setCustomAttribute}
          addCustomAttribute={addCustomAttribute}
          showCustomAttributeForm={showCustomAttributeForm}
          setShowCustomAttributeForm={setShowCustomAttributeForm}
          getAllForCategory={getAllForCategory}
          customAttributes={customAttributes}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <MapPin className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
              <p className="text-gray-600">Define places in your story world</p>
            </div>
          </div>
          <button className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors" onClick={startCreate}>
            <Plus className="w-4 h-4" />
            <span>New Location</span>
          </button>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input className="pl-9 rounded-xl border-gray-200 focus:border-orange-300 focus:ring-orange-100" placeholder="Search locations…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="p-6">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No locations yet</h3>
            <p className="text-gray-600 mb-6">Create your first location to get started</p>
            <button className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors mx-auto" onClick={startCreate}>
              <Plus className="w-4 h-4" />
              <span>Create Location</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((loc) => (
              <div key={loc.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-md bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900">{loc.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{loc.description || "No description"}</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button className="p-2 rounded-lg text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-colors" onClick={() => { setIsCreating(true); setEditing(loc); }} title="Edit location">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors" onClick={() => remove(loc.id)} title="Delete location">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** ---------------- Tiny sanity checks (non-UI) ---------------- */
(() => {
  // test id generation for custom attributes
  const mkId = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  console.assert(mkId("Room Temp") === "room_temp", "mkId basic");
  console.assert(mkId("  $$We!rd  Name  ") === "we_rd_name", "mkId strips");
})();
