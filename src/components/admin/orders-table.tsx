"use client"

import { format } from "date-fns"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Order } from "@/lib/types"

interface OrdersTableProps {
  orders: Order[]
}

const statusColors: Record<string, string> = {
  pending_payment: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  in_queue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  scheduled: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  in_progress: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  review: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  missed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  dispute: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300",
  refunded: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
}

export function OrdersTable({ orders }: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No orders found
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Discord</TableHead>
          <TableHead>Package</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-mono text-xs">
              {order.id.slice(0, 8)}...
            </TableCell>
            <TableCell>
              {order.discord_username || (
                <span className="text-muted-foreground italic">Not linked</span>
              )}
            </TableCell>
            <TableCell>{order.package_name}</TableCell>
            <TableCell>${order.amount.toFixed(2)}</TableCell>
            <TableCell>
              <Badge className={statusColors[order.status] || ""}>
                {order.status.replace("_", " ")}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {format(new Date(order.created_at), "MMM d, yyyy HH:mm")}
            </TableCell>
            <TableCell>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/queue?orderId=${order.id}`}>
                  View in Queue
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
