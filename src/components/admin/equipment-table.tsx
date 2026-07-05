"use client";

import { useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EquipmentFormDialog } from "@/components/admin/equipment-form-dialog";
import { deleteEquipment, toggleAvailability } from "@/app/admin/equipment/actions";
import type { Equipment } from "@/types/models";
import { formatCurrency } from "@/lib/utils";
import { Camera, Trash2 } from "lucide-react";

export function EquipmentTable({ equipment }: { equipment: Equipment[] }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle(id: string, next: boolean) {
    startTransition(async () => {
      try {
        await toggleAvailability(id, next);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed.");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteEquipment(id);
        toast.success("Equipment removed.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Delete failed.");
      }
    });
  }

  if (equipment.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
        No equipment yet. Add your first item to get started.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border/60">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Photo</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Rate / Day</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead>Available</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {equipment.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    width={40}
                    height={40}
                    unoptimized
                    className="size-10 rounded-md border border-border/60 object-cover"
                  />
                ) : (
                  <div className="flex size-10 items-center justify-center rounded-md border border-dashed border-border/60 text-muted-foreground">
                    <Camera className="size-4" />
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="font-medium">{item.name}</div>
                {(item.brand || item.model) && (
                  <div className="text-xs text-muted-foreground">
                    {[item.brand, item.model].filter(Boolean).join(" ")}
                  </div>
                )}
              </TableCell>
              <TableCell className="capitalize">{item.category}</TableCell>
              <TableCell className="text-sm">
                <div>{formatCurrency(item.daily_rate)} (1-3d)</div>
                <div className="text-muted-foreground">
                  {formatCurrency(item.extended_daily_rate)} (4+d)
                </div>
              </TableCell>
              <TableCell className="capitalize">
                {item.condition.replace("_", " ")}
              </TableCell>
              <TableCell>
                <Switch
                  checked={item.is_available}
                  disabled={isPending}
                  onCheckedChange={(next) => handleToggle(item.id, next)}
                />
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <EquipmentFormDialog equipment={item} />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete equipment"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {item.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This can&apos;t be undone. Any bookings referencing this
                          item will be affected.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(item.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
