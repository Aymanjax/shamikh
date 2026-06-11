// @ts-nocheck
import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator, Download, FileText, GripVertical, Plus, X, ChevronUp, ChevronDown,
  Eye, EyeOff, Save, Sparkles, Box, Ruler, Building2, Grid3x3, Check, ArrowRight,
  Trash2, PackageOpen, Droplets, Zap, ScanLine, ClipboardList, Send, RotateCcw,
  Undo2, Printer, Share2, FileSpreadsheet, Layers
} from "lucide-react";
import { TILES_CATALOG } from "../../utils/constants";
import { calcAll, calcCosts, suggestLegs, buildExtraFields } from "../../utils/calculations";
import { edgesFromVertices, shoelaceArea, isPolygonClosed, svgToPngDataUrl, fitSvgToBounds, isRectangular } from "../../utils/buildingGeometry";
import { downloadMaterialList, downloadQuotation } from "../../services/pdfService";
import { useAuthStore } from "../../store/authStore";
import { db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getSuppliersWithPrices } from "../../services/supplierService";
import { getProgramConfig } from "../../services/adminService";
import { createProject, updateProject, fetchProject } from "../../services/projectService";
import BuildingCanvas from "../../components/roof/BuildingCanvas";
import RoofPresets from "../../components/roof/RoofPresets";

import { skeletonReady } from "../../utils/roofSkeleton";
import SubscriptionGuard from "../../components/SubscriptionGuard";
import GlassButton from "../../components/ui/GlassButton";
import ResultPanel from "./components/ResultPanel";
import { useCalculatorOnboarding } from "../../hooks/useCalculatorOnboarding";
import { useT } from "../../i18n";

function segmentsToVertices(segments) {
  if (!segments || segments.length === 0) return [];
  if (segments.length === 1) {
    const { length, width } = segments[0];
    const l = Math.min(length || 5, 19);
    const w = Math.min(width || 4, 19);
    const offsetX = (20 - l) / 2;
    const offsetY = (20 - w) / 2;
    return [
      { x: offsetX, y: offsetY },
      { x: offsetX + l, y: offsetY },
      { x: offsetX + l, y: offsetY + w },
      { x: offsetX, y: offsetY + w },
    ];
  }
  const maxL = Math.max(...segments.map(s => s.length || 0));
  const totalW = segments.reduce((sum, s) => sum + (s.width || 0), 0);
  const scale = Math.min(18 / maxL, 18 / totalW, 1);
  let currentY = 1;
  const verts = [];
  segments.forEach((seg, i) => {
    const l = (seg.length || 0) * scale;
    const w = (seg.width || 0) * scale;
    if (i === 0) {
      verts.push({ x: 1, y: currentY });
      verts.push({ x: 1 + l, y: currentY });
      verts.push({ x: 1 + l, y: currentY + w });
      verts.push({ x: 1, y: currentY + w });
    } else {
      verts.push({ x: 1, y: currentY + w });
      verts.push({ x: 1 + l, y: currentY + w });
    }
    currentY += w;
  });
  return verts;
}

function verticesToSegment(vertices) {
  if (!vertices || vertices.length < 3) return null;
  const xs = vertices.map(v => v.x);
  const ys = vertices.map(v => v.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    length: parseFloat((maxX - minX).toFixed(2)),
    width: parseFloat((maxY - minY).toFixed(2)),
  };
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-earth-500 font-bold block">{label}</label>
      {children}
    </div>
  );
}

function Input(props) {
  return (
    <input {...props}
      className={`w-full bg-white border border-earth-300 rounded-sm py-2.5 px-3 text-earth-900 outline-none focus:border-terracotta-400 focus:ring-1 focus:ring-terracotta-100 transition text-sm font-mono ${props.className || ""}`} />
  );
}

