import { useContext } from 'react';
import { OrganizationContext } from '../app/providers/OrganizationProvider';

export function useOrganizationContext() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganizationContext must be used inside OrganizationProvider');
  }
  return context;
}
