import { Client } from "@notionhq/client";
import { TransactionsSchema, type Transaction } from "../schemas/transaction.schema";
import { type Settings } from "../schemas/settings.schema";

export type NotionConnectionResult = {
  databaseTitle: string;
};

export type NotionDatabaseOption = {
  id: string;
  title: string;
  object: "data_source" | "database";
};

export type ImportResult = {
  imported: number;
  failed: number;
};

type NotionOptionPropertyType = "select" | "status" | "multi_select";

type CategoryPropertyInfo =
  | { type: NotionOptionPropertyType }
  | { type: "relation"; dataSourceId: string };

type ListPropertyOptionsResult = {
  categoryOptions: string[];
  bankOptions: string[];
  investmentOptions: string[];
};

type NotionPropertySummary = {
  key: keyof Settings["notionProperties"];
  name: string;
  type: string | null;
  relatedDataSourceId?: string;
};

type NotionPropertiesSummary = {
  properties: NotionPropertySummary[];
};

type DataSourceTemplate = {
  id: string;
  name: string;
  is_default: boolean;
};

function createClient(settings: Settings): Client {
  return new Client({
    auth: settings.notionToken,
    timeoutMs: 15_000,
  });
}

function createClientWithToken(token: string): Client {
  return new Client({
    auth: token,
    timeoutMs: 15_000,
  });
}

function getTitle(item: any): string {
  if (!Array.isArray(item.title)) return "Sem nome";

  const title = item.title.map((text: { plain_text?: string }) => text.plain_text ?? "").join("");
  return title || "Sem nome";
}

function assertProperties(container: any, settings: Settings): void {
  const properties = container.properties ?? {};
  const expected = [
    { key: settings.notionProperties.realized, type: "checkbox" },
    { key: settings.notionProperties.date, type: "date" },
    { key: settings.notionProperties.name, type: "title" },
    { key: settings.notionProperties.type, type: "select" },
    { key: settings.notionProperties.amount, type: "number" },
  ];

  for (const property of expected) {
    const notionProperty = properties[property.key];

    if (!notionProperty) {
      throw new Error(`A propriedade "${property.key}" não existe na database selecionada.`);
    }

    if (notionProperty.type !== property.type) {
      throw new Error(`A propriedade "${property.key}" precisa ser do tipo ${property.type}.`);
    }
  }

  getCategoryPropertyInfo(properties, settings.notionProperties.category);
  getCategoryPropertyInfo(properties, settings.notionProperties.bank);
  getOptionalProperty(properties, settings.notionProperties.expectedAmount);
  getOptionalProperty(properties, settings.notionProperties.realizedAmount);
}

function getOptionalProperty(properties: Record<string, any>, propertyName: string): any | null {
  return properties[propertyName] ?? null;
}

function getCategoryPropertyInfo(
  properties: Record<string, any>,
  propertyName: string,
): CategoryPropertyInfo {
  const property = properties[propertyName];

  if (!property) {
    throw new Error(`A propriedade "${propertyName}" não existe na database selecionada.`);
  }

  if (property.type === "select" || property.type === "status" || property.type === "multi_select") {
    return { type: property.type };
  }

  if (property.type === "relation" && property.relation?.data_source_id) {
    return {
      type: "relation",
      dataSourceId: property.relation.data_source_id,
    };
  }

  throw new Error(
    `A propriedade "${propertyName}" precisa ser do tipo relation, select, status ou multi_select. Tipo atual: ${property.type}.`,
  );
}

function mapOptionProperty(type: NotionOptionPropertyType, name: string) {
  if (type === "status") {
    return {
      status: {
        name,
      },
    };
  }

  if (type === "multi_select") {
    return {
      multi_select: [
        {
          name,
        },
      ],
    };
  }

  return {
    select: {
      name,
    },
  };
}

