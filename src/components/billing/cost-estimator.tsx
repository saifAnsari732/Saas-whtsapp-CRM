"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export function CostEstimator() {
  const [marketing, setMarketing] = useState(0)
  const [utility, setUtility] = useState(0)
  const [auth, setAuth] = useState(0)
  const [service, setService] = useState(0)

  const marketingCost = marketing * 0.7122
  const utilityCost = utility * 0.1688
  const authCost = auth * 0.1350
  
  const chargeableService = Math.max(0, service - 1000)
  const serviceCost = chargeableService * 0.3375
  const freeServiceSavings = Math.min(service, 1000) * 0.3375

  const totalCost = marketingCost + utilityCost + authCost + serviceCost

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Estimator</CardTitle>
        <CardDescription>Calculate your estimated monthly WhatsApp API costs.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="marketing">Marketing Messages</Label>
            <Input 
              id="marketing" 
              type="number" 
              min={0} 
              value={marketing || ""} 
              onChange={(e) => setMarketing(parseInt(e.target.value) || 0)} 
            />
            <p className="text-xs text-muted-foreground">₹{marketingCost.toFixed(2)}</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="utility">Utility Messages</Label>
            <Input 
              id="utility" 
              type="number" 
              min={0} 
              value={utility || ""} 
              onChange={(e) => setUtility(parseInt(e.target.value) || 0)} 
            />
            <p className="text-xs text-muted-foreground">₹{utilityCost.toFixed(2)}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="auth">Authentication Messages</Label>
            <Input 
              id="auth" 
              type="number" 
              min={0} 
              value={auth || ""} 
              onChange={(e) => setAuth(parseInt(e.target.value) || 0)} 
            />
            <p className="text-xs text-muted-foreground">₹{authCost.toFixed(2)}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service">Service Conversations</Label>
            <Input 
              id="service" 
              type="number" 
              min={0} 
              value={service || ""} 
              onChange={(e) => setService(parseInt(e.target.value) || 0)} 
            />
            <p className="text-xs text-muted-foreground">
              ₹{serviceCost.toFixed(2)} {freeServiceSavings > 0 && <span className="text-green-500">(Saved ₹{freeServiceSavings.toFixed(2)})</span>}
            </p>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between items-center pt-2">
          <div className="text-lg font-semibold">Total Estimated Cost</div>
          <div className="text-2xl font-bold">₹{totalCost.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">/ month</span></div>
        </div>
      </CardContent>
    </Card>
  )
}
