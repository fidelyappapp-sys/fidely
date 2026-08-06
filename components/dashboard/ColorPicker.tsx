"use client";

import { useEffect, useRef, useState } from "react";
import { clamp, hexToRgb, hsvToRgb, isValidHex, rgbToHex, rgbToHsv, type HSV, type RGB } from "@/lib/color";

const PRESETS = ["#111827", "#4f46e5", "#0891b2", "#059669", "#d97706", "#dc2626", "#db2777", "#7c3aed"];

type Mode = "grid" | "spectrum" | "sliders";

export function ColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [mode, setMode] = useState<Mode>("grid");

  // Sourced from `value` only when switching into a tab, not on every
  // keystroke — hue/rgb are lost at the extremes of a hex round-trip
  // (e.g. saturation 0 has no hue), which would otherwise make the
  // spectrum cursor or sliders jump around while the user is dragging.
  const [hsv, setHsv] = useState<HSV>(() => rgbToHsv(hexToRgb(value)));
  const [rgb, setRgb] = useState<RGB>(() => hexToRgb(value));
  const [hexInput, setHexInput] = useState(value);

  useEffect(() => {
    if (mode === "spectrum") setHsv(rgbToHsv(hexToRgb(value)));
    if (mode === "sliders") setRgb(hexToRgb(value));
    setHexInput(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    setHexInput(value);
  }, [value]);

  const squareRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  // Read inside the window-level mousemove listener below instead of the
  // hsv state directly — that listener is attached once on mount, so a
  // stale closure would otherwise freeze hue at whatever it was when the
  // drag started.
  const hsvRef = useRef(hsv);
  useEffect(() => {
    hsvRef.current = hsv;
  }, [hsv]);

  function updateFromSquare(clientX: number, clientY: number) {
    const rect = squareRef.current?.getBoundingClientRect();
    if (!rect) return;
    const s = clamp((clientX - rect.left) / rect.width, 0, 1);
    const v = clamp(1 - (clientY - rect.top) / rect.height, 0, 1);
    const next = { h: hsvRef.current.h, s, v };
    setHsv(next);
    onChange(rgbToHex(hsvToRgb(next)));
  }

  // Plain mouse events (not Pointer Events) plus window-level listeners so
  // dragging keeps tracking even if the cursor leaves the square mid-drag.
  useEffect(() => {
    function handleMove(e: MouseEvent) {
      if (draggingRef.current) updateFromSquare(e.clientX, e.clientY);
    }
    function handleUp() {
      draggingRef.current = false;
    }
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleHueChange(nextHue: number) {
    const next = { ...hsv, h: nextHue };
    setHsv(next);
    onChange(rgbToHex(hsvToRgb(next)));
  }

  function handleRgbChange(next: RGB) {
    setRgb(next);
    onChange(rgbToHex(next));
  }

  function handleHexInput(raw: string) {
    const next = raw.startsWith("#") ? raw : `#${raw}`;
    setHexInput(next);
    if (isValidHex(next)) onChange(next);
  }

  return (
    <div>
      <div className="inline-flex rounded-lg border border-gray-200 p-0.5 text-xs">
        {(
          [
            ["grid", "Grille"],
            ["spectrum", "Spectre"],
            ["sliders", "Curseurs"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={`rounded-md px-3 py-1.5 font-medium transition ${
              mode === key ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3">
        {mode === "grid" && (
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onChange(preset)}
                aria-label={preset}
                className={`h-8 w-8 rounded-full ring-2 ring-offset-2 transition ${
                  value.toLowerCase() === preset ? "ring-gray-900" : "ring-transparent"
                }`}
                style={{ backgroundColor: preset }}
              />
            ))}
            <span
              className="h-8 w-8 rounded-full border border-gray-200"
              style={{ backgroundColor: value }}
              title={value}
            />
          </div>
        )}

        {mode === "spectrum" && (
          <div className="max-w-xs space-y-3">
            <div
              ref={squareRef}
              className="relative h-40 w-full cursor-crosshair rounded-lg select-none"
              style={{
                backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
                backgroundImage:
                  "linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, rgba(255,255,255,0))",
              }}
              onMouseDown={(e) => {
                draggingRef.current = true;
                updateFromSquare(e.clientX, e.clientY);
              }}
            >
              <div
                className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
              />
            </div>

            <input
              type="range"
              min={0}
              max={360}
              value={hsv.h}
              onChange={(e) => handleHueChange(Number(e.target.value))}
              className="h-3 w-full cursor-pointer appearance-none rounded-full"
              style={{
                background:
                  "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
              }}
            />

            <div className="flex items-center gap-2">
              <span
                className="h-8 w-8 shrink-0 rounded-full border border-gray-200"
                style={{ backgroundColor: value }}
              />
              <input
                type="text"
                value={hexInput}
                onChange={(e) => handleHexInput(e.target.value)}
                maxLength={7}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm uppercase focus:border-gray-900 focus:outline-none"
              />
            </div>
          </div>
        )}

        {mode === "sliders" && (
          <div className="max-w-xs space-y-3">
            {(
              [
                ["r", "Rouge"],
                ["g", "Vert"],
                ["b", "Bleu"],
              ] as const
            ).map(([channel, label]) => (
              <div key={channel} className="flex items-center gap-3">
                <span className="w-14 shrink-0 text-xs text-gray-500">{label}</span>
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={rgb[channel]}
                  onChange={(e) => handleRgbChange({ ...rgb, [channel]: Number(e.target.value) })}
                  className="w-full cursor-pointer"
                />
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={Math.round(rgb[channel])}
                  onChange={(e) =>
                    handleRgbChange({ ...rgb, [channel]: clamp(Number(e.target.value) || 0, 0, 255) })
                  }
                  className="w-14 shrink-0 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-gray-900 focus:outline-none"
                />
              </div>
            ))}

            <div className="flex items-center gap-2 pt-1">
              <span
                className="h-8 w-8 shrink-0 rounded-full border border-gray-200"
                style={{ backgroundColor: value }}
              />
              <input
                type="text"
                value={hexInput}
                onChange={(e) => handleHexInput(e.target.value)}
                maxLength={7}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm uppercase focus:border-gray-900 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
