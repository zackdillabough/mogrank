import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OrdersTable } from "@/components/admin/orders-table"

async function getAllOrders() {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })

  return data || []
}

export default async function OrdersPage() {
  const orders = await getAllOrders()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">All Orders</h1>

      <Card>
        <CardHeader>
          <CardTitle>Order History ({orders.length} total)</CardTitle>
        </CardHeader>
        <CardContent>
          <OrdersTable orders={orders} />
        </CardContent>
      </Card>
    </div>
  )
}
