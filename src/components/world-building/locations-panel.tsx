"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  MapPin,
  Edit3,
  Trash2,
  MoreVertical,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createSupabaseClient } from "@/lib/auth";

/**
 * LocationsPanel – redesigned to follow CharactersPanel UX patterns
 * - Two configurable sections with "+" modals: "Location Details" and "Basic Information"
 * - Attribute picker modal (category list on the left, searchable list on the right)
 * - Custom attribute creation (label + type)
 * - Dynamic fields renderer (Text, Multi-Text, Number, Slider)
 * - Clean list → editor split layout matching Characters panel
 */

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
}

// ---------------- Attribute Catalog ----------------
// Mirrors the screenshots you shared (Basic Information, Demographics, Economy, Geography, Government, Stellar Objects, Utilities)
// We keep ids stable/safe for storage.
const ATTRIBUTE_DEFS = {
  basic_information: [
    { id: "area", label: "Area", type: "Number", units: true },
    { id: "ethnic_groups", label: "Ethnic Groups", type: "Multi-Text" },
    { id: "languages", label: "Languages", type: "Multi-Text" },
    { id: "population", label: "Population", type: "Number" },
    { id: "average_temperature", label: "Average Temperature", type: "Number", units: true },
    { id: "biome", label: "Biome", type: "Multi-Text" },
    { id: "natural_resources", label: "Natural Resources", type: "Multi-Text" },
    { id: "aliases", label: "Aliases", type: "Multi-Text" },
  ],
  location_details: [
    { id: "location_type", label: "Location Type", type: "Multi-Text" },
    { id: "location_age", label: "Location Age", type: "Number", units: true },
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

// ---------------- Component ----------------
export default function LocationsPanel({
  projectId,
  selectedElement,
  onLocationsChange,
  onClearSelection,
}: LocationsPanelProps) {
  const supabase = useMemo(() => createSupabaseClient(), []);

  const [locations, setLocations] = useState<WorldElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isCreating, setIsCreating] = useState(false);
  const [editing, setEditing] = useState<WorldElement | null>(null);

  // Section expand state
  const [expanded, setExpanded] = useState({
    details: true,
    basic: true,
    overview: true,
  });

  // Attribute selection for both panels
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

  // Modal state (two separate pickers)
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBasicModal, setShowBasicModal] = useState(false);

  // Generic modal scaffolding
  const [activeCategory, setActiveCategory] = useState<keyof typeof ATTRIBUTE_DEFS>("location_details");
  const [searchAttr, setSearchAttr] = useState("");
  const [customAttrDraft, setCustomAttrDraft] = useState({ label: "", type: "Text" });
  const [customAttributes, setCustomAttributes] = useState<
    Record<string, Array<{ id: string; label: string; type: string; isCustom: boolean }>>
  >({});

  // ------------ Load & Sync ---------------
  useEffect(() => {
    loadLocations();
  }, [projectId]);

  useEffect(() => {
    // If user clicked from the sidebar to edit a location, open edit view instantly
    if (selectedElement && selectedElement.category === "locations") {
      setIsCreating(true);
      setEditing({ ...selectedElement });

      // Restore selected attribute sets if saved previously
      const sDetails = selectedElement.attributes?.__ui_selected_details as string[] | undefined;
      const sBasic = selectedElement.attributes?.__ui_selected_basic as string[] | undefined;
      if (sDetails?.length) setSelectedDetails(sDetails);
      if (sBasic?.length) setSelectedBasic(sBasic);
    }
  }, [selectedElement]);

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

  // -------------- CRUD -----------------
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
      const { data, error } = await supabase
        .from("world_elements")
        .insert(payload)
        .select()
        .single();
      if (!error && data) {
        setEditing({ ...editing, id: data.id, created_at: data.created_at, updated_at: data.updated_at });
        setLocations((prev) => [data, ...prev]);
      }
    } else {
      const { data, error } = await supabase
        .from("world_elements")
        .update(payload)
        .eq("id", editing.id)
        .select()
        .single();
      if (!error && data) {
        setLocations((prev) => prev.map((x) => (x.id === data.id ? data : x)));
      }
    }

    onLocationsChange?.();
    setIsCreating(false);
    setEditing(null);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this location?")) return;
    const { error } = await supabase.from("world_elements").delete().eq("id", id);
    if (!error) {
      setLocations((prev) => prev.filter((x) => x.id !== id));
    }
  };

  // -------------- Attribute Helpers --------------
  const getAllForCategory = (cat: keyof typeof ATTRIBUTE_DEFS) => {
    const base = ATTRIBUTE_DEFS[cat] || [];
    const custom = customAttributes[cat] || [];
    return [...base, ...custom];
  };

  const togglePick = (id: string, target: "details" | "basic") => {
    if (target === "details") {
      setSelectedDetails((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    } else {
      setSelectedBasic((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }
  };

  const addCustomAttribute = (cat: keyof typeof ATTRIBUTE_DEFS) => {
    const trimmed = customAttrDraft.label.trim();
    if (!trimmed) return;
    const id = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    setCustomAttributes((prev) => ({
      ...prev,
      [cat]: [...(prev[cat] || []), { id, label: trimmed, type: customAttrDraft.type, isCustom: true }],
    }));
    setCustomAttrDraft({ label: "", type: "Text" });
  };

  const getDef = (attrId: string) => {
    for (const [cat, list] of Object.entries(ATTRIBUTE_DEFS)) {
      const hit = (list as any[]).find((a) => a.id === attrId);
      if (hit) return hit;
    }
    for (const list of Object.values(customAttributes)) {
      const hit = list?.find((a) => a.id === attrId);
      if (hit) return hit;
    }
    return null;
  };

  // -------------- Field Renderer --------------
  const Field = ({ attrId }: { attrId: string }) => {
    if (!editing) return null;
    const def: any = getDef(attrId);
    if (!def) return null;

    const val = editing.attributes?.[attrId] ?? "";
    const setVal = (v: any) => setEditing((e) => (e ? { ...e, attributes: { ...(e.attributes || {}), [attrId]: v } } : e));

    return (
      <div className="group">
        <label className="block text-sm font-medium text-gray-700 mb-2">{def.label}</label>
        {def.type === "Text" && (
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-600"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={`Enter ${def.label.toLowerCase()}...`}
          />
        )}
        {def.type === "Multi-Text" && (
          <Textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-600"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={`Enter ${def.label.toLowerCase()}...`}
            rows={3}
          />
        )}
        {def.type === "Number" && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-600"
              value={val}
              onChange={(e) => setVal(Number(e.target.value))}
              placeholder={`Enter ${def.label.toLowerCase()}...`}
            />
            {def.units && (
              <input
                type="text"
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-green-600"
                value={editing.attributes?.[`${attrId}_units`] ?? ""}
                onChange={(e) =>
                  setEditing((ed) =>
                    ed ? { ...ed, attributes: { ...ed.attributes, [`${attrId}_units`]: e.target.value } } : ed
                  )
                }
                placeholder="Units"
              />
            )}
          </div>
        )}
      </div>
    );
  };

  // -------------- Modals --------------
  const AttributePicker = ({
    open,
    onOpenChange,
    target,
  }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    target: "details" | "basic";
  }) => {
    const current = target === "details" ? selectedDetails : selectedBasic;
    const filtered = getAllForCategory(activeCategory).filter((a) =>
      a.label.toLowerCase().includes(searchAttr.toLowerCase())
    );

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Select Attributes</DialogTitle>
          </DialogHeader>
          <div className="flex">
            {/* Left – categories */}
            <aside className="w-64 border-r p-3 space-y-1">
              {(Object.keys(ATTRIBUTE_DEFS) as Array<keyof typeof ATTRIBUTE_DEFS>).map((k) => (
                <button
                  key={k}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                    activeCategory === k ? "bg-green-50 text-green-700" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveCategory(k)}
                >
                  <span className="mr-2">{CATEGORY_META[k].icon}</span>
                  {CATEGORY_META[k].name}
                </button>
              ))}
            </aside>

            {/* Right – search + list */}
            <section className="flex-1 p-6 space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  className="pl-9"
                  placeholder="Search attributes..."
                  value={searchAttr}
                  onChange={(e) => setSearchAttr(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-[48vh] overflow-auto pr-1">
                {filtered.map((a) => {
                  const picked = current.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => togglePick(a.id, target)}
                      className={`text-left border rounded-lg px-3 py-2 text-sm transition ${{
                        true: "bg-green-50 border-green-300",
                        false: "hover:bg-gray-50",
                      }[String(picked) as any]}`}
                    >
                      <div className="font-medium">{a.label}</div>
                      <div className="text-xs text-gray-500">{a.type}</div>
                    </button>
                  );
                })}
              </div>

              {/* Custom attribute */}
              <div className="border-t pt-4">
                <div className="text-sm font-medium mb-2">Add Custom Attribute</div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Label (e.g., Harbor Depth)"
                    value={customAttrDraft.label}
                    onChange={(e) => setCustomAttrDraft({ ...customAttrDraft, label: e.target.value })}
                  />
                  <select
                    value={customAttrDraft.type}
                    onChange={(e) => setCustomAttrDraft({ ...customAttrDraft, type: e.target.value })}
                    className="border rounded-lg px-2 text-sm"
                  >
                    <option>Text</option>
                    <option>Multi-Text</option>
                    <option>Number</option>
                  </select>
                  <Button
                    onClick={() => addCustomAttribute(activeCategory)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => onOpenChange(false)}>
                  Done
                </Button>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // -------------- UI --------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Loading locations...</p>
        </div>
      </div>
    );
  }

  if (isCreating && editing) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {editing.id ? "Edit Location" : "Create New Location"}
              </h1>
              <p className="text-gray-600">Define places that power your worldbuilding</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setIsCreating(false); setEditing(null); onClearSelection?.(); }}>
                Cancel
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={save}>
                {editing.id ? "Save Changes" : "Create Location"}
              </Button>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="container mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
          <section className="space-y-6">
            {/* Details Panel */}
            <Card className="rounded-xl border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Location Details</CardTitle>
                  <p className="text-sm text-gray-500">Core structural info about the site</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setShowDetailsModal(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedDetails.length === 0 && (
                  <div className="text-sm text-gray-500">No attributes selected. Click Add to include fields.</div>
                )}
                {selectedDetails.map((id) => (
                  <Field key={id} attrId={id} />
                ))}
              </CardContent>
            </Card>

            {/* Overview Text Panel */}
            <Card className="rounded-xl border">
              <CardHeader>
                <CardTitle className="text-lg">Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Type here to add notes, backstories, and anything else you need in this Text Panel!"
                  className="min-h-[140px]"
                  value={(editing.attributes?.overview as string) || ""}
                  onChange={(e) =>
                    setEditing((ed) => (ed ? { ...ed, attributes: { ...ed.attributes, overview: e.target.value } } : ed))
                  }
                />
              </CardContent>
            </Card>

            {/* Geography Text Panel */}
            <Card className="rounded-xl border">
              <CardHeader>
                <CardTitle className="text-lg">Geography</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Notes about geography..."
                  className="min-h-[120px]"
                  value={(editing.attributes?.geography_text as string) || ""}
                  onChange={(e) =>
                    setEditing((ed) => (ed ? { ...ed, attributes: { ...ed.attributes, geography_text: e.target.value } } : ed))
                  }
                />
              </CardContent>
            </Card>
          </section>

          {/* Right column */}
          <section className="space-y-6">
            {/* Basic Info Panel */}
            <Card className="rounded-xl border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                  <p className="text-sm text-gray-500">Population, languages, resources, and more</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowBasicModal(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedBasic.length === 0 && (
                  <div className="text-sm text-gray-500">No attributes selected. Click Add to include fields.</div>
                )}
                {selectedBasic.map((id) => (
                  <Field key={id} attrId={id} />
                ))}
              </CardContent>
            </Card>

            {/* Government Text Panel */}
            <Card className="rounded-xl border">
              <CardHeader>
                <CardTitle className="text-lg">Government</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Notes about government..."
                  className="min-h-[120px]"
                  value={(editing.attributes?.government_text as string) || ""}
                  onChange={(e) =>
                    setEditing((ed) => (ed ? { ...ed, attributes: { ...ed.attributes, government_text: e.target.value } } : ed))
                  }
                />
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Attribute Modals */}
        <AttributePicker open={showDetailsModal} onOpenChange={setShowDetailsModal} target="details" />
        <AttributePicker open={showBasicModal} onOpenChange={setShowBasicModal} target="basic" />
      </div>
    );
  }

  // ---------- List View ----------
  return (
    <div className="min-h-screen bg-white">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
              <p className="text-gray-600">Define places in your story world</p>
            </div>
          </div>
          <Button className="bg-green-600 hover:bg-green-700" onClick={startCreate}>
            <Plus className="w-4 h-4 mr-2" /> New Location
          </Button>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input className="pl-9" placeholder="Search locations..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-6">
        {filtered.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-gray-600">No locations yet. Create your first one.</CardContent>
          </Card>
        ) : (
          filtered.map((loc) => (
            <Card key={loc.id} className="hover:shadow-md transition">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-md bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                      <div className="font-semibold">{loc.name}</div>
                    </div>
                    <div className="text-sm text-gray-600 line-clamp-2">{loc.description || "No description"}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setIsCreating(true); setEditing(loc); }}>
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-red-600" onClick={() => remove(loc.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
