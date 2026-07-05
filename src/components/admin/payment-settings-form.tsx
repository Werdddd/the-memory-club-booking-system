"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { updatePaymentQr } from "@/app/admin/settings/actions";

export function PaymentSettingsForm({ qrCodeUrl }: { qrCodeUrl: string | null }) {
  const [preview, setPreview] = useState<string | null>(qrCodeUrl);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        await updatePaymentQr(formData);
        toast.success("Payment QR code updated.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed.");
      }
    });
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="size-4 text-gold" /> Payment QR Code
        </CardTitle>
        <CardDescription>
          Shown to customers on the rental form so they can pay via GCash,
          bank transfer, or another QR-based method.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {preview ? (
            <Image
              src={preview}
              alt="Payment QR code"
              width={180}
              height={180}
              unoptimized
              className="rounded-md border border-border/60"
            />
          ) : (
            <div className="flex size-[180px] items-center justify-center rounded-md border border-dashed border-border/60 text-muted-foreground">
              <QrCode className="size-8" strokeWidth={1.5} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="qr_code">Upload new QR code</Label>
            <Input
              id="qr_code"
              name="qr_code"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPreview(URL.createObjectURL(file));
              }}
            />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : "Save"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
