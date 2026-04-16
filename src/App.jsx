import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import NotebookView from "./pages/NotebookView";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/notebook/:slug" element={<NotebookView />} />
    </Routes>
  );
}