function mapTransactionToProperties(
  transaction: Transaction,
  settings: Settings,
  categoryPropertyInfo: CategoryPropertyInfo,
  bankPropertyInfo: CategoryPropertyInfo,
  investmentPropertyInfo: CategoryPropertyInfo,
  categoryRelationPageId?: string,
  bankRelationPageId?: string,
  investmentRelationPageId?: string,
) {
  const properties: Record<string, unknown> = {
    [settings.notionProperties.realized]: {
      checkbox: transaction.realized,
    },
    [settings.notionProperties.date]: {
      date: {
        start: transaction.date,
      },
    },
    [settings.notionProperties.name]: {
      title: [
        {
          text: {
            content: transaction.name,
          },
        },
      ],
    },
    [settings.notionProperties.type]: {
      select: {
        name: transaction.type,
      },
    },
    [settings.notionProperties.amount]: {
      number: transaction.amount,
    },
    [settings.notionProperties.bank]:
      bankPropertyInfo.type === "relation"
        ? {
            relation: bankRelationPageId ? [{ id: bankRelationPageId }] : [],
          }
        : mapOptionProperty(bankPropertyInfo.type, transaction.bank),
    [settings.notionProperties.category]:
      categoryPropertyInfo.type === "relation"
        ? {
            relation: categoryRelationPageId ? [{ id: categoryRelationPageId }] : [],
          }
        : mapOptionProperty(categoryPropertyInfo.type, transaction.category),
  };

  if (transaction.investment?.trim()) {
    properties[settings.notionProperties.investment] =
      investmentPropertyInfo.type === "relation"
        ? {
            relation: investmentRelationPageId ? [{ id: investmentRelationPageId }] : [],
          }
        : mapOptionProperty(investmentPropertyInfo.type, transaction.investment);
  }

  return properties;
}

function addOptionalNumberProperties(
  properties: Record<string, unknown>,
  container: any,
  settings: Settings,
  transaction: Transaction,
): Record<string, unknown> {
  const containerProperties = container.properties ?? {};
  const notionAmount = Math.abs(transaction.amount);
  const notionRealizedAmount = Math.abs(transaction.realizedAmount);
  const notionExpectedAmount =
    transaction.expectedAmount === null ? null : Math.abs(transaction.expectedAmount);
  const expectedAmountProperty = getOptionalProperty(
    containerProperties,
    settings.notionProperties.expectedAmount,
  );
  const realizedAmountProperty = getOptionalProperty(
    containerProperties,
    settings.notionProperties.realizedAmount,
  );

  if (expectedAmountProperty?.type === "number") {
    properties[settings.notionProperties.expectedAmount] = {
      number: notionExpectedAmount,
    };
  }

  if (realizedAmountProperty?.type === "number") {
    properties[settings.notionProperties.realizedAmount] = {
      number: notionRealizedAmount,
    };
  }

  properties[settings.notionProperties.amount] = {
    number: notionAmount,
  };

  return properties;
}

