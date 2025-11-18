import { randomUUID } from 'crypto';
import { Shop } from '../models/shop';
import { getDatabase, nextId, persistDatabase } from '../storage/database';

export async function createShop(name: string): Promise<Shop> {
  const db = getDatabase();
  const shop: Shop = {
    id: nextId(db.shops),
    name: name.trim(),
    public_key: randomUUID(),
    created_at: new Date().toISOString(),
  };
  db.shops.push(shop);
  persistDatabase();
  return shop;
}

export async function getShopById(id: number): Promise<Shop | null> {
  const db = getDatabase();
  return db.shops.find((shop) => shop.id === id) ?? null;
}

export async function getShopByPublicKey(publicKey: string): Promise<Shop | null> {
  const db = getDatabase();
  return db.shops.find((shop) => shop.public_key === publicKey) ?? null;
}
