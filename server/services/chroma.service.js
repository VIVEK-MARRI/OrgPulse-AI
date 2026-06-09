/**
 * chroma.service.js
 *
 * ChromaDB-compatible vector store backed by a local JSON file.
 * Interface mirrors what a real ChromaDB client would expose so it can be
 * swapped for the real `chromadb` package later without touching callers.
 *
 * Persistence: server/data/org-memory.json
 *
 * Collection schema per item:
 * {
 *   id, meeting_id, meeting_title, meeting_date,
 *   type, description, severity, owner, status,
 *   embedding: number[]
 * }
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync }               from 'fs';
import { join, dirname }            from 'path';
import { fileURLToPath }            from 'url';
import crypto                       from 'crypto';
import { cosineSimilarity }         from '../geminiHelper.js';

const __dir      = dirname(fileURLToPath(import.meta.url));
const DATA_DIR   = join(__dir, '..', 'data');
const STORE_FILE = join(DATA_DIR, 'org-memory.json');

// ── In-memory store (loaded once, kept hot) ─────────────────────────────────
let _store = null;

// Serialised write queue — prevents concurrent file writes
let _writeQueue = Promise.resolve();

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

async function load() {
  if (_store) return _store;
  await ensureDataDir();
  try {
    const raw = await readFile(STORE_FILE, 'utf8');
    _store = JSON.parse(raw);
    // Ensure both arrays exist
    _store.items    = _store.items    || [];
    _store.clusters = _store.clusters || [];
  } catch {
    _store = { items: [], clusters: [] };
  }
  return _store;
}

async function persist() {
  _writeQueue = _writeQueue.then(async () => {
    await ensureDataDir();
    await writeFile(STORE_FILE, JSON.stringify(_store, null, 2), 'utf8');
  });
  return _writeQueue;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Store (upsert) an item with its embedding vector.
 */
export async function storeItem(item, embedding) {
  await load();
  const idx = _store.items.findIndex(i => i.id === item.id);
  const record = { ...item, embedding };
  if (idx >= 0) _store.items[idx] = record;
  else          _store.items.push(record);
  await persist();
}

/**
 * Find items whose embedding similarity to `queryEmbedding` is >= threshold.
 * Returns array sorted by similarity DESC.
 */
export async function searchSimilar(queryEmbedding, threshold = 0.85, topK = 5) {
  await load();
  return _store.items
    .filter(item => Array.isArray(item.embedding) && item.embedding.length > 0)
    .map(item => ({
      ...item,
      similarity: cosineSimilarity(queryEmbedding, item.embedding),
    }))
    .filter(item => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

/** Return all stored items (without embedding vectors for brevity). */
export async function getAllItems() {
  await load();
  return _store.items.map(({ embedding, ...rest }) => rest);
}

/** Return all clusters. */
export async function getClusters() {
  await load();
  return _store.clusters;
}

/**
 * Create a new cluster seeded by one item.
 */
export async function createCluster(seedItem) {
  await load();
  const cluster = {
    cluster_id:       crypto.randomUUID(),
    occurrence_count: 1,
    first_seen:       seedItem.meeting_date || new Date().toISOString().slice(0, 10),
    last_seen:        seedItem.meeting_date || new Date().toISOString().slice(0, 10),
    related_items: [{
      id:            seedItem.id,
      meeting_id:    seedItem.meeting_id,
      meeting_title: seedItem.meeting_title,
      meeting_date:  seedItem.meeting_date,
      type:          seedItem.type,
      description:   seedItem.description,
      severity:      seedItem.severity,
      owner:         seedItem.owner,
    }],
    analysis: null,
  };
  _store.clusters.push(cluster);
  await persist();
  return cluster;
}

/**
 * Add an item reference to an existing cluster.
 * Deduplicates by item id.
 */
export async function addItemToCluster(clusterId, item) {
  await load();
  const cluster = _store.clusters.find(c => c.cluster_id === clusterId);
  if (!cluster) return null;

  const alreadyIn = cluster.related_items.some(r => r.id === item.id);
  if (!alreadyIn) {
    cluster.related_items.push({
      id:            item.id,
      meeting_id:    item.meeting_id,
      meeting_title: item.meeting_title,
      meeting_date:  item.meeting_date,
      type:          item.type,
      description:   item.description,
      severity:      item.severity,
      owner:         item.owner,
    });
    cluster.occurrence_count = cluster.related_items.length;

    // Keep last_seen as the most recent meeting date
    const dates = cluster.related_items
      .map(r => r.meeting_date)
      .filter(Boolean)
      .sort();
    cluster.first_seen = dates[0]  || cluster.first_seen;
    cluster.last_seen  = dates[dates.length - 1] || cluster.last_seen;
  }

  await persist();
  return cluster;
}

/** Save (overwrite) a full cluster object — used after AI analysis is attached. */
export async function upsertCluster(cluster) {
  await load();
  const idx = _store.clusters.findIndex(c => c.cluster_id === cluster.cluster_id);
  if (idx >= 0) _store.clusters[idx] = cluster;
  else          _store.clusters.push(cluster);
  await persist();
}

/** Wipe all stored data (used by tests / demo reset). */
export async function clearStore() {
  _store = { items: [], clusters: [] };
  await persist();
}
