import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { TerritoryListPage } from './pages/TerritoryListPage';
import { TerritoryDetailPage } from './pages/TerritoryDetailPage';
import { AssignmentPage } from './pages/AssignmentPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="app-header">
          <h1 className="app-title">전자구역카드</h1>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<TerritoryListPage />} />
            <Route path="/territories/:id" element={<TerritoryDetailPage />} />
            <Route path="/publishers" element={<AssignmentPage />} />
          </Routes>
        </main>
        <NavBar />
      </div>
    </BrowserRouter>
  );
}

export default App;
