import { createHashRouter, RouterProvider, Outlet, useParams } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { MarketplacePage } from '../pages/MarketplacePage';
import { MyNamesPage } from '../pages/MyNamesPage';
import { AddressNamesPage } from '../pages/AddressNamesPage';
import { useIframe } from '../hooks/useIframeListener';

const _startRoute = new URLSearchParams(window.location.search).get('_route');
if (_startRoute) window.location.hash = _startRoute;

function Layout() {
  useIframe();

  return (
    <>
      <TopBar />
      <Outlet />
    </>
  );
}

function NameRoute() {
  const { name } = useParams<{ name: string }>();
  return <MarketplacePage initialQuery={name} exact />;
}

function SearchRoute() {
  const { query } = useParams<{ query: string }>();
  return <MarketplacePage initialQuery={query} />;
}

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true,               element: <MyNamesPage /> },
      { path: 'marketplace',       element: <MarketplacePage /> },
      { path: 'name/:name',        element: <NameRoute /> },
      { path: 'search/:query',     element: <SearchRoute /> },
      { path: 'address/:address',  element: <AddressNamesPage /> },
    ],
  },
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}
