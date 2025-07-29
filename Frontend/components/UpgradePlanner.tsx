
import React from 'react';
import type { UpgradePhase } from '../types';
import { Card, CardContent } from './common/Card';

const phases: UpgradePhase[] = [
  {
    id: 1,
    name: 'Phase 1: Customer Data API',
    description: 'Expose customer information from the legacy AS/400 CRM system via a modern REST API.',
    status: 'Completed',
    startDate: 'Q1 2024',
    endDate: 'Q1 2024',
  },
  {
    id: 2,
    name: 'Phase 2: Product Catalog Service',
    description: 'Migrate the product catalog from the mainframe database to a new microservice.',
    status: 'In Progress',
    startDate: 'Q2 2024',
    endDate: 'Q3 2024',
  },
  {
    id: 3,
    name: 'Phase 3: Order Management API',
    description: 'Create new endpoints for placing and tracking orders, routing them to the legacy fulfillment system.',
    status: 'Not Started',
    startDate: 'Q4 2024',
    endDate: 'Q4 2024',
  },
   {
    id: 4,
    name: 'Phase 4: Decommission Mainframe',
    description: 'Final phase to fully migrate all dependent services and decommission the old mainframe.',
    status: 'Not Started',
    startDate: 'Q1 2025',
    endDate: 'Q2 2025',
  },
];

const StatusBadge: React.FC<{ status: UpgradePhase['status'] }> = ({ status }) => {
  const statusStyles = {
    'Completed': 'bg-green-100 text-green-800',
    'In Progress': 'bg-yellow-100 text-yellow-800',
    'Not Started': 'bg-slate-200 text-slate-600',
  };
  return <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${statusStyles[status]}`}>{status}</span>;
};

export const UpgradePlanner: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-800">Phased Upgrade Planner</h2>
      <p className="text-lg text-slate-600">Visualize and track your incremental migration from legacy to modern.</p>

      <div className="mt-4">
        <div className="relative border-l-2 border-slate-300 ml-6">
          {phases.map((phase, index) => (
            <div key={phase.id} className="mb-10 ml-6">
                <span className={`absolute -left-3.5 flex items-center justify-center w-7 h-7 rounded-full ring-8 ring-slate-100 ${phase.status === 'Completed' ? 'bg-brand-primary' : 'bg-slate-300'}`}>
                    <svg className="w-3 h-3 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4Z"/>
                        <path d="M0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"/>
                    </svg>
                </span>
                <Card className="shadow-lg">
                    <CardContent>
                        <div className="flex justify-between items-start">
                            <time className="block mb-2 text-sm font-normal leading-none text-slate-400">{phase.startDate} - {phase.endDate}</time>
                            <StatusBadge status={phase.status} />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">{phase.name}</h3>
                        <p className="mt-2 text-base font-normal text-slate-600">{phase.description}</p>
                    </CardContent>
                </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
