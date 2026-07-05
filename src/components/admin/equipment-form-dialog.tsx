"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createEquipment, updateEquipment } from "@/app/admin/equipment/actions";
import type { Equipment, EquipmentCategory, EquipmentCondition } from "@/types/models";
import { Loader2, Pencil, Plus } from "lucide-react";

const CATEGORIES: EquipmentCategory[] = [
  "camera",
  "lens",
  "lighting",
  "audio",
  "accessory",
  "other",
];
const CONDITIONS: EquipmentCondition[] = [
  "new",
  "excellent",
  "good",
  "fair",
  "needs_repair",
];

export function EquipmentFormDialog({ equipment }: { equipment?: Equipment }) {
  const isEdit = Boolean(equipment);
  const [open, setOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(equipment?.is_available ?? true);
  const [category, setCategory] = useState<EquipmentCategory>(
    equipment?.category ?? "camera"
  );
  const [condition, setCondition] = useState<EquipmentCondition>(
    equipment?.condition ?? "good"
  );
  const [imagePreview, setImagePreview] = useState<string | null>(
    equipment?.image_url ?? null
  );
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    formData.set("category", category);
    formData.set("condition", condition);
    if (isAvailable) formData.set("is_available", "on");

    startTransition(async () => {
      try {
        if (isEdit && equipment) {
          await updateEquipment(equipment.id, formData);
          toast.success("Equipment updated.");
        } else {
          await createEquipment(formData);
          toast.success("Equipment added.");
        }
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setImagePreview(equipment?.image_url ?? null);
      }}
    >
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon" aria-label="Edit equipment">
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="size-4" />
            Add Equipment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-heading">
              {isEdit ? "Edit Equipment" : "Add Equipment"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update the details for this item."
                : "Add a new item to the rental catalog."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={equipment?.name}
                placeholder="Canon EOS R5"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="image">Photo</Label>
              <div className="flex items-center gap-4">
                {imagePreview && (
                  <Image
                    src={imagePreview}
                    alt=""
                    width={64}
                    height={64}
                    unoptimized
                    className="size-16 shrink-0 rounded-md border border-border/60 object-cover"
                  />
                )}
                <Input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setImagePreview(URL.createObjectURL(file));
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as EquipmentCategory)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Condition</Label>
              <Select
                value={condition}
                onValueChange={(v) => setCondition(v as EquipmentCondition)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" name="brand" defaultValue={equipment?.brand ?? ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input id="model" name="model" defaultValue={equipment?.model ?? ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="daily_rate">Rate — 1-3 days (₱)</Label>
              <Input
                id="daily_rate"
                name="daily_rate"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={equipment?.daily_rate ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="extended_daily_rate">Rate — 4+ days (₱)</Label>
              <Input
                id="extended_daily_rate"
                name="extended_daily_rate"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={equipment?.extended_daily_rate ?? ""}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={equipment?.description ?? ""}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 sm:col-span-2">
              <Label htmlFor="is_available" className="cursor-pointer">
                Available for booking
              </Label>
              <Switch
                id="is_available"
                checked={isAvailable}
                onCheckedChange={setIsAvailable}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Add Equipment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
