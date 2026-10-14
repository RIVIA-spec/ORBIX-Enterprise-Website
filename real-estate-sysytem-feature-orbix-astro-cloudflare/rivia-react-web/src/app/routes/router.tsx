import { lazy, Suspense, type ReactElement } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AccountLayout } from '../../layouts/AccountLayout';
import { AdminLayout } from '../../layouts/AdminLayout';
import { PublicLayout } from '../../layouts/PublicLayout';
import { LoadingState } from '../../components/ui/LoadingState';
import { LoginPage } from '../../pages/auth/LoginPage';
import { RegisterPage } from '../../pages/auth/RegisterPage';
import { HomePage } from '../../pages/HomePage';
import { PropertiesPage } from '../../pages/properties/PropertiesPage';
import { SeoLandingPage } from '../../pages/SeoLandingPage';
import { AdminRoute } from '../../routes/AdminRoute';
import { ProtectedRoute } from './ProtectedRoute';
import { RouteErrorBoundary } from './RouteErrorBoundary';

const ProfilePage = lazy(() => import('../../pages/account/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const FavoritesPage = lazy(() => import('../../pages/account/FavoritesPage').then((module) => ({ default: module.FavoritesPage })));
const MyBookingsPage = lazy(() => import('../../pages/account/MyBookingsPage').then((module) => ({ default: module.MyBookingsPage })));
const MyRequestsPage = lazy(() => import('../../pages/account/MyRequestsPage').then((module) => ({ default: module.MyRequestsPage })));
const MyDealsPage = lazy(() => import('../../pages/account/MyDealsPage').then((module) => ({ default: module.MyDealsPage })));
const MyInvoicesPage = lazy(() => import('../../pages/account/MyInvoicesPage').then((module) => ({ default: module.MyInvoicesPage })));
const MyContractsPage = lazy(() => import('../../pages/account/MyContractsPage').then((module) => ({ default: module.MyContractsPage })));
const MyPropertiesPage = lazy(() => import('../../pages/account/MyPropertiesPage').then((module) => ({ default: module.MyPropertiesPage })));
const NotificationsPage = lazy(() => import('../../pages/account/NotificationsPage').then((module) => ({ default: module.NotificationsPage })));
const VerificationPage = lazy(() => import('../../pages/account/VerificationPage').then((module) => ({ default: module.VerificationPage })));
const AddPropertyRequestPage = lazy(() =>
  import('../../pages/properties/AddPropertyRequestPage').then((module) => ({ default: module.AddPropertyRequestPage })),
);
const PropertyBookingPage = lazy(() => import('../../pages/bookings/PropertyBookingPage').then((module) => ({ default: module.PropertyBookingPage })));
const PropertyPurchaseRequestPage = lazy(() =>
  import('../../pages/bookings/PropertyPurchaseRequestPage').then((module) => ({ default: module.PropertyPurchaseRequestPage })),
);
const PropertyDetailsPage = lazy(() =>
  import('../../pages/properties/PropertyDetailsPage').then((module) => ({ default: module.PropertyDetailsPage })),
);
const PropertyMapPage = lazy(() => import('../../pages/properties/PropertyMapPage').then((module) => ({ default: module.PropertyMapPage })));
const PropertyTourPage = lazy(() => import('../../pages/properties/PropertyTourPage').then((module) => ({ default: module.PropertyTourPage })));
const PublicHotelsPage = lazy(() => import('../../pages/hotels/HotelsPage').then((module) => ({ default: module.HotelsPage })));
const HotelDetailsPage = lazy(() => import('../../pages/hotels/HotelDetailsPage').then((module) => ({ default: module.HotelDetailsPage })));
const PrivacyPolicyPage = lazy(() => import('../../pages/legal/PrivacyPolicyPage').then((module) => ({ default: module.PrivacyPolicyPage })));
const TermsOfUsePage = lazy(() => import('../../pages/legal/TermsOfUsePage').then((module) => ({ default: module.TermsOfUsePage })));
const CookiePolicyPage = lazy(() => import('../../pages/legal/CookiePolicyPage').then((module) => ({ default: module.CookiePolicyPage })));
const EditPropertyPage = lazy(() => import('../../pages/properties/EditPropertyPage').then((module) => ({ default: module.EditPropertyPage })));
const AdminDashboardPage = lazy(() => import('../../pages/admin/AdminDashboardPage').then((module) => ({ default: module.AdminDashboardPage })));
const PropertiesAdminPage = lazy(() => import('../../pages/admin/PropertiesAdminPage').then((module) => ({ default: module.PropertiesAdminPage })));
const PendingPropertiesPage = lazy(() => import('../../pages/admin/PendingPropertiesPage').then((module) => ({ default: module.PendingPropertiesPage })));
const UsersPage = lazy(() => import('../../pages/admin/UsersPage').then((module) => ({ default: module.UsersPage })));
const BookingsManagementPage = lazy(() =>
  import('../../pages/admin/BookingsManagementPage').then((module) => ({ default: module.BookingsManagementPage })),
);
const DealsPage = lazy(() => import('../../pages/admin/DealsPage').then((module) => ({ default: module.DealsPage })));
const InvoicesPage = lazy(() => import('../../pages/admin/InvoicesPage').then((module) => ({ default: module.InvoicesPage })));
const ContractsPage = lazy(() => import('../../pages/admin/ContractsPage').then((module) => ({ default: module.ContractsPage })));
const ReportsPage = lazy(() => import('../../pages/admin/ReportsPage').then((module) => ({ default: module.ReportsPage })));
const AdsPage = lazy(() => import('../../pages/admin/AdsPage').then((module) => ({ default: module.AdsPage })));
const HeroSlidesAdminPage = lazy(() =>
  import('../../pages/admin/HeroSlidesAdminPage').then((module) => ({ default: module.HeroSlidesAdminPage })),
);
const CategoriesPage = lazy(() => import('../../pages/admin/CategoriesPage').then((module) => ({ default: module.CategoriesPage })));
const FeaturesPage = lazy(() => import('../../pages/admin/FeaturesPage').then((module) => ({ default: module.FeaturesPage })));
const AdminHotelsPage = lazy(() => import('../../pages/admin/HotelsPage').then((module) => ({ default: module.HotelsPage })));
const AdminRolesPage = lazy(() => import('../../pages/admin/AdminRolesPage').then((module) => ({ default: module.AdminRolesPage })));
const PendingBookingsPage = lazy(() => import('../../pages/admin/PendingBookingsPage').then((module) => ({ default: module.PendingBookingsPage })));
const AdminNotificationsSendPage = lazy(() => import('../../pages/admin/AdminNotificationsSendPage').then((module) => ({ default: module.AdminNotificationsSendPage })));
const FeaturedItemsPage = lazy(() => import('../../pages/admin/FeaturedItemsPage').then((module) => ({ default: module.FeaturedItemsPage })));
const AdminContactPage = lazy(() => import('../../pages/admin/AdminContactPage').then((module) => ({ default: module.AdminContactPage })));
const CookieSettingsPage = lazy(() => import('../../pages/admin/CookieSettingsPage').then((module) => ({ default: module.CookieSettingsPage })));
const PropertiesVisibilityPage = lazy(() => import('../../pages/admin/PropertiesVisibilityPage').then((module) => ({ default: module.PropertiesVisibilityPage })));
const ReportReasonsPage = lazy(() => import('../../pages/admin/ReportReasonsPage').then((module) => ({ default: module.ReportReasonsPage })));
const FirebaseDiagnosticsPage = lazy(() => import('../../pages/dev/FirebaseDiagnosticsPage').then((module) => ({ default: module.FirebaseDiagnosticsPage })));
const ArticlesPage = lazy(() => import('../../pages/content/ArticlesPage').then((module) => ({ default: module.ArticlesPage })));
const ArticlePage = lazy(() => import('../../pages/content/ArticlePage').then((module) => ({ default: module.ArticlePage })));
const ServicesPage = lazy(() => import('../../pages/content/ServicesPage').then((module) => ({ default: module.ServicesPage })));
const ServicePage = lazy(() => import('../../pages/content/ServicePage').then((module) => ({ default: module.ServicePage })));
const CmsPage = lazy(() => import('../../pages/content/CmsPage').then((module) => ({ default: module.CmsPage })));
const GuidesPage = lazy(() => import('../../pages/content/GuidesPage').then((module) => ({ default: module.GuidesPage })));
const GuidePage = lazy(() => import('../../pages/content/GuidePage').then((module) => ({ default: module.GuidePage })));
const FaqsPage = lazy(() => import('../../pages/content/FaqsPage').then((module) => ({ default: module.FaqsPage })));
const MediaMentionsPage = lazy(() => import('../../pages/content/MediaMentionsPage').then((module) => ({ default: module.MediaMentionsPage })));
const DocumentsPage = lazy(() => import('../../pages/content/DocumentsPage').then((module) => ({ default: module.DocumentsPage })));
const PartnerLandingPage = lazy(() => import('../../pages/partner/PartnerLandingPage').then((module) => ({ default: module.PartnerLandingPage })));
const PartnerOrganizationPage = lazy(() => import('../../pages/partner/PartnerOrganizationPage').then((module) => ({ default: module.PartnerOrganizationPage })));
const PartnerRealEstateFoundationPage = lazy(() =>
  import('../../pages/partner/PartnerRealEstateFoundationPage').then((module) => ({ default: module.PartnerRealEstateFoundationPage })),
);

function LazyRoute({ children }: { children: ReactElement }) {
  return <Suspense fallback={<LoadingState label="جار تحميل الصفحة..." />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/articles', element: <LazyRoute><ArticlesPage /></LazyRoute> },
      { path: '/articles/:slug', element: <LazyRoute><ArticlePage /></LazyRoute> },
      { path: '/services', element: <LazyRoute><ServicesPage /></LazyRoute> },
      { path: '/services/:slug', element: <LazyRoute><ServicePage /></LazyRoute> },
      { path: '/guides', element: <LazyRoute><GuidesPage /></LazyRoute> },
      { path: '/guides/:slug', element: <LazyRoute><GuidePage /></LazyRoute> },
      { path: '/faqs', element: <LazyRoute><FaqsPage /></LazyRoute> },
      { path: '/media', element: <LazyRoute><MediaMentionsPage /></LazyRoute> },
      { path: '/downloads', element: <LazyRoute><DocumentsPage /></LazyRoute> },
      { path: '/pages/:slug', element: <LazyRoute><CmsPage /></LazyRoute> },
      { path: '/properties', element: <PropertiesPage /> },
      { path: '/buy', element: <SeoLandingPage kind="buy" /> },
      { path: '/rent', element: <SeoLandingPage kind="rent" /> },
      { path: '/city/:citySlug', element: <SeoLandingPage kind="city" /> },
      { path: '/buy/:citySlug', element: <SeoLandingPage kind="buy" /> },
      { path: '/rent/:citySlug', element: <SeoLandingPage kind="rent" /> },
      { path: '/map', element: <LazyRoute><PropertyMapPage /></LazyRoute> },
      { path: '/properties/map', element: <LazyRoute><PropertyMapPage /></LazyRoute> },
      { path: '/hotels', element: <LazyRoute><PublicHotelsPage /></LazyRoute> },
      { path: '/privacy-policy', element: <LazyRoute><PrivacyPolicyPage /></LazyRoute> },
      { path: '/terms-of-use', element: <LazyRoute><TermsOfUsePage /></LazyRoute> },
      { path: '/cookie-policy', element: <LazyRoute><CookiePolicyPage /></LazyRoute> },
      // One segment accepts both canonical SEO slugs and legacy document IDs.
      { path: '/property/:slugOrId', element: <LazyRoute><PropertyDetailsPage /></LazyRoute> },
      { path: '/hotel/:slugOrId', element: <LazyRoute><HotelDetailsPage /></LazyRoute> },
      { path: '/properties/:id', element: <LazyRoute><PropertyDetailsPage /></LazyRoute> },
      { path: '/properties/:id/tour', element: <LazyRoute><PropertyTourPage /></LazyRoute> },
      { path: '/hotels/:id', element: <LazyRoute><HotelDetailsPage /></LazyRoute> },
      { path: '/dev/firebase', element: <LazyRoute><FirebaseDiagnosticsPage /></LazyRoute> },
      {
        path: '/partner',
        element: (
          <ProtectedRoute>
            <LazyRoute><PartnerLandingPage /></LazyRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/partner/:organizationId',
        element: (
          <ProtectedRoute>
            <LazyRoute><PartnerOrganizationPage /></LazyRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/partner/:organizationId/real-estate',
        element: (
          <ProtectedRoute>
            <LazyRoute><PartnerRealEstateFoundationPage /></LazyRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/properties/:id/book',
        element: (
          <ProtectedRoute>
            <LazyRoute><PropertyBookingPage /></LazyRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/properties/:id/purchase',
        element: (
          <ProtectedRoute>
            <LazyRoute><PropertyPurchaseRequestPage /></LazyRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/properties/:id/edit',
        element: (
          <ProtectedRoute>
            <LazyRoute><EditPropertyPage /></LazyRoute>
          </ProtectedRoute>
        ),
      },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      {
        element: (
          <ProtectedRoute>
            <AccountLayout />
          </ProtectedRoute>
        ),
        children: [
          { path: '/profile', element: <LazyRoute><ProfilePage /></LazyRoute> },
          { path: '/my-requests', element: <LazyRoute><MyRequestsPage /></LazyRoute> },
          { path: '/add-property', element: <LazyRoute><AddPropertyRequestPage /></LazyRoute> },
          { path: '/my-properties', element: <LazyRoute><MyPropertiesPage /></LazyRoute> },
          { path: '/my-bookings', element: <LazyRoute><MyBookingsPage /></LazyRoute> },
          { path: '/my-deals', element: <LazyRoute><MyDealsPage /></LazyRoute> },
          { path: '/my-invoices', element: <LazyRoute><MyInvoicesPage /></LazyRoute> },
          { path: '/my-contracts', element: <LazyRoute><MyContractsPage /></LazyRoute> },
          { path: '/verification', element: <LazyRoute><VerificationPage /></LazyRoute> },
          { path: '/notifications', element: <LazyRoute><NotificationsPage /></LazyRoute> },
          { path: '/favorites', element: <LazyRoute><FavoritesPage /></LazyRoute> },
        ],
      },
      {
        element: (
          <ProtectedRoute>
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          </ProtectedRoute>
        ),
        children: [
          { path: '/admin', element: <LazyRoute><AdminDashboardPage /></LazyRoute> },
          { path: '/admin/properties', element: <LazyRoute><PropertiesAdminPage /></LazyRoute> },
          { path: '/admin/property-requests', element: <LazyRoute><PendingPropertiesPage /></LazyRoute> },
          { path: '/admin/users', element: <LazyRoute><UsersPage /></LazyRoute> },
          { path: '/admin/bookings', element: <LazyRoute><BookingsManagementPage /></LazyRoute> },
          { path: '/admin/bookings/pending', element: <LazyRoute><PendingBookingsPage /></LazyRoute> },
          { path: '/admin/notifications/send', element: <LazyRoute><AdminNotificationsSendPage /></LazyRoute> },
          { path: '/admin/featured', element: <LazyRoute><FeaturedItemsPage /></LazyRoute> },
          { path: '/admin/contact', element: <LazyRoute><AdminContactPage /></LazyRoute> },
          { path: '/admin/cookie-settings', element: <LazyRoute><CookieSettingsPage /></LazyRoute> },
          { path: '/admin/properties/visibility', element: <LazyRoute><PropertiesVisibilityPage /></LazyRoute> },
          { path: '/admin/report-reasons', element: <LazyRoute><ReportReasonsPage /></LazyRoute> },
          { path: '/admin/deals', element: <LazyRoute><DealsPage /></LazyRoute> },
          { path: '/admin/invoices', element: <LazyRoute><InvoicesPage /></LazyRoute> },
          { path: '/admin/contracts', element: <LazyRoute><ContractsPage /></LazyRoute> },
          { path: '/admin/reports', element: <LazyRoute><ReportsPage /></LazyRoute> },
          { path: '/admin/ads', element: <LazyRoute><AdsPage /></LazyRoute> },
          { path: '/admin/hero-slides', element: <LazyRoute><HeroSlidesAdminPage /></LazyRoute> },
          { path: '/admin/categories', element: <LazyRoute><CategoriesPage /></LazyRoute> },
          { path: '/admin/property-types', element: <LazyRoute><CategoriesPage /></LazyRoute> },
          { path: '/admin/features', element: <LazyRoute><FeaturesPage /></LazyRoute> },
          { path: '/admin/hotels', element: <LazyRoute><AdminHotelsPage /></LazyRoute> },
          { path: '/admin/admin-roles', element: <LazyRoute><AdminRolesPage /></LazyRoute> },
        ],
      },
    ],
  },
]);
