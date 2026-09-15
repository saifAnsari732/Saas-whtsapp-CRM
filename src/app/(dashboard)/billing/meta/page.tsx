import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { MetaPricing } from "@/components/billing/meta-pricing"
import { MetaUsage } from "@/components/billing/meta-usage"
import { CostEstimator } from "@/components/billing/cost-estimator"

export default function MetaBillingPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Link href="/billing" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex flex-col">
          <h2 className="text-3xl font-bold tracking-tight">WhatsApp Business API Billing</h2>
          <p className="text-muted-foreground">Manage your Meta usage and pricing</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Credit Line Status</CardTitle>
              <CardDescription>Your Meta Business Manager billing status.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <div>
                  <p className="font-medium">Active (Credit Card)</p>
                  <p className="text-sm text-muted-foreground">Next billing date: 1st of the month</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <a
                href="https://business.facebook.com/billing"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors w-full sm:w-auto"
              >
                View in Meta Business Manager <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </CardFooter>
          </Card>
          
          <MetaPricing />
        </div>

        <div className="space-y-6">
          <MetaUsage />
        </div>
      </div>

      <div className="mt-8">
        <CostEstimator />
      </div>
    </div>
  )
}
