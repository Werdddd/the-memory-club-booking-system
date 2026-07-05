"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { setEquipmentAddons } from "@/app/admin/addons/actions";
import type { Equipment } from "@/types/models";

function toggleInSet(set: Set<string>, value: string): Set<string> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export function AddonManager({
  cameras,
  accessories,
  initialMap,
}: {
  cameras: Equipment[];
  accessories: Equipment[];
  initialMap: Record<string, string[]>;
}) {
  if (cameras.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
        Add a camera to the catalog first, then come back to configure its
        add-ons.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {cameras.map((camera) => (
        <CameraAddonCard
          key={camera.id}
          camera={camera}
          accessories={accessories}
          initialSelection={initialMap[camera.id] ?? []}
        />
      ))}
    </div>
  );
}

function CameraAddonCard({
  camera,
  accessories,
  initialSelection,
}: {
  camera: Equipment;
  accessories: Equipment[];
  initialSelection: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelection));
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      try {
        await setEquipmentAddons(camera.id, [...selected]);
        toast.success(`Add-ons updated for ${camera.name}.`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{camera.name}</CardTitle>
        <CardDescription>
          Choose which accessories show up as add-ons when a customer picks
          this camera on the rental form.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {accessories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No accessories in the catalog yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {accessories.map((item) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 p-2 text-sm hover:border-gold/40"
              >
                <Checkbox
                  checked={selected.has(item.id)}
                  onCheckedChange={() => setSelected((prev) => toggleInSet(prev, item.id))}
                />
                {item.name}
              </label>
            ))}
          </div>
        )}
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : "Save"}
        </Button>
      </CardContent>
    </Card>
  );
}
