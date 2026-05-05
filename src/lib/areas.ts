import areaMaster from "@/data/areas.json";

export type AreaMasterRecord = {
  code: string;
  name: {
    en: string;
    hi: string;
    pa: string;
  };
};

export const defaultAreaMaster: AreaMasterRecord[] = areaMaster;

export function normalizeAreaCode(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}