export default function CalculatorPage() {
  const t = useT();
  const { user, companyName } = useAuthStore();
  const navigate = useNavigate();
  const { projectId: urlProjectId } = useParams();
  const [searchParams] = useSearchParams();
  const [fetchedProjectData, setFetchedProjectData] = useState(null);
  const projectData = fetchedProjectData;
  const [vertices, setVertices] = useState([]);
  const [sides, setSides] = useState([]);
  const [projectLoading, setProjectLoading] = useState(!!urlProjectId);
  const initRef = useRef(false);

  const [input, setInput] = useState({
    slope: 40, numLegs: 6, legHeight: 2.7,
    withDecor: true, enableInsulation: false,
    tileIndex: 0,
  });
  const [customFields, setCustomFields] = useState([]);
  const [dragIdx, setDragIdx] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const [hiddenItems, setHiddenItems] = useState(new Set());
  const canvasRef = useRef(null);
  const loadedRef = useRef(false);
  const restoredRef = useRef(false);
  const baseItemDefsRef = useRef([]);
  const [itemDefsKey, setItemDefsKey] = useState(0);

  const [show3dPreview, setShow3dPreview] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveClient, setSaveClient] = useState({ name: "", phone: "", address: "" });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [savedProjectId, setSavedProjectId] = useState(null);
  const [adminTiles, setAdminTiles] = useState(null);
  const [skeletonVer, setSkeletonVer] = useState(0);
  const hasSavedOnce = useRef(false);
  const onboarding = useCalculatorOnboarding();

  useEffect(() => {
    skeletonReady.then(() => setSkeletonVer(v => v + 1));
  }, []);

  useEffect(() => {
    if (!urlProjectId || !user) return;
    let cancelled = false;
    setProjectLoading(true);
    fetchProject(user.uid, urlProjectId).then((data) => {
      if (cancelled || !data) { setProjectLoading(false); return; }
      const pd = { id: data.id, client: data.client, roof: data.roof, settings: data.settings };
      setFetchedProjectData(pd);
      initRef.current = true;
      localStorage.removeItem("calculator_state");
      restoredRef.current = false;
      loadedRef.current = true;
      const { roof, settings } = pd;
      let verts = [];
      if (roof?.vertices && roof.vertices.length > 2) {
        verts = roof.vertices;
      } else {
        verts = segmentsToVertices(roof?.segments || []);
      }
      if (verts.length > 0) {
        setVertices(verts);
        restoredRef.current = true;
      }
      if (roof?.slope != null) setInput((prev) => ({ ...prev, slope: roof.slope }));
      if (settings?.numLegs != null) setInput((prev) => ({ ...prev, numLegs: settings.numLegs }));
      if (settings?.legHeight != null) setInput((prev) => ({ ...prev, legHeight: settings.legHeight }));
      if (settings?.withDecor != null) setInput((prev) => ({ ...prev, withDecor: settings.withDecor }));
      if (settings?.enableInsulation != null) setInput((prev) => ({ ...prev, enableInsulation: settings.enableInsulation }));
      setProjectLoading(false);
    });
    return () => { cancelled = true; };
  }, [urlProjectId, user]);

  const [prices, setPrices] = useState({
    iron4x8: 12, iron10x10: 22, tile: 0.95,
    decor: 5, decorBrooz: 5, besh: 1.5, sharshef: 4, nathrayat: 150,
    tileStarts: 0, tarpaulin: 0, zafta: 0,
    latiSheets: 0, woodBases: 0, tarabeesh: 0,
    longAsas: 0, metalSheet: 0, silicone: 0,
  });
  const [showPrices, setShowPrices] = useState(false);
  const [supplierPrices, setSupplierPrices] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [featureIdx, setFeatureIdx] = useState(0);
  const features = [
    { icon: "calculator", title: t("calculator.feature.calcTitle"), desc: t("calculator.feature.calcDesc") },
    { icon: "route", title: t("calculator.feature.routeTitle"), desc: t("calculator.feature.routeDesc") },
    { icon: "file-pdf", title: t("calculator.feature.pdfTitle"), desc: t("calculator.feature.pdfDesc") },
    { icon: "cube", title: t("calculator.feature.cubeTitle"), desc: t("calculator.feature.cubeDesc") },
  ];
  useEffect(() => {
    const t = setInterval(() => setFeatureIdx(i => (i + 1) % features.length), 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (projectData || urlProjectId) {
      loadedRef.current = true;
      return;
    }
    const w = parseFloat(searchParams.get("w"));
    const h = parseFloat(searchParams.get("h"));
    if (w > 0 && h > 0) {
      const verts = segmentsToVertices([{ length: w, width: h }]);
      if (verts.length) {
        const closed = [...verts, verts[0]];
        setVertices(closed);
      }
      restoredRef.current = true;
    } else {
      const saved = localStorage.getItem("calculator_state");
      if (saved) {
        try {
          const s = JSON.parse(saved);
          if (s.vertices?.length) setVertices(s.vertices);
          if (s.sides?.length) setSides(s.sides);
          if (s.input) setInput((prev) => ({ ...prev, ...s.input }));
          if (s.customFields?.length) setCustomFields(s.customFields);
          if (s.showAdvanced) setShowAdvanced(s.showAdvanced);
          if (s.showExtra) setShowExtra(s.showExtra);
          if (s.prices) setPrices((prev) => ({ ...prev, ...s.prices }));
          if (s.showPrices) setShowPrices(s.showPrices);
          restoredRef.current = true;
        } catch {}
      }
    }
    loadedRef.current = true;
  }, []);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!loadedRef.current || projectData || urlProjectId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const s = { vertices, sides, input, customFields, showAdvanced, showExtra, prices, showPrices };
      localStorage.setItem("calculator_state", JSON.stringify(s));
    }, 500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [vertices, sides, input, customFields, showAdvanced, showExtra, prices, showPrices, projectData]);

  useEffect(() => {
    if (!user) return;
    getProgramConfig().then((pg) => {
      if (pg?.tileCatalog?.length) {
        setAdminTiles(pg.tileCatalog);
      }
      const adminDefs = pg?.extraItems?.length
        ? pg.extraItems.map((ei) => ({ name: ei.name, value: "0", unit: ei.unit }))
        : null;
      getDoc(doc(db, "users", user.uid, "profile", "main")).then((snap) => {
        let defs;
        if (!snap.exists()) {
          defs = adminDefs || [];
        } else {
          const d = snap.data();
          if (d.prices) setPrices((prev) => ({ ...prev, ...d.prices }));
          const userItems = d.extraItems || [];
          if (userItems.length > 0) {
            defs = userItems.map((ei) => ({ name: ei.name, value: "0", unit: ei.unit }));
            if (adminDefs?.length) {
              const adminMap = Object.fromEntries(adminDefs.map((a) => [a.name, a.unit]));
              defs = defs.map((u) => {
                if (adminMap[u.name] !== undefined) return { ...u, unit: adminMap[u.name] };
                return u;
              });
              const userNames = new Set(defs.map((u) => u.name));
              adminDefs.forEach((a) => {
                if (!userNames.has(a.name)) defs.push(a);
              });
            }
          } else if (adminDefs) {
            defs = adminDefs;
          } else {
            defs = [
              { name: "زيت حار", value: "0", unit: "جلن" },
              { name: "فرنيش", value: "0", unit: "جلن" },
              { name: "نفط", value: "0", unit: "تنكة" },
              { name: "روف جارد", value: "0", unit: "ك" },
              { name: "رول دهان", value: "0", unit: "حبة" },
              { name: "فرش", value: "0", unit: "حبة" },
              { name: "مسامير بولاد", value: "0", unit: "بكيت" },
              { name: "مسامير فرد", value: "0", unit: "بكيت" },
              { name: "مسامير فرد بولاد", value: "0", unit: "بكيت" },
              { name: "مسامير 4سم", value: "0", unit: "بكيت" },
              { name: "اسلاك لحام", value: "0", unit: "بكيت" },
              { name: "فيبر قص حديد", value: "0", unit: "حبة" },
              { name: "مبروم حديد", value: "0", unit: "ربطة" },
              { name: "بودرة", value: "0", unit: "شوال" },
              { name: "اسمنت", value: "0", unit: "كيس" },
            ];
          }
        }
        baseItemDefsRef.current = defs;
        setItemDefsKey(k => k + 1);
        setCustomFields((prev) => prev.length > 0 ? prev : defs);
      });
    });
  }, [user]);

  const closed = isPolygonClosed(vertices);
  const area = useMemo(() => closed ? shoelaceArea(vertices) : 0, [vertices, closed]);

  const boundingDims = useMemo(() => {
    if (!closed || !vertices.length) return { length: 5, width: 4 };
    const xs = vertices.map((v) => v.x);
    const ys = vertices.map((v) => v.y);
    const w = Math.max(...xs) - Math.min(...xs);
    const h = Math.max(...ys) - Math.min(...ys);
    return { length: Math.max(w, h), width: Math.min(w, h) };
  }, [vertices, closed]);

  const computedSides = useMemo(() => {
    if (!closed) return [];
    return edgesFromVertices(vertices);
  }, [vertices, closed]);

  useEffect(() => {
    setSides(computedSides);
  }, [computedSides]);

  const handleToggleFacade = (index) => {
    setSides((prev) => prev.map((s, i) => i === index ? { ...s, hasFacade: !s.hasFacade } : s));
  };

  const handleToggleActive = (index) => {
    if (!isRectangular(vertices)) return;
    setSides((prev) => prev.map((s, i) => i === index ? { ...s, isActive: s.isActive !== false ? false : true } : s));
  };

  const facadeCount = sides.filter((s) => s.hasFacade).length;

  const recommendedLegs = useMemo(() => {
    if (!closed || area === 0) return null;
    if (sides.length > 0) {
      const s = suggestLegs(sides, 4);
      return s ? { ...s, label: t("calculator.legs.count", { n: s.total }) } : null;
    }
    if (area <= 15) return { min: 2, max: 3, total: 2, label: t("calculator.legs.range", { min: 2, max: 3 }) };
    if (area <= 25) return { min: 3, max: 4, total: 3, label: t("calculator.legs.range", { min: 3, max: 4 }) };
    if (area <= 40) return { min: 4, max: 6, total: 4, label: t("calculator.legs.range", { min: 4, max: 6 }) };
    if (area <= 60) return { min: 6, max: 8, total: 6, label: t("calculator.legs.range", { min: 6, max: 8 }) };
    return { min: 8, max: 12, total: 8, label: t("calculator.legs.rangePlus", { min: 8 }) };
  }, [closed, area, sides, t]);

  const legAdvice = useMemo(() => {
    if (!recommendedLegs) return null;
    const { min, max } = recommendedLegs;
    if (input.numLegs < min) return { type: "warning", text: t("calculator.legs.adviceLow", { min }) };
    if (input.numLegs > max) return { type: "info", text: t("calculator.legs.adviceHigh", { max }) };
    return { type: "success", text: t("calculator.legs.adviceOk") };
  }, [input.numLegs, recommendedLegs, t]);

  const suggestedLegsRef = useRef(false);
  useEffect(() => {
    if (recommendedLegs?.total && !suggestedLegsRef.current) {
      setInput((prev) => ({ ...prev, numLegs: recommendedLegs.total }));
      suggestedLegsRef.current = true;
    }
  }, [recommendedLegs?.total]);

  const h = (name) => (e) => {
    const { value, type, checked } = e.target;
    setInput((f) => ({ ...f, [name]: type === "checkbox" ? checked : Number(value) }));
  };
  const hSel = (name) => (e) => setInput((f) => ({ ...f, [name]: Number(e.target.value) }));

  const applyPreset = (p) => {
    setVertices(p.vertices);
    if (p.slope) setInput((f) => ({ ...f, slope: p.slope }));
    if (p.withDecor !== undefined) setInput((f) => ({ ...f, withDecor: p.withDecor }));
    if (p.enableInsulation !== undefined) setInput((f) => ({ ...f, enableInsulation: p.enableInsulation }));
  };

  const handleDecor = () => setInput((f) => ({ ...f, withDecor: !f.withDecor }));
  const handleInsulation = () => setInput((f) => ({ ...f, enableInsulation: !f.enableInsulation }));

  const handleOpenSaveModal = () => {
    if (!hasSavedOnce.current && projectData?.client?.name) {
      setSaveClient({
        name: projectData.client.name || "",
        phone: projectData.client.phone || "",
        address: projectData.client.address || "",
      });
    } else {
      setSaveClient({ name: "", phone: "", address: "" });
    }
    setSaveSuccess(null);
    setShowSaveModal(true);
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!user || !saveClient.name.trim()) return;
    setSaveLoading(true);
    try {
      const seg = verticesToSegment(vertices);
      const projectPayload = {
        client: { name: saveClient.name.trim(), phone: saveClient.phone.trim(), address: saveClient.address.trim() },
        roof: {
          type: "simple",
          segments: seg ? [{ length: seg.length, width: seg.width }] : [{ length: 5, width: 4 }],
          vertices: closed ? vertices : [],
          slope: input.slope,
        },
        settings: {
          facadeLength: sides.filter(s => s.hasFacade).length * 3,
          numLegs: input.numLegs,
          legHeight: input.legHeight,
          withDecor: input.withDecor,
          enableInsulation: input.enableInsulation,
        },
        summary: {
          totalTiles: result?.totalTiles ?? 0,
          flatArea: result?.flatArea ?? 0,
          actualArea: result?.actualArea ?? 0,
          totalCost: costResult ? Math.round(costResult.totalWithNathrayat) : null,
        },
        status: "draft",
      };

      let pid;
      if (projectData?.id && !hasSavedOnce.current) {
        await updateProject(user.uid, projectData.id, projectPayload);
        hasSavedOnce.current = true;
        pid = projectData.id;
      } else {
        pid = await createProject(user.uid, projectPayload);
      }

      setSavedProjectId(pid);
      setSaveSuccess(saveClient.name.trim());
      setShowSaveModal(false);
    } catch (err) {
      alert(t("calculator.saveFailed") + ": " + (err.message || t("calculator.genericError")));
    } finally {
      setSaveLoading(false);
    }
  };

  const staticTile = TILES_CATALOG[input.tileIndex] || TILES_CATALOG[0];
  const adminTile = adminTiles?.[input.tileIndex];
  const tile = useMemo(() => adminTile ? { ...staticTile, ...adminTile } : staticTile, [staticTile, adminTile]);

  const result = useMemo(() => calcAll({
    sides,
    vertices,
    area: { total: area, length: boundingDims.length, width: boundingDims.width },
    slopePercent: input.slope, spacingCm: 55,
    numLegs: input.numLegs, legHeight: input.legHeight,
    withDecor: input.withDecor, enableInsulation: input.enableInsulation, tile,
  }), [sides, vertices, area, boundingDims, input, tile, skeletonVer]);

  const costResult = useMemo(() => {
    if (!showPrices) return null;
    return calcCosts(result, prices, prices.nathrayat);
  }, [result, prices, showPrices]);

  const toggleHiddenItem = (id) => {
    setHiddenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (!closed) return;
    if (baseItemDefsRef.current.length === 0) return;
    setCustomFields(buildExtraFields(result, baseItemDefsRef.current));
  }, [result, closed, itemDefsKey]);

  useEffect(() => {
    if (showPrices) {
      setLoadingSuppliers(true);
      getSuppliersWithPrices().then((list) => {
        const enriched = list.map((s) => {
          const p = s.prices || {};
          const qtyTotal =
            (p.iron4x8 || 0) * result.iron4x8 +
            (p.iron10x10 || 0) * result.iron10x10.total +
            (p.tile || 0) * result.totalTiles +
            (p.decor || 0) * (result.decor?.bundles || 0) * (result.decor?.optimalLen || 0) +
            (p.besh || 0) * result.beshQty +
            (p.sharshef || 0) * (result.borders?.total || 0);
          return { ...s, estimatedTotal: qtyTotal };
        }).filter((s) => s.estimatedTotal > 0)
          .sort((a, b) => a.estimatedTotal - b.estimatedTotal);
        setSupplierPrices(enriched);
        setLoadingSuppliers(false);
      }).catch(() => setLoadingSuppliers(false));
    }
  }, [showPrices, result]);

  useEffect(() => {
    if (closed && !onboarding.state.firstResultCelebrated) {
      onboarding.markFirstResultCelebrated();
    }
  }, [closed]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="architect-grid-subtle"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex items-center gap-4 mb-6"
      >
        <div className="w-12 h-12 rounded-sm bg-terracotta-500 flex items-center justify-center border-l-3 border-terracotta-300">
          <Calculator className="w-6 h-6 text-paper" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-earth-900 tracking-tight">{t("nav.calculator")}</h1>
            {closed && (
              <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-olive-600 bg-olive-50 border border-olive-200 px-2 py-0.5 rounded-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-olive-600 animate-pulse" />
                {result.actualArea.toFixed(1)} {t("calculator.unit.m2")}
              </span>
            )}
          </div>
          <p className="text-xs text-earth-500 mt-0.5">
            {projectLoading ? (
              <span className="text-terracotta-500">{t("calculator.loadingProject")}</span>
            ) : projectData ? (
              <span>{t("calculator.projectLabel")} <strong className="text-terracotta-500">{projectData.client?.name}</strong> — {t("calculator.measurementsLoaded")}</span>
            ) : (
              t("calculator.drawHint")
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <AnimatePresence>
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="hidden sm:flex items-center gap-2 bg-olive-50 border border-olive-200 text-emerald-600 text-xs font-bold px-3 py-2 rounded-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t("calculator.savedFor", { name: saveSuccess })}</span>
                <button onClick={() => navigate(`/projects/${savedProjectId}`)}
                  className="text-terracotta-500 hover:text-terracotta-500 underline underline-offset-2">
                  {t("calculator.open")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          {closed && !saveSuccess && (
            <GlassButton variant="accent" size="sm" icon={<Save className="w-3.5 h-3.5" />} onClick={handleOpenSaveModal}>
              {t("calculator.saveForClient")}
            </GlassButton>
          )}
          {closed && saveSuccess && !projectData?.id && (
            <GlassButton variant="secondary" size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => { setSaveSuccess(null); setSavedProjectId(null); setSaveClient({ name: "", phone: "", address: "" }); }}>
              {t("calculator.saveNew")}
            </GlassButton>
          )}
          {projectData?.id && (
            <GlassButton variant="ghost" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => navigate(`/projects/${projectData.id}`)}>
              {t("calculator.backToProject")}
            </GlassButton>
          )}
        </div>
      </motion.div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">

          {/* Building Canvas */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            ref={canvasRef}
            className="glass-card overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-earth-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-terracotta-500" />
                <span className="text-xs font-bold text-earth-700">{t("calculator.canvasTitle")}</span>
              </div>
              {closed && (
                <span className="text-[9px] font-mono text-earth-500 bg-earth-100 px-2 py-1 rounded-sm border border-earth-200">
                  {t("calculator.pointsCount", { n: vertices.length })}
                </span>
              )}
            </div>
            {(vertices.length === 0 && !onboarding.state.welcomeDismissed) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mx-4 mb-4 p-3 rounded-sm bg-terracotta-50 border border-terracotta-200 flex items-start gap-3"
              >
                <Ruler className="w-4 h-4 text-terracotta-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-terracotta-700">{t("calculator.welcomeTitle")}</p>
                  <p className="text-[10px] text-terracotta-600 mt-0.5 leading-relaxed">
                    {t("calculator.welcomeBody")}
                  </p>
                </div>
                <button onClick={onboarding.dismissWelcome} className="text-terracotta-400 hover:text-terracotta-600 p-1 shrink-0 cursor-pointer" aria-label={t("calculator.dismiss")}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
            <div className="p-4">
              <BuildingCanvas
                vertices={vertices}
                sides={sides}
                onChange={setVertices}
                onToggleFacade={handleToggleFacade}
                onToggleActive={handleToggleActive}
                area={area}
                slope={input.slope}
              />
            </div>
          </motion.div>

          {/* Presets */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="glass-card p-4"
          >
            <RoofPresets onSelect={applyPreset} />
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="glass-card p-4"
          >
            {closed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-4 p-3 rounded-sm bg-terracotta-50 border border-terracotta-100"
              >
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: t("calculator.stats.roofArea"), value: result.actualArea.toFixed(1), unit: t("calculator.unit.m2"), accent: true },
                    { label: t("calculator.stats.floorArea"), value: area.toFixed(1), unit: t("calculator.unit.m2") },
                    { label: t("calculator.stats.perimeter"), value: sides.reduce((s, e) => s + e.length, 0).toFixed(1), unit: t("calculator.unit.m") },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-[9px] text-earth-500 font-medium">{item.label}</p>
                      <p className={`text-sm font-black font-mono mt-0.5 ${item.accent ? "text-terracotta-500" : "text-earth-900"}`}>
                        {item.value} <span className="text-[9px] text-earth-500 font-medium">{item.unit}</span>
                      </p>
                      {item.accent && <p className="text-[8px] text-earth-500">{t("calculator.stats.withSlope", { slope: input.slope })}</p>}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-earth-500 font-bold tracking-wider block">{t("calculator.numLegs")}</label>
                <input type="number" value={input.numLegs} onChange={h("numLegs")} min="2" max="20"
                  className="w-full bg-white border border-earth-300 rounded-sm py-2.5 px-3 text-earth-900 outline-none focus:border-terracotta-400 transition text-sm font-mono" />
                {recommendedLegs && <p className="text-[9px] text-earth-500 mt-1">{t("calculator.recommended")} <strong className="text-terracotta-500">{recommendedLegs.label}</strong></p>}
                {legAdvice && (
                  <p className={`text-[9px] mt-1 ${
                    legAdvice.type === "warning" ? "text-amber-400" :
                    legAdvice.type === "success" ? "text-emerald-600" : "text-terracotta-500"
                  }`}>
                    {legAdvice.text}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-earth-500 font-bold tracking-wider block">{t("calculator.legHeight")}</label>
                <input type="number" value={input.legHeight} onChange={h("legHeight")} step="0.1" min="1" max="5"
                  className="w-full bg-white border border-earth-300 rounded-sm py-2.5 px-3 text-earth-900 outline-none focus:border-terracotta-400 transition text-sm font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-earth-500 font-bold tracking-wider block">{t("calculator.tileType")}</label>
                <select value={input.tileIndex} onChange={hSel("tileIndex")}
                  className="w-full bg-white border border-earth-300 rounded-sm py-2.5 px-3 text-earth-900 outline-none focus:border-terracotta-400 transition text-sm">
                  {TILES_CATALOG.map((t, i) => (
                    <option key={i} value={i} className="bg-white">{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-earth-500 font-bold tracking-wider block">{t("calculator.slopePercent")}</label>
                <div className="flex items-center gap-2">
                  <input type="range" min="0" max="100" step="5" value={input.slope}
                    onChange={(e) => setInput((p) => ({ ...p, slope: Number(e.target.value) }))}
                    className="flex-1 h-1.5 appearance-none bg-amber-500/30 rounded-full cursor-pointer accent-amber-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:shadow-sm" />
                  <span className="min-w-[3rem] text-center font-black text-amber-600 text-sm">{input.slope}%</span>
                </div>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {[20, 30, 40, 50, 60, 70, 80, 100].map((v) => (
                    <button key={v} onClick={() => setInput((p) => ({ ...p, slope: v }))}
                      className={`px-2.5 py-1 rounded-sm text-[9px] font-bold border transition ${input.slope === v ? "bg-amber-100 border-amber-300 text-amber-600" : "bg-slate-100 border-slate-200 text-earth-500 hover:border-ice-blue-400"}`}>
                      {v}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <span
                className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-sm border transition cursor-pointer select-none ${
                  input.withDecor
                    ? "bg-terracotta-50 border border-terracotta-200 text-terracotta-500"
                    : "bg-white border border-earth-300 text-earth-500"
                }`}
                onClick={handleDecor}
              >
                <Sparkles className={`w-3 h-3 ${input.withDecor ? "text-terracotta-500" : ""}`} />
                {t("calculator.decor")}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-sm border transition cursor-pointer select-none ${
                  input.enableInsulation
                    ? "bg-terracotta-50 border border-terracotta-200 text-terracotta-500"
                    : "bg-white border border-earth-300 text-earth-500"
                }`}
                onClick={handleInsulation}
              >
                <Droplets className={`w-3 h-3 ${input.enableInsulation ? "text-terracotta-500" : ""}`} />
                {t("calculator.insulation")}
              </span>
              {closed && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-sm bg-white border border-earth-300 text-earth-500 select-none">
                  <Grid3x3 className="w-3 h-3" />
                  {t("calculator.facades", { count: facadeCount, total: sides.length })}
                </span>
              )}
            </div>
            {closed && !onboarding.state.decorHintSeen && (
              <div className="mt-4 p-3 rounded-sm bg-earth-100 border border-earth-200 flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1 text-[10px] leading-relaxed">
                  <p className="font-bold text-earth-800">{t("calculator.discoverTitle")}</p>
                  <p className="text-earth-600 mt-0.5">
                    {t("calculator.discoverBody")}
                  </p>
                </div>
                <button onClick={onboarding.dismissDecorHint} className="text-earth-400 hover:text-earth-600 p-0.5 shrink-0 cursor-pointer" aria-label={t("common.close")}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </motion.div>

          {/* Smart Assistant */}
          <AnimatePresence>
            {closed && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="glass-card p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h4 className="text-[10px] font-bold text-earth-700 tracking-wider">{t("calculator.smartAssistant")}</h4>
                </div>
                <div className="relative h-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={featureIdx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex items-center"
                    >
                      <div className="flex items-center gap-2 bg-earth-50 rounded-sm px-3 py-2 flex-1 border border-earth-200">
                        <span className="text-[10px] text-terracotta-500 font-bold whitespace-nowrap">{features[featureIdx].title}</span>
                        <span className="text-[9px] text-earth-500 truncate">{features[featureIdx].desc}</span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pricing Section */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="glass-card overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-earth-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-earth-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  {t("calculator.costTitle")}
                </h3>
                <p className="text-[9px] text-earth-500 mt-0.5">{t("calculator.costSubtitle")}</p>
              </div>
              <div className="relative flex items-center gap-2">
                <button
                  onClick={() => setShowPrices(!showPrices)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                      showPrices ? "bg-terracotta-200" : "bg-earth-200"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                    showPrices ? "translate-x-[22px]" : "translate-x-[2px]"
                  }`} />
                </button>
              </div>
            </div>
            <AnimatePresence>
              {showPrices && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-3 p-4">
                    {[
                      { key: "iron4x8", label: t("calculator.price.iron4x8") },
                      { key: "iron10x10", label: t("calculator.price.iron10x10") },
                      { key: "tile", label: t("calculator.price.tile") },
                      { key: "decor", label: t("calculator.price.decor") },
                      { key: "decorBrooz", label: t("calculator.price.decorBrooz") },
                      { key: "besh", label: t("calculator.price.besh") },
                      { key: "sharshef", label: t("calculator.price.sharshef") },
                      { key: "tarpaulin", label: t("calculator.price.tarpaulin") },
                      { key: "zafta", label: t("calculator.price.zafta") },
                      { key: "latiSheets", label: t("calculator.price.latiSheets") },
                      { key: "woodBases", label: t("calculator.price.woodBases") },
                      { key: "longAsas", label: t("calculator.price.longAsas") },
                      { key: "metalSheet", label: t("calculator.price.metalSheet") },
                      { key: "silicone", label: t("calculator.price.silicone") },
                    ].map(({ key, label }) => (
                      <div key={key} className="space-y-1">
                        <label className="text-[9px] text-earth-500 font-bold">{label}</label>
                        <input type="number" value={prices[key]}
                          onChange={(e) => setPrices((f) => ({ ...f, [key]: Number(e.target.value) }))} step="0.5"
                          className="w-full bg-white border border-earth-300 rounded-sm py-2 px-3 text-earth-900 outline-none focus:border-terracotta-400 transition text-xs font-mono" />
                      </div>
                    ))}
                    <div className="col-span-2 space-y-1">
                      <label className="text-[9px] text-earth-500 font-bold">{t("calculator.price.nathrayat")}</label>
                      <input type="number" value={prices.nathrayat}
                        onChange={(e) => setPrices((f) => ({ ...f, nathrayat: Number(e.target.value) }))} step="10"
                        className="w-full bg-white border border-earth-300 rounded-sm py-2 px-3 text-earth-900 outline-none focus:border-terracotta-400 transition text-xs font-mono" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Extra Materials */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="glass-card overflow-hidden"
          >
            <button onClick={() => setShowExtra(!showExtra)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-earth-900 hover:bg-earth-50 transition cursor-pointer">
              <span className="flex items-center gap-2">
                <PackageOpen className="w-4 h-4 text-earth-500" />
                {t("calculator.extraMaterials")} ({customFields.length})
              </span>
              {showExtra ? <ChevronUp className="w-3.5 h-3.5 text-earth-500" /> : <ChevronDown className="w-3.5 h-3.5 text-earth-500" />}
            </button>
            <AnimatePresence>
              {showExtra && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-1.5">
                    {customFields.map((cf, i) => (
                      <div key={i} draggable
                        onDragStart={() => setDragIdx(i)}
                        onDragOver={(e) => { e.preventDefault(); }}
                        onDrop={() => {
                          if (dragIdx === null || dragIdx === i) return;
                          const c = [...customFields];
                          const [moved] = c.splice(dragIdx, 1);
                          c.splice(i, 0, moved);
                          setCustomFields(c);
                          setDragIdx(null);
                        }}
                        onDragEnd={() => setDragIdx(null)}
                        className={`flex items-center gap-2 p-1.5 rounded-sm transition ${dragIdx === i ? "opacity-40" : "bg-white border border-earth-200"}`}>
                        <GripVertical className="w-3.5 h-3.5 text-earth-500 cursor-grab shrink-0" />
                        <input placeholder={t("calculator.materialName")} value={cf.name} onChange={(e) => {
                          const c = [...customFields]; c[i] = { ...c[i], name: e.target.value }; setCustomFields(c);
                        }} className="flex-1 bg-white border border-earth-300 rounded-sm py-2 px-3 text-xs text-earth-900 outline-none focus:border-terracotta-400 transition" />
                        <input placeholder={t("calculator.qty")} inputMode="decimal" value={cf.value} onChange={(e) => {
                          const c = [...customFields]; c[i] = { ...c[i], value: e.target.value }; setCustomFields(c);
                        }} className="w-16 bg-white border border-earth-300 rounded-sm py-2 px-3 text-xs text-earth-900 outline-none focus:border-terracotta-400 transition text-center font-mono" />
                        <input placeholder={t("calculator.unitLabel")} value={cf.unit || ""} onChange={(e) => {
                          const c = [...customFields]; c[i] = { ...c[i], unit: e.target.value }; setCustomFields(c);
                        }} className="w-14 bg-white border border-earth-300 rounded-sm py-2 px-3 text-xs text-earth-900 outline-none focus:border-terracotta-400 transition text-center" />
                        <button onClick={() => setCustomFields(customFields.filter((_, idx) => idx !== i))}
                          className="text-red-400 hover:text-red-300 p-1.5 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => setCustomFields([...customFields, { name: "", value: "0", unit: "" }])}
                      className="w-full border-2 border-dashed border-slate-200 rounded-sm py-3 text-xs text-earth-500 hover:text-earth-700 hover:border-slate-300 transition flex items-center justify-center gap-1.5 mt-2 cursor-pointer">
                      <Plus className="w-3.5 h-3.5" /> {t("calculator.addMaterial")}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Right: Result Panel */}
        <div className="lg:col-span-2 space-y-4">
          <ResultPanel
            result={result}
            tile={tile}
            input={input}
            customFields={customFields}
            hiddenItems={hiddenItems}
            toggleHiddenItem={toggleHiddenItem}
            costResult={costResult}
            prices={prices}
            showPrices={showPrices}
            closed={closed}
            area={area}
            sides={sides}
            projectData={projectData}
            onPrintQuotation={() => costResult && downloadQuotation(result, costResult, tile, prices, { client: { name: projectData?.client?.name || "ورشة حالية" } }, companyName)}
            onPrintDistribution={async () => {
              const svgEl = canvasRef.current?.querySelector("svg");
              let png = null;
              if (svgEl) try {
                const clone = svgEl.cloneNode(true);
                fitSvgToBounds(clone, vertices);
                png = await svgToPngDataUrl(clone, 800);
              } catch {}
              localStorage.setItem("distribution_data", JSON.stringify({ result, sides, vertices, input: { numLegs: input.numLegs, legHeight: input.legHeight, slope: input.slope }, companyName, roofPng: png }));
              navigate("/distribution");
            }}
            onPrintIronFrame={async () => {
              const svgEl = canvasRef.current?.querySelector("svg");
              let png = null;
              if (svgEl && vertices.length > 0) {
                try {
                  const clone = svgEl.cloneNode(true);
                  fitSvgToBounds(clone, vertices);
                  png = await svgToPngDataUrl(clone, 1200);
                } catch {}
              }
              localStorage.setItem("iron_frame_data", JSON.stringify({
                result, sides, vertices, input: { numLegs: input.numLegs, legHeight: input.legHeight, slope: input.slope },
                companyName, roofPng: png,
              }));
              navigate("/iron-print");
            }}
            onWhatsAppSend={() => {
              const clientName = projectData?.client?.name || saveClient?.name || "";
              if (projectData?.id) {
                navigate(`/projects/${projectData.id}/workshop-estimate`);
              } else {
                localStorage.setItem("workshop_estimate_data", JSON.stringify({
                  items: [
                    { name: tile?.name || "قرميد", qty: result.totalTiles, unit: "حبة" },
                    { name: "حديد 4×8", qty: result.iron4x8, unit: "تيوب" },
                    { name: "حديد 10×10", qty: result.iron10x10?.total || 0, unit: "تيوب" },
                    { name: "ديكور", qty: result.decor?.bundles || 0, unit: "ربطة" },
                    { name: "البيش", qty: result.beshQty || 0, unit: "وحدة" },
                    ...customFields.filter((cf) => cf.name).map((cf) => ({ name: cf.name, qty: parseFloat(cf.value) || 0, unit: cf.unit || "" })),
                  ],
                  clientName,
                  clientPhone: saveClient?.phone || projectData?.client?.phone || "",
                }));
                navigate("/workshop-estimate");
              }
            }}
            loadingSuppliers={loadingSuppliers}
            supplierPrices={supplierPrices}
          />
          {closed && !onboarding.state.exportHintSeen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="flex items-center gap-2 p-3 rounded-sm bg-terracotta-50 border border-terracotta-200"
            >
              <FileText className="w-4 h-4 text-terracotta-500 shrink-0" />
              <p className="text-[10px] text-terracotta-700 font-bold flex-1">
                صدّر كشف المواد أو عرض السعر للعميل بصيغة PDF
              </p>
              <button onClick={onboarding.dismissExportHint} className="text-terracotta-400 hover:text-terracotta-600 p-0.5 shrink-0 cursor-pointer" aria-label="إغلاق">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
          {/* First calculation celebration */}
          <AnimatePresence>
            {closed && onboarding.state.firstResultCelebrated && !onboarding.state.welcomeDismissed && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="bg-olive-50 border border-olive-200 border-r-3 rounded-sm p-3 flex items-start gap-2.5"
                style={{ borderRightColor: "#6b7c5e" }}
              >
                <Check className="w-4 h-4 text-olive-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-olive-700">تم حساب الكميات!</p>
                  <p className="text-[9px] text-olive-600 mt-0.5 leading-relaxed">
                    {result.totalTiles} حبة قرميد · {result.iron4x8} تيوب حديد 4×8 · {result.beshQty} حبة بيش
                  </p>
                </div>
                <button
                  onClick={() => {
                    onboarding.dismissWelcome();
                    onboarding.dismissExportHint();
                    onboarding.dismissSaveHint();
                    onboarding.dismissPricingHint();
                    onboarding.dismissDecorHint();
                    onboarding.dismissInsulationHint();
                  }}
                  className="text-olive-400 hover:text-olive-600 p-0.5 shrink-0 cursor-pointer"
                  aria-label="إغلاق"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>



      {/* ========== SAVE MODAL ========== */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSaveModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-sm border border-earth-200 p-6 md:p-8 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-black text-earth-900 flex items-center gap-2">
                  <Save className="w-4 h-4 text-amber-400" />
                  حفظ للعميل
                </h3>
                <button onClick={() => setShowSaveModal(false)} className="text-earth-500 hover:text-earth-700 transition p-1 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {closed && (
                <div className="mb-4 p-3 rounded-sm bg-terracotta-50 border border-terracotta-100 text-xs text-terracotta-500 flex items-center gap-2">
                  <Ruler className="w-4 h-4 shrink-0" />
                  <span>المساحة: <strong className="text-earth-900">{area.toFixed(1)} م²</strong> · مع الميل: <strong className="text-earth-900">{result.actualArea.toFixed(1)} م²</strong></span>
                </div>
              )}

              <form onSubmit={handleSaveProject} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-earth-500 tracking-wider">اسم العميل <span className="text-red-400">*</span></label>
                  <input type="text" value={saveClient.name} onChange={(e) => setSaveClient({ ...saveClient, name: e.target.value })}
                    required placeholder="محمد أحمد"
                    className="w-full bg-white border border-earth-300 rounded-sm py-3 px-4 text-earth-900 outline-none focus:border-terracotta-400 transition text-sm placeholder:text-earth-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-earth-500 tracking-wider">رقم الهاتف</label>
                  <input type="text" value={saveClient.phone} onChange={(e) => setSaveClient({ ...saveClient, phone: e.target.value })}
                    dir="ltr" placeholder="079xxxxxxx"
                    className="w-full bg-white border border-earth-300 rounded-sm py-3 px-4 text-earth-900 outline-none focus:border-terracotta-400 transition text-sm placeholder:text-earth-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-earth-500 tracking-wider">العنوان</label>
                  <input type="text" value={saveClient.address} onChange={(e) => setSaveClient({ ...saveClient, address: e.target.value })}
                    placeholder="عمان - طبربور"
                    className="w-full bg-white border border-earth-300 rounded-sm py-3 px-4 text-earth-900 outline-none focus:border-terracotta-400 transition text-sm placeholder:text-earth-500" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowSaveModal(false)}
                    className="flex-1 bg-white hover:bg-earth-50 text-earth-700 font-bold py-3 rounded-sm transition text-sm cursor-pointer border-2 border-slate-200">
                    إلغاء
                  </button>
                  <button type="submit" disabled={saveLoading || !saveClient.name.trim()}
                    className="flex-[2] bg-amber-100 hover:bg-amber-200 border border-amber-200 disabled:opacity-40 text-amber-600 font-bold py-3 rounded-sm transition text-sm flex items-center justify-center gap-2 cursor-pointer">
                    {saveLoading ? "..." : <><Check className="w-4 h-4" /> حفظ المشروع</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== SAVE SUCCESS ========== */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 glass-card rounded-sm px-5 py-3.5 flex items-center gap-3 shadow-2xl"
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-earth-900">محفوظ لـ {saveSuccess}</span>
            </div>
            <div className="w-px h-5 bg-slate-200" />
            <button onClick={() => navigate("/projects")}
              className="bg-earth-100 hover:bg-earth-200 text-earth-700 font-bold py-1.5 px-3 rounded-sm transition text-[10px] cursor-pointer border-2 border-earth-200">
              عرض في المشاريع
            </button>
            {saveClient.phone && (
              <button onClick={() => {
                const lines = [];
                lines.push(`*🧱 القرميد*`);
                lines.push(`${tile?.name || ""}: ${result.totalTiles} حبة`);
                lines.push(`*🔩 الحديد*`);
                lines.push(`حديد 4×8: ${result.iron4x8} تيوب`);
                lines.push(`حديد 10×10: ${result.iron10x10.total} تيوب`);
                lines.push(`*🪵 الخشب*`);
                if (input.withDecor) lines.push(`ديكور: ${result.decor.bundles} ربطة`);
                lines.push(`البيش: ${result.beshQty} وحدة`);
                lines.push(`*💧 عزل*`);
                lines.push(`مشمع: ${result.tarpaulin.text}`);
                const msg = `📋 *كشف المواد — ${saveSuccess}*\nالمساحة: ${area.toFixed(1)} م² | مع الميل: ${result.actualArea.toFixed(1)} م²\n\n${lines.join("\n")}`;
                window.open(`https://wa.me/${saveClient.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
              }}
                className="bg-emerald-100 hover:bg-emerald-200 text-emerald-600 font-bold py-1.5 px-3 rounded-sm transition text-[10px] flex items-center gap-1.5 cursor-pointer border-2 border-emerald-200">
                <Send className="w-3 h-3" /> واتساب
              </button>
            )}
            <button onClick={() => setSaveSuccess(null)} className="text-earth-500 hover:text-earth-700 transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