export const notionService = {
  async testConnection(settings: Settings): Promise<NotionConnectionResult> {
    const notion = createClient(settings);
    const container = await retrieveNotionContainer(notion, settings.notionDatabaseId);

    assertProperties(container, settings);

    return {
      databaseTitle: getTitle(container),
    };
  },

  async listDatabases(settings: Pick<Settings, "notionToken">): Promise<NotionDatabaseOption[]> {
    if (!settings.notionToken) {
      throw new Error("Salve o token do Notion antes de buscar suas databases.");
    }

    const notion = createClientWithToken(settings.notionToken);
    return searchNotionContainers(notion, "data_source");
  },

  async listCategoryOptions(settings: Settings): Promise<string[]> {
    const notion = createClient(settings);
    const container = await retrieveNotionContainer(notion, settings.notionDatabaseId);
    const categoryPropertyInfo = getCategoryPropertyInfo(
      container.properties ?? {},
      settings.notionProperties.category,
    );

    if (categoryPropertyInfo.type === "relation") {
      return listRelationPageTitles(notion, categoryPropertyInfo.dataSourceId);
    }

    const categoryProperty = container.properties?.[settings.notionProperties.category];

    return (categoryProperty[categoryPropertyInfo.type]?.options ?? [])
      .map((option: { name?: string }) => option.name)
      .filter((name: unknown): name is string => typeof name === "string" && name.length > 0);
  },

  async listPropertyOptions(settings: Settings): Promise<ListPropertyOptionsResult> {
    const notion = createClient(settings);
    const container = await retrieveNotionContainer(notion, settings.notionDatabaseId);

    return {
      categoryOptions: await listPropertyOptionsFromContainer(
        notion,
        container,
        settings.notionProperties.category,
      ),
      bankOptions: await listPropertyOptionsFromContainer(
        notion,
        container,
        settings.notionProperties.bank,
      ),
      investmentOptions: await listPropertyOptionsFromContainer(
        notion,
        container,
        settings.notionProperties.investment,
      ),
    };
  },

  async getPropertiesSummary(settings: Settings): Promise<NotionPropertiesSummary> {
    const notion = createClient(settings);
    const container = await retrieveNotionContainer(notion, settings.notionDatabaseId);
    const properties = container.properties ?? {};

    return {
      properties: (Object.entries(settings.notionProperties) as Array<
        [keyof Settings["notionProperties"], string]
      >).map(([key, name]) => {
        const property = properties[name];

        return {
          key,
          name,
          type: property?.type ?? null,
          relatedDataSourceId:
            property?.type === "relation" ? property.relation?.data_source_id : undefined,
        };
      }),
    };
  },

  async importTransactions(settings: Settings, transactions: Transaction[]): Promise<ImportResult> {
    const parsedTransactions = TransactionsSchema.parse(transactions);
    const notion = createClient(settings);
    const container = await retrieveNotionContainer(notion, settings.notionDatabaseId);
    assertProperties(container, settings);
    const categoryPropertyInfo = getCategoryPropertyInfo(
      container.properties ?? {},
      settings.notionProperties.category,
    );
    const bankPropertyInfo = getCategoryPropertyInfo(
      container.properties ?? {},
      settings.notionProperties.bank,
    );
    const investmentPropertyInfo = getCategoryPropertyInfo(
      container.properties ?? {},
      settings.notionProperties.investment,
    );
    const categoryRelationIds =
      categoryPropertyInfo.type === "relation"
        ? await resolveRelationPageIds(
            notion,
            categoryPropertyInfo.dataSourceId,
            parsedTransactions.map((transaction) => transaction.category),
          )
        : new Map<string, string>();
    const bankRelationIds =
      bankPropertyInfo.type === "relation"
        ? await resolveRelationPageIds(
            notion,
            bankPropertyInfo.dataSourceId,
            parsedTransactions.map((transaction) => transaction.bank),
          )
        : new Map<string, string>();
    const investmentRelationIds =
      investmentPropertyInfo.type === "relation"
        ? await resolveRelationPageIds(
            notion,
            investmentPropertyInfo.dataSourceId,
            parsedTransactions
              .map((transaction) => transaction.investment)
              .filter((investment): investment is string => Boolean(investment?.trim())),
          )
        : new Map<string, string>();
    const templateIdsByType = await resolveTransactionTemplateIds(
      notion,
      settings.notionDatabaseId,
      parsedTransactions.map((transaction) => transaction.type),
    );
    let imported = 0;
    let failed = 0;

    for (const transaction of parsedTransactions) {
      try {
        const properties = addOptionalNumberProperties(
          mapTransactionToProperties(
            transaction,
            settings,
            categoryPropertyInfo,
            bankPropertyInfo,
            investmentPropertyInfo,
            categoryRelationIds.get(transaction.category),
            bankRelationIds.get(transaction.bank),
            transaction.investment ? investmentRelationIds.get(transaction.investment) : undefined,
          ),
          container,
          settings,
          transaction,
        );

        await notion.pages.create({
          parent: {
            data_source_id: settings.notionDatabaseId,
          },
          properties,
          template: {
            type: "template_id",
            template_id: templateIdsByType.get(transaction.type),
          },
        } as any);
        imported += 1;
      } catch {
        failed += 1;
      }
    }

    return { imported, failed };
  },
};

async function searchNotionContainers(
  notion: Client,
  object: "data_source",
): Promise<NotionDatabaseOption[]> {
  const response = await notion.search({
    filter: {
      property: "object",
      value: object,
    },
    page_size: 100,
  } as any);

  return response.results
    .filter((item: any) => item.object === object)
    .map((item: any) => ({
      id: item.id,
      title: getTitle(item),
      object,
    }));
}

function normalizeNotionName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

function getTemplateNameForType(type: Transaction["type"]): string {
  return type === "Entrada" ? "Nova Entrada" : "Nova Saída";
}

async function listDataSourceTemplates(
  notion: Client,
  dataSourceId: string,
): Promise<DataSourceTemplate[]> {
  const templates: DataSourceTemplate[] = [];
  let startCursor: string | undefined;

  do {
    const response = await (notion as any).dataSources.listTemplates({
      data_source_id: dataSourceId,
      page_size: 100,
      start_cursor: startCursor,
    });

    templates.push(...(response.templates ?? []));
    startCursor = response.next_cursor ?? undefined;
  } while (startCursor);

  return templates;
}

