import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";

// Pages
import Dashboard from "./pages/Dashboard";
import RulesList from "./pages/RulesList";
import RuleBuilder from "./pages/RuleBuilder";
import Stages from "./pages/Stages";
import Scorecards from "./pages/Scorecards";
import Grids from "./pages/Grids";
import EvaluationConsole from "./pages/EvaluationConsole";
import AuditLogs from "./pages/AuditLogs";
import Products from "./pages/Products";

function App() {
  return (
    <div className="App" data-testid="app-root">
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/rules" element={<RulesList />} />
            <Route path="/rules/new" element={<RuleBuilder />} />
            <Route path="/rules/:id" element={<RuleBuilder />} />
            <Route path="/rules/:id/edit" element={<RuleBuilder />} />
            <Route path="/stages" element={<Stages />} />
            <Route path="/scorecards" element={<Scorecards />} />
            <Route path="/grids" element={<Grids />} />
            <Route path="/evaluate" element={<EvaluationConsole />} />
            <Route path="/audit" element={<AuditLogs />} />
            <Route path="/products" element={<Products />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </div>
  );
}

export default App;
