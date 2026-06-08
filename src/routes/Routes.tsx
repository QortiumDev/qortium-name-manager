import { createHashRouter, RouterProvider, Outlet, useParams } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { MarketplacePage } from '../pages/MarketplacePage';
import { MyNamesPage } from '../pages/MyNamesPage';
import { useIframe } from '../hooks/useIframeListener';

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
      { index: true,             element: <MarketplacePage /> },
      { path: 'my-names',        element: <MyNamesPage /> },
      { path: 'name/:name',      element: <NameRoute /> },
      { path: 'search/:query',   element: <SearchRoute /> },
    ],
  },
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}
