"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PlansCardProps {
  currentPlan: string;
  onSelectPlan: (planId: string, amount: number) => void;
}

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: 499,
    description: "Perfect for small businesses getting started",
    features: [
      "500 messages/day",
      "1 user",
      "Basic templates",
      "Contact management",
      "Email support",
    ],
  },
  {
    id: "standard",
    name: "Standard",
    price: 699,
    description: "Best for growing businesses",
    features: [
      "2,000 messages/day",
      "5 users",
      "All templates",
      "Broadcast messaging",
      "Automations",
      "Keyword flows",
      "Priority support",
    ],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 999,
    description: "Advanced features for large teams",
    features: [
      "Unlimited messages",
      "25 users",
      "All Standard features",
      "API access",
      "AI agents",
      "Dedicated support",
      "Custom integrations",
    ],
  },
];

export function PlansCard({ currentPlan, onSelectPlan }: PlansCardProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {plans.map((plan) => (
        <Card 
          key={plan.id} 
          className={`relative flex flex-col ${plan.popular ? 'border-primary shadow-md scale-[1.02]' : ''}`}
        >
          {plan.popular && (
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
              Most Popular
            </Badge>
          )}
          <CardHeader>
            <CardTitle className="text-2xl">{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
            <div className="mt-4 flex items-baseline text-4xl font-bold">
              ₹{plan.price}
              <span className="ml-1 text-sm font-medium text-muted-foreground">/mo</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              variant={currentPlan === plan.id ? "outline" : plan.popular ? "default" : "secondary"}
              disabled={currentPlan === plan.id}
              onClick={() => onSelectPlan(plan.id, plan.price)}
            >
              {currentPlan === plan.id ? "Current Plan" : "Upgrade"}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
