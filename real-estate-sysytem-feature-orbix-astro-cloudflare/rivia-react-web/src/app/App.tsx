import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './providers/AuthProvider';
import { OrganizationProvider } from './providers/OrganizationProvider';
import { router } from './routes/router';

export default function App() {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <RouterProvider router={router} />
      </OrganizationProvider>
    </AuthProvider>
  );
}
