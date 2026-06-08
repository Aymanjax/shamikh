// @ts-nocheck
import { useState, useEffect } from "react";
import {
  Settings, Plus, Trash2, Save, RotateCw, AlertCircle,
  X, Check, Package, Ruler, ShoppingCart, Wrench,
} from "lucide-react";
import { adminApi } from "./adminApiService";

type SubTab = "tiles" | "lengths" | "orders" | "extras";

const SUB_TABS: { key: SubTab; label: string; icon: any }[] = [
  { key: "tiles", label: "كتالوج القرميد", icon: Package },
  { key: "lengths", label: "أطوال السوق", icon: Ruler },
  { key: "orders", label: "بنود الطلبات", icon: ShoppingCart },
  { key: "extras", label: "بنود إضافية", icon: Wrench },
];

export default function SystemConfigTab() {
  const [subTab, setSubTab] = useState<SubTab>("tiles");
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.getConfig();
      setConfig(data);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await adminApi.saveConfig(config);
      setSuccess("تم حفظ الإعدادات بنجاح");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(e.message);
    }
    setSaving(false);
  };

  const addTile = () => {
    setConfig((prev: any) => ({
      ...prev,
      tileCatalog: [...(prev.tileCatalog || []), {
        name: "بلاطة جديدة", origin: "غير محدد", count: 11,
        family: "terracotta", colorHex: "#d4784e",
        width: 0.29, length: 0.47, type: "ceramic",
        textureUrl: "/textures/tiles/terracotta-seamless.jpg",
      }],
    }));
  };

  const removeTile = (i: number) => {
    setConfig((prev: any) => ({
      ...prev,
      tileCatalog: prev.tileCatalog.filter((_: any, idx: number) => idx !== i),
    }));
  };

  const addLength = () => {
    setConfig((prev: any) => ({
      ...prev,
      marketLengths: [...(prev.marketLengths || []), 3.0],
    }));
  };

  const removeLength = (i: number) => {
    setConfig((prev: any) => ({
      ...prev,
      marketLengths: prev.marketLengths.filter((_: any, idx: number) => idx !== i),
    }));
  };

  const addOrderItem = () => {
    setConfig((prev: any) => ({
      ...prev,
      orderItems: [...(prev.orderItems || []), { id: "new_item", name: "بند جديد", unit: "حبة" }],
    }));
  };

  const removeOrderItem = (i: number) => {
    setConfig((prev: any) => ({
      ...prev,
      orderItems: prev.orderItems.filter((_: any, idx: number) => idx !== i),
    }));
  };

  const addExtraItem = () => {
    setConfig((prev: any) => ({
      ...prev,
      extraItems: [...(prev.extraItems || []), { name: "بند جديد", unit: "حبة" }],
    }));
  };

  const removeExtraItem = (i: number) => {
    setConfig((prev: any) => ({
      ...prev,
      extraItems: prev.extraItems.filter((_: any, idx: number) => idx !== i),
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-ink-muted">
        <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-sm font-bold">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {SUB_TABS.map((t) => (
            <button key={t.key} onClick={() => setSubTab(t.key)}
              className={`text-xs font-black px-3 py-1.5 rounded-lg transition border-2 flex items-center gap-1.5 ${
                subTab === t.key ? "bg-red-600 text-white border-red-600" : "bg-white text-ink-muted border-slate-200 hover:border-slate-300"
              }`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>
        <button onClick={handleSave} disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border-2 border-emerald-600 disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? "جاري الحفظ..." : "حفظ"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-600 font-bold text-sm p-4 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-600 font-bold text-sm p-4 rounded-xl flex items-center gap-2">
          <Check className="w-5 h-5" /> {success}
        </div>
      )}

      {subTab === "tiles" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-ink-primary">{config?.tileCatalog?.length || 0} بلاطة</span>
            <button onClick={addTile}
              className="text-xs font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100 py-1.5 px-3 rounded-lg transition flex items-center gap-1 border-2 border-emerald-200">
              <Plus className="w-3 h-3" /> إضافة
            </button>
          </div>
          {config?.tileCatalog?.map((tile: any, i: number) => (
            <div key={i} className="glass-card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 mr-2">
                  <input value={tile.name} onChange={(e) => {
                    const copy = [...config.tileCatalog];
                    copy[i] = { ...copy[i], name: e.target.value };
                    setConfig({ ...config, tileCatalog: copy });
                  }} className="bg-white border-2 border-slate-200 rounded-lg py-1.5 px-2 text-xs text-ink-primary outline-none focus:border-red-500 font-medium" />
                  <input value={tile.origin} onChange={(e) => {
                    const copy = [...config.tileCatalog];
                    copy[i] = { ...copy[i], origin: e.target.value };
                    setConfig({ ...config, tileCatalog: copy });
                  }} className="bg-white border-2 border-slate-200 rounded-lg py-1.5 px-2 text-xs text-ink-primary outline-none focus:border-red-500 font-medium" placeholder="المنشأ" />
                  <input type="number" step="0.1" value={tile.count} onChange={(e) => {
                    const copy = [...config.tileCatalog];
                    copy[i] = { ...copy[i], count: parseFloat(e.target.value) };
                    setConfig({ ...config, tileCatalog: copy });
                  }} className="bg-white border-2 border-slate-200 rounded-lg py-1.5 px-2 text-xs text-ink-primary outline-none focus:border-red-500 font-medium" placeholder="العدد/م" />
                  <input type="number" step="0.01" value={tile.width} onChange={(e) => {
                    const copy = [...config.tileCatalog];
                    copy[i] = { ...copy[i], width: parseFloat(e.target.value) };
                    setConfig({ ...config, tileCatalog: copy });
                  }} className="bg-white border-2 border-slate-200 rounded-lg py-1.5 px-2 text-xs text-ink-primary outline-none focus:border-red-500 font-medium" placeholder="العرض" />
                  <div className="flex items-center gap-1">
                    <input type="number" step="0.01" value={tile.length} onChange={(e) => {
                      const copy = [...config.tileCatalog];
                      copy[i] = { ...copy[i], length: parseFloat(e.target.value) };
                      setConfig({ ...config, tileCatalog: copy });
                    }} className="flex-1 bg-white border-2 border-slate-200 rounded-lg py-1.5 px-2 text-xs text-ink-primary outline-none focus:border-red-500 font-medium" placeholder="الطول" />
                    <input type="color" value={tile.colorHex || "#d4784e"} onChange={(e) => {
                      const copy = [...config.tileCatalog];
                      copy[i] = { ...copy[i], colorHex: e.target.value };
                      setConfig({ ...config, tileCatalog: copy });
                    }} className="w-8 h-8 rounded border-2 border-slate-200 cursor-pointer p-0" />
                  </div>
                </div>
                <button onClick={() => removeTile(i)}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition shrink-0 border-2 border-transparent hover:border-red-200">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === "lengths" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-ink-primary">{config?.marketLengths?.length || 0} طول</span>
            <button onClick={addLength}
              className="text-xs font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100 py-1.5 px-3 rounded-lg transition flex items-center gap-1 border-2 border-emerald-200">
              <Plus className="w-3 h-3" /> إضافة
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {config?.marketLengths?.map((len: number, i: number) => (
              <div key={i} className="glass-card p-3 flex items-center gap-2">
                <input type="number" step="0.1" value={len} onChange={(e) => {
                  const copy = [...config.marketLengths];
                  copy[i] = parseFloat(e.target.value);
                  setConfig({ ...config, marketLengths: copy });
                }} className="flex-1 bg-white border-2 border-slate-200 rounded-lg py-1.5 px-2 text-xs text-ink-primary outline-none focus:border-red-500 font-medium text-center" />
                <span className="text-xs text-ink-muted">م</span>
                <button onClick={() => removeLength(i)}
                  className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === "orders" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-ink-primary">{config?.orderItems?.length || 0} بند</span>
            <button onClick={addOrderItem}
              className="text-xs font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100 py-1.5 px-3 rounded-lg transition flex items-center gap-1 border-2 border-emerald-200">
              <Plus className="w-3 h-3" /> إضافة
            </button>
          </div>
          {config?.orderItems?.map((item: any, i: number) => (
            <div key={i} className="glass-card p-3 flex items-center gap-2">
              <input value={item.id} onChange={(e) => {
                const copy = [...config.orderItems];
                copy[i] = { ...copy[i], id: e.target.value };
                setConfig({ ...config, orderItems: copy });
              }} className="w-32 bg-white border-2 border-slate-200 rounded-lg py-1.5 px-2 text-xs text-ink-primary outline-none focus:border-red-500 font-medium" placeholder="المعرف" />
              <input value={item.name} onChange={(e) => {
                const copy = [...config.orderItems];
                copy[i] = { ...copy[i], name: e.target.value };
                setConfig({ ...config, orderItems: copy });
              }} className="flex-1 bg-white border-2 border-slate-200 rounded-lg py-1.5 px-2 text-xs text-ink-primary outline-none focus:border-red-500 font-medium" placeholder="الاسم" />
              <input value={item.unit} onChange={(e) => {
                const copy = [...config.orderItems];
                copy[i] = { ...copy[i], unit: e.target.value };
                setConfig({ ...config, orderItems: copy });
              }} className="w-20 bg-white border-2 border-slate-200 rounded-lg py-1.5 px-2 text-xs text-ink-primary outline-none focus:border-red-500 font-medium" placeholder="الوحدة" />
              <button onClick={() => removeOrderItem(i)}
                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {subTab === "extras" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-ink-primary">{config?.extraItems?.length || 0} بند إضافي</span>
            <button onClick={addExtraItem}
              className="text-xs font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100 py-1.5 px-3 rounded-lg transition flex items-center gap-1 border-2 border-emerald-200">
              <Plus className="w-3 h-3" /> إضافة
            </button>
          </div>
          {config?.extraItems?.map((item: any, i: number) => (
            <div key={i} className="glass-card p-3 flex items-center gap-2">
              <input value={item.name} onChange={(e) => {
                const copy = [...config.extraItems];
                copy[i] = { ...copy[i], name: e.target.value };
                setConfig({ ...config, extraItems: copy });
              }} className="flex-1 bg-white border-2 border-slate-200 rounded-lg py-1.5 px-2 text-xs text-ink-primary outline-none focus:border-red-500 font-medium" placeholder="الاسم" />
              <input value={item.unit} onChange={(e) => {
                const copy = [...config.extraItems];
                copy[i] = { ...copy[i], unit: e.target.value };
                setConfig({ ...config, extraItems: copy });
              }} className="w-24 bg-white border-2 border-slate-200 rounded-lg py-1.5 px-2 text-xs text-ink-primary outline-none focus:border-red-500 font-medium" placeholder="الوحدة" />
              <button onClick={() => removeExtraItem(i)}
                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
