"use client";

import { format } from "date-fns";
import { CreditCard, Users, MessageSquare, Contact } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SubscriptionCardProps {
  plan: string;
  price: number;
  nextBillingDate: string;
  usage: {
    messages: number;
    contacts: number;
    members: number;
  };
}

export function SubscriptionCard({ plan, price, nextBillingDate, usage }: SubscriptionCardProps) {
  return (
    <Card className="border-primary/20 bg-gradient-to-r from-card to-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Current Subscription
            </CardTitle>
            <CardDescription>Manage your plan and billing details</CardDescription>
          </div>
          <Badge className="px-3 py-1 text-sm uppercase tracking-wider">{plan} PLAN</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Monthly Cost</p>
              <p className="text-3xl font-bold">₹{price} <span className="text-base font-normal text-muted-foreground">/mo</span></p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Next Billing Date</p>
              <p className="font-medium">{format(new Date(nextBillingDate), 'MMMM dd, yyyy')}</p>
            </div>
          </div>
          
          <div className="bg-background/50 rounded-lg p-4 border space-y-3">
            <h4 className="text-sm font-medium mb-3">Current Usage</h4>
            
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                Messages Sent
              </span>
              <span className="font-medium">{usage.messages.toLocaleString()}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Contact className="h-4 w-4" />
                Contacts
              </span>
              <span className="font-medium">{usage.contacts.toLocaleString()}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                Team Members
              </span>
              <span className="font-medium">{usage.members}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end border-t pt-4">
        <Button variant="outline" className="mr-2">Cancel Subscription</Button>
      </CardFooter>
    </Card>
  );
}
