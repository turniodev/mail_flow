

import React, { useEffect } from 'react';
// @ts-ignore: `HashRouter`, `Routes`, `Route`, `Navigate` are named exports of `react-router-dom/dist/index.js`
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom/dist/index.js';
import Layout from './components/Layout';
import Campaigns from './pages/Campaigns';
import Templates from './pages/Templates';
import Audience from './pages/Audience';
import Flows from './pages/Flows';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Tags from './pages/Tags';
import ApiTriggers from './pages/ApiTriggers';
import { seedData } from './services/mockData';

const App: React.FC = () => {
  useEffect(() => {
    seedData();
  }, []);

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/campaigns" replace />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/audience" element={<Audience />} />
          <Route path="/flows" element={<Flows />} />
          <Route path="/tags" element={<Tags />} />
          <Route path="/api-triggers" element={<ApiTriggers />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/campaigns" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;