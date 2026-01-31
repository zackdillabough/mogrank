import { auth } from "@/lib/auth"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AvailabilityEditor } from "@/components/availability-editor"
import { CancelOrderButton } from "@/components/cancel-order-button"
import { format, formatDistanceToNow } from "date-fns"
import Link from "next/link"

const statusColors: Record<string, string> = {
  in_queue: "bg-blue-100 text-blue-800",
  scheduled: "bg-indigo-100 text-indigo-800",
  in_progress: "bg-orange-100 text-orange-800",
  review: "bg-purple-100 text-purple-800",
  completed: "bg-emerald-100 text-emerald-800",
  missed: "bg-red-100 text-red-800",
  dispute: "bg-rose-100 text-rose-800",
  refunded: "bg-gray-100 text-gray-800",
}

async function getCustomerData(discordId: string) {
  const supabase = getSupabaseAdmin()
  const [ordersResult, queueResult] = await Promise.all([
    supabase
      .from("orders")
      .select("*")
      .eq("discord_id", discordId)
      .order("created_at", { ascending: false }),
    supabase
      .from("queue")
      .select("*")
      .eq("discord_id", discordId)
      .not("status", "eq", "finished")
      .order("created_at", { ascending: true }),
  ])

  return {
    orders: ordersResult.data || [],
    queueItems: queueResult.data || [],
  }
}

export default async function CustomerDashboard() {
  const session = await auth()

  if (!session?.user?.discordId) {
    return null
  }

  const { orders, queueItems } = await getCustomerData(session.user.discordId)

  const activeOrder = queueItems[0]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Dashboard</h1>

      {/* Active Session Card */}
      {activeOrder && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Active Session</span>
              <Badge className={statusColors[activeOrder.status]}>
                {activeOrder.status.replace("_", " ")}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Package</p>
                <p className="font-medium">{activeOrder.package_name}</p>
              </div>

              {activeOrder.appointment_time && (
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled Time</p>
                  <p className="font-medium">
                    {format(new Date(activeOrder.appointment_time), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ({formatDistanceToNow(new Date(activeOrder.appointment_time), { addSuffix: true })})
                  </p>
                </div>
              )}

              {activeOrder.room_code && (
                <div>
                  <p className="text-sm text-muted-foreground">Room Code</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-3 py-2 rounded text-lg font-mono">
                      {activeOrder.room_code}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(activeOrder.room_code)
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {activeOrder.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-sm">{activeOrder.notes}</p>
              </div>
            )}

            {/* Availability section */}
            <AvailabilityEditor
              orderId={activeOrder.order_id}
              availability={activeOrder.availability}
              canEdit={["new", "scheduled"].includes(activeOrder.status)}
            />

            {/* Cancel order section - shown for orders in new/scheduled status */}
            {["new", "scheduled"].includes(activeOrder.status) && (
              <div className="pt-4 border-t">
                <CancelOrderButton
                  orderId={activeOrder.order_id}
                  orderAmount={Number(orders.find(o => o.id === activeOrder.order_id)?.amount || 0)}
                  canCancel={["new", "scheduled"].includes(activeOrder.status)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Order History */}
      <Card className="bg-background">
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No orders yet</p>
              <Button asChild>
                <Link href="/">Browse Packages</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-muted"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{order.package_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-medium">${order.amount.toFixed(2)}</p>
                    <Badge className={statusColors[order.status]}>
                      {order.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
