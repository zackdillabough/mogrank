import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrdersTable } from "@/components/admin/orders-table"

interface OrderRow {
  status: string
}

interface QueueRow {
  status: string
}

async function getStats() {
  const supabase = getSupabaseAdmin()
  const [ordersResult, queueResult] = await Promise.all([
    supabase.from("orders").select("status"),
    supabase.from("queue").select("status"),
  ])

  const orders: OrderRow[] = ordersResult.data || []
  const queue: QueueRow[] = queueResult.data || []

  return {
    totalOrders: orders.length,
    pendingPayment: orders.filter((o) => o.status === "pending_payment").length,
    paid: orders.filter((o) => o.status === "paid" || o.status === "in_queue")
      .length,
    completed: orders.filter((o) => o.status === "completed").length,
    queueNew: queue.filter((q) => q.status === "new").length,
    queueScheduled: queue.filter((q) => q.status === "scheduled").length,
    queueInProgress: queue.filter((q) => q.status === "in_progress").length,
    queueReview: queue.filter((q) => q.status === "review").length,
  }
}

async function getRecentOrders() {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20)

  return data || []
}

export default async function AdminDashboard() {
  const [stats, orders] = await Promise.all([getStats(), getRecentOrders()])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {stats.pendingPayment}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Paid / In Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.paid}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {stats.completed}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-slate-50 dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">New</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.queueNew}</div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.queueScheduled}</div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 dark:bg-orange-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.queueInProgress}</div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.queueReview}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Recent Orders</TabsTrigger>
          <TabsTrigger value="pending">Pending Payment</TabsTrigger>
        </TabsList>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <OrdersTable orders={orders} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <OrdersTable
                orders={orders.filter(
                  (o: { status: string }) => o.status === "pending_payment"
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
