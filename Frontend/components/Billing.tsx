
import React from 'react';
import type { BillingTier } from '../types';
import { Card, CardContent } from './common/Card';
import { Button } from './common/Button';
import { CheckCircleIcon } from './icons';

const tiers: BillingTier[] = [
  {
    name: 'Developer',
    price: 'Free',
    features: ['1 User', '1 Legacy System', '10,000 API Calls/month', 'Community Support'],
  },
  {
    name: 'Business',
    price: '$499/mo',
    features: ['10 Users', '5 Legacy Systems', '1,000,000 API Calls/month', 'Usage Analytics', 'Email Support'],
    isPopular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    features: ['Unlimited Users', 'Unlimited Systems', 'Custom API Call Volume', 'Phased Upgrade Planner', 'Dedicated Support & SLA'],
  },
];

export const Billing: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-800">Billing & Plans</h2>
        <p className="mt-2 text-lg text-slate-600">Choose the plan that's right for your modernization journey.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto pt-8">
        {tiers.map((tier) => (
          <Card key={tier.name} className={`flex flex-col ${tier.isPopular ? 'border-2 border-brand-primary' : ''}`}>
             {tier.isPopular && (
              <div className="bg-brand-primary text-center py-1.5">
                <p className="text-sm font-semibold text-white">Most Popular</p>
              </div>
            )}
            <CardContent className="flex-1 flex flex-col">
              <h3 className="text-xl font-semibold text-center text-slate-800">{tier.name}</h3>
              <div className="mt-4 text-center">
                <span className="text-4xl font-bold">{tier.price}</span>
                {tier.name !== 'Enterprise' && tier.name !== 'Developer' && <span className="text-base font-medium text-slate-500">/month</span>}
              </div>
              <ul className="mt-6 space-y-4">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <CheckCircleIcon className="flex-shrink-0 h-5 w-5 text-green-500 mr-2 mt-0.5" />
                    <span className="text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button variant={tier.isPopular ? 'primary' : 'secondary'} className="w-full">
                  {tier.name === 'Enterprise' ? 'Contact Sales' : 'Choose Plan'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
