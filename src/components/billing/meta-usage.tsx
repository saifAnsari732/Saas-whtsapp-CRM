import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function MetaUsage() {
  const usageData = [
    { category: "Marketing", count: 4500, max: 10000, color: "bg-purple-500" },
    { category: "Utility", count: 2100, max: 5000, color: "bg-blue-500" },
    { category: "Authentication", count: 800, max: 2000, color: "bg-amber-500" },
    { category: "Service", count: 950, max: 1000, color: "bg-green-500" }, // Free tier near limit
  ]

  const totalEstimatedCost = (4500 * 0.7122) + (2100 * 0.1688) + (800 * 0.1350) + 0 // service is free up to 1000

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Month Usage</CardTitle>
        <CardDescription>Estimated cost: ₹{totalEstimatedCost.toFixed(2)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {usageData.map((data) => (
            <div key={data.category} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{data.category}</span>
                <span className="text-muted-foreground">{data.count} msgs</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full ${data.color}`}
                  style={{ width: `${Math.min((data.count / data.max) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground flex justify-between">
              <span>Free Tier Status (Service)</span>
              <span className="font-medium text-foreground">950 / 1000 used</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
