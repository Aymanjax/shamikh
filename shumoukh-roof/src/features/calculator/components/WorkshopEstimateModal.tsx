// @ts-nocheck
import { useState } from "react";
import { X, Send, MessageCircle } from "lucide-react";

interface WaItem {
  name: string;
  qty: number;
  unit: string;
}

interface Props {
  items: WaItem[];
  clientPhone: string;
  onClose: () => void;
}

export default function WorkshopEstimateModal({ items, clientPhone, onClose }: Props) {
  const [editItems, setEditItems] = useState<WaItem[]>(
    items.filter((i) => i.qty > 0).map((i) => ({ ...i }))
  );

  const updateQty = (index: number, value: string) => {
    setEditItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, qty: parseFloat(value) || 0 } : item))
    );
  };

  const handleSend = () => {
    const lines = editItems
      .filter((i) => i.qty > 0)
      .map((i) => `- ${i.name}: ${i.qty} ${i.unit}`)
      .join("\n");
    const msg = `كشف المواد:\n${lines}`;
    const phone = clientPhone.replace(/[^0-9]/g, "");
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-earth-200 rounded-sm p-5 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-earth-900 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-green-600" />
            كشف المواد - واتساب
          </h3>
          <button
            onClick={onClose}
            className="text-earth-500 hover:text-earth-700 transition p-1 cursor-pointer rounded-sm"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-earth-500 mb-3 font-medium">
          اضغط على الكمية لتعديلها، ثم أرسل الكشف عبر واتساب
        </p>

        <div className="space-y-1.5 mb-4 max-h-72 overflow-y-auto">
          {editItems.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2 bg-earth-50 border border-earth-200 rounded-sm"
            >
              <span className="flex-1 text-xs font-bold text-earth-900 truncate">{item.name}</span>
              <input
                type="number"
                value={item.qty}
                onChange={(e) => updateQty(i, e.target.value)}
                className="w-16 text-center text-xs font-black font-mono text-earth-900 bg-white border border-earth-300 rounded-sm py-1 px-1 outline-none focus:border-olive-500 focus:ring-1 focus:ring-olive-200 transition"
                min={0}
              />
              <span className="text-[10px] text-earth-500 font-medium w-10 text-right shrink-0">
                {item.unit}
              </span>
            </div>
          ))}
        </div>

        {clientPhone && (
          <p className="text-[10px] text-earth-500 mb-3 font-mono">
            الإرسال إلى: {clientPhone}
          </p>
        )}

        <button
          onClick={handleSend}
          className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-black py-2.5 rounded-sm transition text-sm flex items-center justify-center gap-2 cursor-pointer border-r-3 border-green-800"
        >
          <Send className="w-4 h-4" />
          إرسال عبر واتساب
        </button>
      </div>
    </div>
  );
}
