import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Megaphone, Bell, ShieldCheck, MessageCircle } from "lucide-react"

const pricingTiers = [
  {
    category: "Marketing",
    description: "Promotional messages",
    price: "₹0.7122",
    icon: Megaphone,
    color: "text-purple-500",
    bg: "bg-purple-100 dark:bg-purple-900/20",
  },
  {
    category: "Utility",
    description: "Order updates, alerts",
    price: "₹0.1688",
    icon: Bell,
    color: "text-blue-500",
    bg: "bg-blue-100 dark:bg-blue-900/20",
  },
  {
    category: "Authentication",
    description: "OTPs, verification",
    price: "₹0.1350",
    icon: ShieldCheck,
    color: "text-amber-500",
    bg: "bg-amber-100 dark:bg-amber-900/20",
  },
  {
    category: "Service",
    description: "Customer-initiated (24h window)",
    price: "Free (first 1000/mo), then ₹0.3375",
    icon: MessageCircle,
    color: "text-green-500",
    bg: "bg-green-100 dark:bg-green-900/20",
  },
]

export function MetaPricing() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversation Pricing (India)</CardTitle>
        <CardDescription>Prices shown are per conversation for the India market.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pricingTiers.map((tier) => {
            const Icon = tier.icon
            return (
              <div key={tier.category} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${tier.bg} ${tier.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{tier.category}</h4>
                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{tier.price}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
