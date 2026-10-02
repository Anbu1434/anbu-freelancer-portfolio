import { collections, getDb } from "@/lib/db/client";
import type { Settings } from "@/lib/db/schemas";

type SettingsDoc = Settings & { _id: string; updatedAt: Date };

const SETTINGS_ID = "site";

async function collection() {
  return (await getDb()).collection<SettingsDoc>(collections.settings);
}

export async function findSettings(): Promise<Settings | null> {
  const doc = await (await collection()).findOne({ _id: SETTINGS_ID });
  if (!doc) return null;
  const { _id: id, updatedAt, ...settings } = doc;
  void id;
  void updatedAt;
  return settings;
}

/** Replaces the settings document and returns the previous one (for image cleanup). */
export async function saveSettings(data: Settings) {
  const previous = await findSettings();
  await (await collection()).replaceOne({ _id: SETTINGS_ID }, { ...data, updatedAt: new Date() }, { upsert: true });
  return previous;
}
