import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Profile } from "@/types/models";
import { format } from "date-fns";

export default async function AdminCustomersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "customer")
    .order("created_at", { ascending: false })
    .returns<Profile[]>();

  const customers = data ?? [];

  return (
    <div>
      <h1 className="text-2xl font-medium tracking-tight">Customers</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Everyone who has created an account.
      </p>

      <div className="mt-8">
        {customers.length === 0 ? (
          <p className="rounded-md border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
            No customers yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      {customer.full_name ?? "—"}
                    </TableCell>
                    <TableCell>{customer.phone ?? "—"}</TableCell>
                    <TableCell>
                      {format(new Date(customer.created_at), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
