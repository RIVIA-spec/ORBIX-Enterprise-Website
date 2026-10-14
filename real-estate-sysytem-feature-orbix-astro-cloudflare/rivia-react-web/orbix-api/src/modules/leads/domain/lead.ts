export type LeadType = 'property_inquiry' | 'viewing_request' | 'partnership_request';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'closed' | 'rejected';
export type LeadSource = 'web' | 'mobile' | 'admin' | 'campaign' | 'organic';

export interface Lead {
  id: string;
  type: LeadType;
  propertyId?: string;
  customerUid: string;
  partnerId?: string;
  assignedToUid?: string;
  name: string;
  phone?: string;
  email?: string;
  message?: string;
  source: LeadSource;
  status: LeadStatus;
  createdAt: Date;
  updatedAt: Date;
  contactedAt?: Date;
  closedAt?: Date;
}
