import { CreditCard, Check, Shield } from 'lucide-react';

export default function BillingPage() {
  const plans = [
    {
      name: 'Starter Bundle',
      messages: '10,000 Messages',
      price: '₹999',
      features: ['Valid for 30 Days', 'Standard Support', 'All features included'],
    },
    {
      name: 'Growth Bundle',
      messages: '50,000 Messages',
      price: '₹3,999',
      popular: true,
      features: ['Valid for 90 Days', 'Priority Support', 'Dedicated Account Manager'],
    },
    {
      name: 'Pro Bundle',
      messages: '200,000 Messages',
      price: '₹12,999',
      features: ['Valid for 365 Days', '24/7 Phone Support', 'Custom Integrations'],
    }
  ];

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-3">Recharge Your Credits</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Purchase message bundles to continue reaching your customers. Choose a plan that fits your volume.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan, i) => (
          <div key={i} className={`relative rounded-2xl border p-8 shadow-sm flex flex-col ${plan.popular ? 'border-indigo-500 shadow-indigo-500/10' : 'border-border bg-card'}`}>
            {plan.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                Most Popular
              </div>
            )}
            <h3 className="text-lg font-semibold text-muted-foreground">{plan.name}</h3>
            <div className="mt-4 mb-6">
              <span className="text-4xl font-black">{plan.price}</span>
              <p className="text-sm font-medium text-foreground mt-2">{plan.messages}</p>
            </div>
            
            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature, j) => (
                <li key={j} className="flex items-center gap-3 text-sm">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <button className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${plan.popular ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'}`}>
              <CreditCard className="h-4 w-4" />
              Pay {plan.price}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-16 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4 text-emerald-500" />
        Payments are 100% secure and encrypted.
      </div>
    </div>
  );
}
