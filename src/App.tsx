import { useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { HomePage } from "./views/HomePage";
import { SettingsPage } from "./views/SettingsPage";

export function App() {
  const [activePage, setActivePage] = useState<"import" | "settings">("import");

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <Sidebar activePage={activePage} onChangePage={setActivePage} />
      {activePage === "import" ? <HomePage /> : <SettingsPage />}
    </div>
  );
}
