"use client";

import { Dices, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { DiceBearAvatar, DiceBearOptionValue, DiceBearStyle } from "../types/avatar";

const STYLES: { value: DiceBearStyle; label: string }[] = [
  { value: "lorelei", label: "Lorelei" },
  { value: "notionists", label: "Notionists" },
  { value: "thumbs", label: "Thumbs" },
];

/** Returns a valid minimal local DiceBear draft for the selected style. */
export function diceBear(style: DiceBearStyle = "lorelei", seed = "avatar"): DiceBearAvatar {
  return { type: "dicebear", style, seed, options: {} };
}

/** Replaces one optional scalar DiceBear control without allowing an invalid empty value through. */
function withOption(value: DiceBearAvatar, key: string, option: DiceBearOptionValue | undefined): DiceBearAvatar {
  const options = { ...value.options };
  if (option === undefined) delete options[key];
  else options[key] = option;
  return { ...value, options };
}

/** Presents the controlled DiceBear option surface the API validates, shared by both avatar screens. */
export function DiceBearFields({ value, onChange }: { value: DiceBearAvatar; onChange: (value: DiceBearAvatar) => void }) {
  const numberOption = (key: string): string => typeof value.options[key] === "number" ? String(value.options[key]) : "";
  const updateNumber = (key: string, raw: string, min: number, max: number) => {
    const parsed = Number(raw);
    onChange(withOption(value, key, raw === "" || !Number.isInteger(parsed) || parsed < min || parsed > max ? undefined : parsed));
  };

  return (
    <div className="grid gap-4 rounded-lg border p-4 dark:border-input">
      <div className="grid gap-2 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="avatar-style">Kiểu</Label><Select value={value.style} onValueChange={(style) => onChange(diceBear(style as DiceBearStyle, value.seed))}><SelectTrigger id="avatar-style"><SelectValue /></SelectTrigger><SelectContent>{STYLES.map((style) => <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label htmlFor="avatar-seed">Seed</Label><div className="flex gap-2"><Input id="avatar-seed" value={value.seed} maxLength={128} onChange={(event) => onChange({ ...value, seed: event.target.value })} /><Button type="button" variant="outline" size="icon" aria-label="Tạo seed mới" onClick={() => onChange({ ...value, seed: crypto.randomUUID() })}><Dices aria-hidden="true" /></Button></div></div></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="grid gap-2"><Label htmlFor="avatar-hair">Biến thể tóc (Lorelei)</Label><Select disabled={value.style !== "lorelei"} value={typeof value.options.hairVariant === "string" ? value.options.hairVariant : "none"} onValueChange={(next) => onChange(withOption(value, "hairVariant", next === "none" ? undefined : next))}><SelectTrigger id="avatar-hair"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Mặc định</SelectItem><SelectItem value="variant01">variant01</SelectItem></SelectContent></Select></div><div className="grid gap-2"><Label htmlFor="avatar-probability">Xác suất tóc (Lorelei)</Label><Input id="avatar-probability" disabled={value.style !== "lorelei"} type="number" min="0" max="100" value={numberOption("hairProbability")} onChange={(event) => updateNumber("hairProbability", event.target.value, 0, 100)} /></div><div className="grid gap-2"><Label htmlFor="avatar-color">Màu nền</Label><Input id="avatar-color" type="color" value={typeof value.options.backgroundColor === "string" ? value.options.backgroundColor : "#e2e8f0"} onChange={(event) => onChange(withOption(value, "backgroundColor", event.target.value))} /></div><div className="grid gap-2"><Label htmlFor="avatar-scale">Tỷ lệ</Label><Input id="avatar-scale" type="number" min="0" max="10" value={numberOption("scale")} onChange={(event) => updateNumber("scale", event.target.value, 0, 10)} /></div></div>
      <div className="grid gap-3 sm:grid-cols-3"><div className="grid gap-2"><Label htmlFor="avatar-rotate">Xoay</Label><Input id="avatar-rotate" type="number" min="-360" max="360" value={numberOption("rotate")} onChange={(event) => updateNumber("rotate", event.target.value, -360, 360)} /></div><div className="grid gap-2"><Label htmlFor="avatar-x">Dịch ngang</Label><Input id="avatar-x" type="number" min="-1000" max="1000" value={numberOption("translateX")} onChange={(event) => updateNumber("translateX", event.target.value, -1000, 1000)} /></div><div className="grid gap-2"><Label htmlFor="avatar-y">Dịch dọc</Label><Input id="avatar-y" type="number" min="-1000" max="1000" value={numberOption("translateY")} onChange={(event) => updateNumber("translateY", event.target.value, -1000, 1000)} /></div></div>
      <Button type="button" variant="outline" className="w-fit" onClick={() => onChange({ ...value, options: {} })}><RotateCcw aria-hidden="true" />Đặt lại tùy chọn</Button>
    </div>
  );
}
