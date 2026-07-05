"use client";

import { useRef, useState } from "react";
import { Eraser, PenLine, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { SignatureMethod } from "@/types/models";

/**
 * Captures a signature either as typed text or a drawn stroke. Keeps a
 * hidden file input in sync with the canvas (via DataTransfer) so the
 * parent's native <form action={...}> submission picks it up untouched.
 */
export function SignaturePad({ className }: { className?: string }) {
  const [method, setMethod] = useState<SignatureMethod>("typed");
  const [typedText, setTypedText] = useState("");
  const [hasDrawing, setHasDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawingRef = useRef(false);

  function getCanvasPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const { x, y } = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const { x, y } = getCanvasPoint(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "currentColor";
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawing(true);
  }

  async function handlePointerUp() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    await syncCanvasToFileInput();
  }

  async function syncCanvasToFileInput() {
    const canvas = canvasRef.current;
    const input = fileInputRef.current;
    if (!canvas || !input) return;

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    if (!blob) return;

    const file = new File([blob], "signature.png", { type: "image/png" });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setHasDrawing(false);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <input type="hidden" name="signature_method" value={method} />

      <RadioGroup
        value={method}
        onValueChange={(v) => setMethod(v as SignatureMethod)}
        className="grid-flow-col justify-start gap-6"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="typed" id="sig-typed" />
          <Label htmlFor="sig-typed" className="cursor-pointer font-normal">
            <Type className="size-3.5" /> Type my name
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="drawn" id="sig-drawn" />
          <Label htmlFor="sig-drawn" className="cursor-pointer font-normal">
            <PenLine className="size-3.5" /> Draw my signature
          </Label>
        </div>
      </RadioGroup>

      {method === "typed" ? (
        <Input
          name="signature_text"
          required={method === "typed"}
          value={typedText}
          onChange={(e) => setTypedText(e.target.value)}
          placeholder="Type your full legal name"
          className="font-heading text-lg italic"
        />
      ) : (
        <div className="space-y-2">
          <div className="relative rounded-md border border-input bg-background">
            <canvas
              ref={canvasRef}
              width={500}
              height={160}
              className="h-40 w-full touch-none rounded-md text-foreground"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
            {!hasDrawing && (
              <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                Draw your signature here
              </p>
            )}
          </div>
          <input ref={fileInputRef} type="file" name="signature_file" className="hidden" />
          <Button type="button" variant="outline" size="sm" onClick={handleClear}>
            <Eraser className="size-3.5" />
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
