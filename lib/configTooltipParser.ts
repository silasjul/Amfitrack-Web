export interface ConfigItem {
  type: string;
  uid: number;
  config_mode: string;
  description: string;
}

export type ConfigCategory = Record<string, ConfigItem>;

export interface ParsedConfig {
  [categoryName: string]: ConfigCategory;
}

export interface ParseConfigOptions {
  /**
   * When false (default), skips reStructuredText `.. only:: …` blocks
   * (e.g. internal-only parameters) until the next non-indented line.
   */
  includeRstOnlyBlocks?: boolean;
}

/** Separator lines in the source docs (dashes or equals, long runs). */
const CATEGORY_RULE = /^={20,}$/;
const ITEM_RULE = /^-{20,}$/;
const RST_ONLY_DIRECTIVE = /^\.\.\s+only::\s+/i;

function normalizeMetadataKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "_");
}

/**
 * Normalize RST section heading names to match device-reported category names.
 * e.g. "Source 2 config" → "Source#2 config"
 */
function normalizeCategoryName(name: string): string {
  return name.replace(/\b(\w+)\s+(\d+)\b/g, "$1#$2");
}

function parseMetadataValue(key: string, raw: string): string | number {
  const value = raw.trim();
  if (key === "uid") {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? n : value;
  }
  return value;
}

type ItemDraft = {
  type: string;
  uid: number;
  config_mode: string;
  descriptionLines: string[];
};

function emptyDraft(): ItemDraft {
  return {
    type: "",
    uid: 0,
    config_mode: "",
    descriptionLines: [],
  };
}

function draftToItem(d: ItemDraft): ConfigItem {
  return {
    type: d.type,
    uid: d.uid,
    config_mode: d.config_mode,
    description: d.descriptionLines.join("\n"),
  };
}

/**
 * Parse configuration documentation text (section / item layout with
 * `| Type:` metadata lines) into a nested object: category → item name → fields.
 */
export function parseConfigToObject(
  text: string,
  options?: ParseConfigOptions,
): ParsedConfig {
  const includeRstOnlyBlocks = options?.includeRstOnlyBlocks === true;
  const lines = text.split(/\r?\n/);

  const result: ParsedConfig = {};
  let currentCategory: string | null = null;
  let currentItem: string | null = null;
  /** Draft for the item we are filling; mirrored into `result` for live updates. */
  let draft: ItemDraft | null = null;

  let inRstOnlyBlock = false;

  const assignDraftToResult = () => {
    if (currentCategory && currentItem && draft) {
      result[currentCategory][currentItem] = draftToItem(draft);
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (!includeRstOnlyBlocks) {
      if (RST_ONLY_DIRECTIVE.test(line)) {
        inRstOnlyBlock = true;
        continue;
      }
      if (inRstOnlyBlock) {
        if (line === "" || /^\s/.test(raw)) {
          continue;
        }
        inRstOnlyBlock = false;
      }
    }

    if (!line) {
      continue;
    }

    if (CATEGORY_RULE.test(line) && i > 0) {
      currentCategory = normalizeCategoryName(lines[i - 1].trim());
      if (!currentCategory) {
        continue;
      }
      result[currentCategory] ??= {};
      currentItem = null;
      draft = null;
      continue;
    }

    if (ITEM_RULE.test(line) && i > 0) {
      let titleIndex = i - 1;
      while (titleIndex >= 0 && lines[titleIndex].trim() === "") {
        titleIndex--;
      }
      if (titleIndex < 0) {
        continue;
      }

      assignDraftToResult();

      currentItem = lines[titleIndex].trim();
      if (!currentCategory || !currentItem) {
        draft = null;
        continue;
      }

      result[currentCategory] ??= {};
      draft = emptyDraft();
      result[currentCategory][currentItem] = draftToItem(draft);
      continue;
    }

    if (!currentCategory || !currentItem || !draft) {
      continue;
    }

    if (line.startsWith("| Type:")) {
      const parts = line
        .split("|")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      for (const part of parts) {
        const colonIndex = part.indexOf(":");
        if (colonIndex <= 0) {
          continue;
        }
        const rawKey = part.slice(0, colonIndex);
        const rawValue = part.slice(colonIndex + 1);
        const key = normalizeMetadataKey(rawKey);
        const value = parseMetadataValue(key, rawValue);

        if (key === "type") {
          draft.type = String(value);
        } else if (key === "uid") {
          draft.uid = typeof value === "number" ? value : 0;
        } else if (key === "config_mode") {
          draft.config_mode = String(value);
        }
      }
      result[currentCategory][currentItem] = draftToItem(draft);
      continue;
    }

    if (line.startsWith("|")) {
      const descLine = line.replace(/^\|\s*/, "").trim();
      if (descLine) {
        draft.descriptionLines.push(descLine);
        result[currentCategory][currentItem] = draftToItem(draft);
      }
    }
  }

  assignDraftToResult();

  return result;
}
