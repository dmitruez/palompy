import { randomUUID } from 'crypto';
import { pool } from '../config/db';
import { Shop } from '../models/shop';

export async function createShop(name: string): Promise<Shop> {
  const publicKey = randomUUID();
  const { rows } = await pool.query<Shop>(
    `INSERT INTO shops (name, public_key) VALUES ($1, $2) RETURNING *`,
    [name, publicKey],
  );
  return rows[0];
}

export async function getShopById(id: number): Promise<Shop | null> {
  const { rows } = await pool.query<Shop>(`SELECT * FROM shops WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function getShopByPublicKey(publicKey: string): Promise<Shop | null> {
  const { rows } = await pool.query<Shop>(`SELECT * FROM shops WHERE public_key = $1`, [publicKey]);
  return rows[0] ?? null;
}
