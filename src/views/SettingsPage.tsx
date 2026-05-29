import { CheckCircle2, Database, Loader2, Save, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Field";
import { apiClient } from "../lib/api-client";
import type {
  MaskedSettings,
  NotionDatabaseOption,
  NotionPropertiesSummary,
  PartialSettings,
} from "../types/app";

const defaultProperties = {
  realized: "Realizado",
  date: "Data",
  name: "Nome",
  type: "Tipo",
  amount: "Valor",
  bank: "Banco",
  category: "Categoria",
  debt: "Dívida",
  investment: "Investimento",
  expectedAmount: "Valor Previsto",
  realizedAmount: "Valor Realizado",
};

type Status = {
  tone: "success" | "error" | "warning";
  message: string;
};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function SettingsPage() {
  const [form, setForm] = useState<PartialSettings>({
    notionToken: "",
    notionDatabaseId: "",
    notionProperties: defaultProperties,
  });
  const [maskedSettings, setMaskedSettings] = useState<MaskedSettings | null>(null);
  const [databases, setDatabases] = useState<NotionDatabaseOption[]>([]);
  const [propertiesSummary, setPropertiesSummary] = useState<NotionPropertiesSummary | null>(null);
  const [loading, setLoading] = useState<"save" | "test" | "databases" | null>(null);
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    void loadMaskedSettings();
  }, []);

  async function loadMaskedSettings() {
    try {
      const result = await apiClient.getMaskedSettings();

      if (!result.ok) {
        setStatus({ tone: "error", message: result.error });
        return;
      }

      setMaskedSettings(result.data);
      setForm({
        notionToken: "",
        notionDatabaseId: result.data.notionDatabaseId,
        notionProperties: result.data.notionProperties,
      });
    } catch (error) {
      setStatus({
        tone: "error",
        message: getErrorMessage(error, "Não foi possível carregar as configurações salvas."),
      });
    }
  }

  async function handleSave() {
    setLoading("save");
    setStatus(null);

    try {
      const result = await apiClient.saveSettings(form);

      if (!result.ok) {
        setStatus({ tone: "error", message: result.error });
        return;
      }

      setMaskedSettings(result.data);
      setForm((current) => ({ ...current, notionToken: "" }));
      setStatus({ tone: "success", message: "Configurações salvas com segurança." });
    } catch (error) {
      setStatus({
        tone: "error",
        message: getErrorMessage(error, "Não foi possível salvar as configurações."),
      });
    } finally {
      setLoading(null);
    }
  }

  async function handleListDatabases() {
    setLoading("databases");
    setStatus(null);

    try {
      if (form.notionToken?.trim()) {
        const saveResult = await apiClient.saveSettings(form);

        if (!saveResult.ok) {
          setStatus({ tone: "error", message: saveResult.error });
          return;
        }

        setMaskedSettings(saveResult.data);
        setForm((current) => ({ ...current, notionToken: "" }));
      }

      const result = await apiClient.listNotionDatabases();

      if (!result.ok) {
        setStatus({ tone: "error", message: result.error });
        return;
      }

      setDatabases(result.data);

      if (result.data.length === 0) {
        setStatus({
          tone: "warning",
          message: "Nenhuma database foi encontrada. Verifique se a database foi compartilhada com a integração do Notion.",
        });
        return;
      }

      setStatus({ tone: "success", message: `${result.data.length} database(s) encontrada(s).` });
    } catch (error) {
      setStatus({
        tone: "error",
        message: getErrorMessage(
          error,
          "Não foi possível buscar suas databases. Confira o token do Notion e tente novamente.",
        ),
      });
    } finally {
      setLoading(null);
    }
  }

  async function handleTestConnection() {
    setLoading("test");
    setStatus(null);

    try {
      const result = await apiClient.testNotionConnection();

      if (!result.ok) {
        setStatus({ tone: "error", message: result.error });
        return;
      }

      setStatus({
        tone: "success",
        message: `Conexão validada com "${result.data.databaseTitle}".`,
      });
      await loadPropertiesSummary();
    } catch (error) {
      setStatus({
        tone: "error",
        message: getErrorMessage(error, "Não foi possível testar a conexão com o Notion."),
      });
    } finally {
      setLoading(null);
    }
  }

  async function loadPropertiesSummary() {
    const result = await apiClient.getNotionPropertiesSummary();

    if (result.ok) {
      setPropertiesSummary(result.data);
    }
  }

  return (
    <main className="flex-1 overflow-auto bg-transparent">
      <div className="mx-auto grid max-w-5xl gap-6 px-8 py-8">
        <header>
          <p className="text-sm font-medium text-muted">Configurações</p>
          <h2 className="mt-1 text-[28px] font-semibold leading-tight text-ink">Conexão com o Notion</h2>
        </header>

        <section className="grid gap-5 rounded-xl border border-white/75 bg-white/72 p-5 shadow-soft backdrop-blur-xl">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              autoComplete="off"
              hint={
                maskedSettings?.hasNotionToken
                  ? `Token salvo: ${maskedSettings.notionTokenMasked}`
                  : "Salve um token de integração interna do Notion."
              }
              label="Token do Notion"
              onChange={(event) => setForm((current) => ({ ...current, notionToken: event.target.value }))}
              placeholder="secret_..."
              type="password"
              value={form.notionToken ?? ""}
            />

            <Field
              label="Database ID"
              onChange={(event) => setForm((current) => ({ ...current, notionDatabaseId: event.target.value }))}
              placeholder="ID da database Transações > Movimentações"
              value={form.notionDatabaseId ?? ""}
            />
          </div>

          <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-ink">Databases disponíveis</h3>
                <p className="text-sm text-muted">Busque databases compartilhadas com a integração.</p>
              </div>
              <Button
                disabled={loading !== null}
                icon={loading === "databases" ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                onClick={handleListDatabases}
                variant="secondary"
              >
                Buscar databases
              </Button>
            </div>

            {databases.length > 0 ? (
              <select
                className="h-10 rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    notionDatabaseId: event.target.value,
                  }))
                }
                value={form.notionDatabaseId ?? ""}
              >
                <option value="">Selecione uma database</option>
                {databases.map((database) => (
                  <option key={database.id} value={database.id}>
                    {database.title} {database.object === "data_source" ? "(data source)" : "(database)"}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        </section>

        <section className="grid gap-5 rounded-xl border border-white/75 bg-white/72 p-5 shadow-soft backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Database size={18} />
            <h3 className="text-base font-semibold text-ink">Propriedades detectadas</h3>
          </div>

          {propertiesSummary ? (
            <div className="grid gap-2 md:grid-cols-2">
              {propertiesSummary.properties.map((property) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white/70 px-3 py-2 text-sm"
                  key={property.key}
                >
                  <span className="font-medium text-ink">{property.name}</span>
                  <span className="truncate text-muted">
                    {property.type ?? "não encontrada"}
                    {property.relatedDataSourceId ? " · relation" : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">
              Clique em `Testar conexão` para detectar automaticamente tipos e relações dos campos.
            </p>
          )}
        </section>

        {status ? (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              status.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : status.tone === "warning"
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {status.message}
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            disabled={loading !== null}
            icon={loading === "save" ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            onClick={handleSave}
            variant="secondary"
          >
            Salvar
          </Button>
          <Button
            disabled={loading !== null}
            icon={loading === "test" ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
            onClick={handleTestConnection}
          >
            Testar conexão
          </Button>
        </div>
      </div>
    </main>
  );
}