async function resolveTransactionTemplateIds(
  notion: Client,
  dataSourceId: string,
  transactionTypes: Transaction["type"][],
): Promise<Map<Transaction["type"], string>> {
  const requiredTypes = [...new Set(transactionTypes)];
  const templates = await listDataSourceTemplates(notion, dataSourceId);
  const templatesByName = new Map(
    templates.map((template) => [normalizeNotionName(template.name), template.id]),
  );
  const resolved = new Map<Transaction["type"], string>();

  for (const type of requiredTypes) {
    const templateName = getTemplateNameForType(type);
    const templateId = templatesByName.get(normalizeNotionName(templateName));

    if (!templateId) {
      throw new Error(
        `O template "${templateName}" não foi encontrado na data source selecionada. Confira se ele existe e está acessível para a integração.`,
      );
    }

    resolved.set(type, templateId);
  }

  return resolved;
}

async function listPropertyOptionsFromContainer(
  notion: Client,
  container: any,
  propertyName: string,
): Promise<string[]> {
  const propertyInfo = getCategoryPropertyInfo(container.properties ?? {}, propertyName);

  if (propertyInfo.type === "relation") {
    return listRelationPageTitles(notion, propertyInfo.dataSourceId);
  }

  const property = container.properties?.[propertyName];

  return (property[propertyInfo.type]?.options ?? [])
    .map((option: { name?: string }) => option.name)
    .filter((name: unknown): name is string => typeof name === "string" && name.length > 0)
    .sort((a: string, b: string) => a.localeCompare(b, "pt-BR"));
}

async function retrieveNotionContainer(notion: Client, id: string): Promise<any> {
  try {
    return await (notion as any).dataSources.retrieve({
      data_source_id: id,
    });
  } catch {
    return notion.databases.retrieve({
      database_id: id,
    });
  }
}

function getTitleFromPage(page: any): string {
  const titleProperty = Object.values(page.properties ?? {}).find(
    (property: any) => property?.type === "title",
  ) as any;

  return (
    titleProperty?.title
      ?.map((text: { plain_text?: string }) => text.plain_text ?? "")
      .join("")
      .trim() ?? ""
  );
}

function getTitlePropertyName(dataSource: any): string {
  const entry = Object.entries(dataSource.properties ?? {}).find(
    ([, property]: [string, any]) => property?.type === "title",
  );

  if (!entry) {
    throw new Error("Não encontramos uma propriedade Title na data source de categorias.");
  }

  return entry[0];
}

async function queryAllPages(notion: Client, dataSourceId: string): Promise<any[]> {
  const pages: any[] = [];
  let startCursor: string | undefined;

  do {
    const response = await (notion as any).dataSources.query({
      data_source_id: dataSourceId,
      page_size: 100,
      start_cursor: startCursor,
    });

    pages.push(...response.results);
    startCursor = response.next_cursor ?? undefined;
  } while (startCursor);

  return pages;
}

async function listRelationPageTitles(notion: Client, dataSourceId: string): Promise<string[]> {
  const pages = await queryAllPages(notion, dataSourceId);

  return pages
    .map(getTitleFromPage)
    .filter((title) => title.length > 0)
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

async function resolveRelationPageIds(
  notion: Client,
  dataSourceId: string,
  categories: string[],
): Promise<Map<string, string>> {
  const uniqueCategories = [...new Set(categories.map((category) => category.trim()).filter(Boolean))];
  const dataSource = await (notion as any).dataSources.retrieve({
    data_source_id: dataSourceId,
  });
  const titlePropertyName = getTitlePropertyName(dataSource);
  const existingPages = await queryAllPages(notion, dataSourceId);
  const pageIdsByTitle = new Map<string, string>();

  for (const page of existingPages) {
    const title = getTitleFromPage(page);

    if (title) {
      pageIdsByTitle.set(title.toLowerCase(), page.id);
    }
  }

  const resolved = new Map<string, string>();

  for (const category of uniqueCategories) {
    const existingId = pageIdsByTitle.get(category.toLowerCase());

    if (existingId) {
      resolved.set(category, existingId);
      continue;
    }

    const created = await notion.pages.create({
      parent: {
        data_source_id: dataSourceId,
      },
      properties: {
        [titlePropertyName]: {
          title: [
            {
              text: {
                content: category,
              },
            },
          ],
        },
      },
    } as any);

    resolved.set(category, created.id);
    pageIdsByTitle.set(category.toLowerCase(), created.id);
  }

  return resolved;
}
