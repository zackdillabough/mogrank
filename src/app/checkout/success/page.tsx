import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="text-6xl mb-4">🎉</div>
          <CardTitle>Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your order has been confirmed. You've been added to the queue and will
            receive a Discord DM when your session is ready.
          </p>

          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/dashboard">View Your Dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Make sure your Discord DMs are open to receive notifications.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
