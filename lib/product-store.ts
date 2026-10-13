import { promises as fs } from "fs";
import path from "path";
import { BASE_PRODUCTS, Product } from "./products";
import { formatDoppelfitLink } from "./convert";

const FILE = path.join(process.cwd(), "data", "products.json");
const DELETED_FILE = path.join(process.cwd(), "data", "deleted_ids.json");

export async function readDeletedIds(): Promise<Set<string>> {
  try {
    const raw = await fs.readFile(DELETED_FILE, "utf8");
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export async function writeDeletedIds(ids: Set<string>): Promise<void> {
  await fs.writeFile(DELETED_FILE, JSON.stringify([...ids], null, 2), "utf8");
}

export async function readRawProducts(): Promise<Product[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeRawProducts(list: Product[]): Promise<void> {
  await fs.writeFile(FILE, JSON.stringify(list, null, 2), "utf8");
}

/**
 * Returns all active products: custom products from data/products.json + BASE_PRODUCTS,
 * deduplicated by ID and excluding any deleted product IDs.
 */
export async function getAllProducts(): Promise<Product[]> {
  const [extra, deletedIds] = await Promise.all([
    readRawProducts(),
    readDeletedIds(),
  ]);

  const extraIds = new Set(extra.map((p) => p.id));
  const baseFiltered = BASE_PRODUCTS.filter((p) => !extraIds.has(p.id));
  const combined = [...extra, ...baseFiltered];

  return combined.filter((p) => !deletedIds.has(p.id));
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const all = await getAllProducts();
  return all.find((p) => p.id === id);
}

export async function updateProduct(
  id: string,
  updates: Partial<Product>
): Promise<Product | null> {
  const extra = await readRawProducts();
  const deletedIds = await readDeletedIds();

  // If was previously deleted, un-delete it
  if (deletedIds.has(id)) {
    deletedIds.delete(id);
    await writeDeletedIds(deletedIds);
  }

  const existingIndex = extra.findIndex((p) => p.id === id);
  let updatedProduct: Product;

  const sanitizedUpdates: Partial<Product> = { ...updates };
  if (sanitizedUpdates.price !== undefined) {
    const p = parseFloat(String(sanitizedUpdates.price).replace(",", "."));
    if (!isNaN(p)) sanitizedUpdates.price = p;
  }
  if (sanitizedUpdates.doppelfitUrl) {
    sanitizedUpdates.doppelfitUrl = formatDoppelfitLink(sanitizedUpdates.doppelfitUrl);
  }

  if (existingIndex !== -1) {
    updatedProduct = {
      ...extra[existingIndex],
      ...sanitizedUpdates,
      id, // Preserve id
    };
    extra[existingIndex] = updatedProduct;
  } else {
    // Check if it was in BASE_PRODUCTS
    const baseP = BASE_PRODUCTS.find((p) => p.id === id);
    if (!baseP) {
      return null;
    }
    updatedProduct = {
      ...baseP,
      ...sanitizedUpdates,
      id,
    };
    extra.unshift(updatedProduct);
  }

  await writeRawProducts(extra);
  return updatedProduct;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const extra = await readRawProducts();
  const deletedIds = await readDeletedIds();

  const newExtra = extra.filter((p) => p.id !== id);
  const existedInExtra = newExtra.length !== extra.length;
  const existedInBase = BASE_PRODUCTS.some((p) => p.id === id);

  if (!existedInExtra && !existedInBase && !deletedIds.has(id)) {
    return false;
  }

  if (existedInExtra) {
    await writeRawProducts(newExtra);
  }

  // Always mark in deletedIds so it never resurfaces from BASE_PRODUCTS
  deletedIds.add(id);
  await writeDeletedIds(deletedIds);

  return true;
}
