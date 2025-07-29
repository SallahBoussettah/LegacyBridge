
export type View = 'dashboard' | 'generator' | 'portal' | 'databases' | 'billing' | 'planner';

export interface NavigationItem {
  id: View;
  label: string;
  icon: React.ReactNode;
}

export interface ApiEndpoint {
  id: string;
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | string;
  path: string;
  description: string;
  parameters: { name: string; type: string; description: string }[];
  querySuggestion: string;
  status: 'active' | 'inactive';
}

export interface BillingTier {
  name: string;
  price: string;
  features: string[];
  isPopular?: boolean;
}

export interface UpgradePhase {
  id: number;
  name:string;
  description: string;
  status: 'Completed' | 'In Progress' | 'Not Started';
  startDate: string;
  endDate: string;
}
