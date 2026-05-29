import { Database, FileSpreadsheet } from "lucide-react";

type SidebarProps = {
  activePage: "import" | "settings";
  onChangePage: (page: "import" | "settings") => void;
};

export function Sidebar({ activePage, onChangePage }: SidebarProps) {
  const items = [
    { id: "import" as const, label: "Importar CSV", icon: FileSpreadsheet },
    { id: "settings" as const, label: "Configurações", icon: Database },
  ];

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-white/70 bg-white/65 px-4 py-5 backdrop-blur-xl">
      <div className="mb-8">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-sm font-semibold text-white shadow-soft">
          Fi
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">FiCSVNotion</p>
        <h1 className="mt-2 text-xl font-semibold text-ink">Transações</h1>
      </div>

      <nav className="grid gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.id;

          return (
            <button
              className={`flex h-10 items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition ${
              active ? "bg-ink text-white shadow-sm" : "text-muted hover:bg-white hover:text-ink"
              }`}
              key={item.id}
              onClick={() => onChangePage(item.id)}
              type="button"
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
