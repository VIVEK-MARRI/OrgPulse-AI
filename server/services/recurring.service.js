/**
 * recurring.service.js
 *
 * Orchestrates the full Recurring Issue Intelligence pipeline:
 *
 *   1. For each risk/escalation in an extraction:
 *        a. Generate embedding  (Gemini text-embedding-004)
 *        b. Search ChromaDB for similar items (threshold 0.85)
 *        c. Add to existing cluster  OR  create a new one
 *        d. Persist item + embedding
 *
 *   2. For every cluster with occurrence_count >= 2:
 *        Run AI analysis (Recurring Issue Intelligence Prompt)
 *        Attach analysis to cluster and save.
 *
 *   3. Return all clusters sorted by occurrence_count DESC.
 */

import { getEmbedding, callGemini }  from '../geminiHelper.js';
import {
  storeItem,
  searchSimilar,
  getAllItems,
  getClusters,
  createCluster,
  addItemToCluster,
  upsertCluster,
  clearStore,
} from './chroma.service.js';
import { buildRecurringPrompt }       from '../recurringPrompt.js';

const SIMILARITY_THRESHOLD = 0.85;

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Analyse a single meeting extraction for recurring issues.
 *
 * @param {object} extractionData - Full Stage-1 extraction JSON
 * @param {string} apiKey
 * @returns {Promise<object[]>} All clusters, sorted by occurrence_count DESC
 */
export async function analyzeForRecurring(extractionData, apiKey) {
  const { meeting = {}, risks = [], escalations = [] } = extractionData;

  const meetingId    = meeting.id    || `meeting_${Date.now()}`;
  const meetingTitle = meeting.title || 'Untitled Meeting';
  const meetingDate  = meeting.date  || new Date().toISOString().slice(0, 10);

  // Build a flat list of items to process
  const items = [
    ...risks.map((r, i) => ({
      id:            `${meetingId}_risk_${r.id || i}`,
      meeting_id:    meetingId,
      meeting_title: meetingTitle,
      meeting_date:  meetingDate,
      type:          'risk',
      description:   r.description || '',
      severity:      r.severity    || 'MEDIUM',
      owner:         r.owner       || null,
      status:        r.status      || 'OPEN',
    })),
    ...escalations.map((e, i) => ({
      id:            `${meetingId}_esc_${e.id || i}`,
      meeting_id:    meetingId,
      meeting_title: meetingTitle,
      meeting_date:  meetingDate,
      type:          'escalation',
      description:   e.description || '',
      severity:      e.severity    || 'MEDIUM',
      owner:         e.raised_by   || null,
      status:        e.status      || 'OPEN',
    })),
  ].filter(item => item.description.trim().length > 0);

  // ── Step 1: Embed + cluster each item ──────────────────────────────────────
  for (const item of items) {
    const text      = `${item.type}: ${item.description}`;
    const embedding = await getEmbedding(text, apiKey);

    // Search existing store
    const similar = await searchSimilar(embedding, SIMILARITY_THRESHOLD);

    if (similar.length > 0) {
      // Find which cluster owns the most-similar item
      const clusters      = await getClusters();
      const topMatch      = similar[0];
      const ownerCluster  = clusters.find(c =>
        c.related_items.some(r => r.id === topMatch.id)
      );

      if (ownerCluster) {
        await addItemToCluster(ownerCluster.cluster_id, item);
      } else {
        // Match found but no cluster owns it — create a fresh one
        await createCluster(item);
      }
    } else {
      // No similar item → brand-new cluster
      await createCluster(item);
    }

    // Always persist the item with its embedding
    await storeItem(item, embedding);
  }

  // ── Step 2: AI analysis for clusters with >= 2 occurrences ─────────────────
  const allClusters = await getClusters();
  const allItems    = await getAllItems();

  const results = [];

  for (const cluster of allClusters) {
    if (cluster.occurrence_count >= 2) {
      // Enrich related_items with full metadata from store
      const enriched = cluster.related_items.map(ref => {
        const stored = allItems.find(i => i.id === ref.id);
        return stored ? { ...ref, ...stored } : ref;
      });

      const { system, user } = buildRecurringPrompt(cluster, enriched);

      try {
        const analysis = await callGemini(apiKey, system, user);
        cluster.analysis = { ...analysis, cluster_id: cluster.cluster_id };
        await upsertCluster(cluster);
      } catch (err) {
        console.error('[recurring] AI analysis error:', err.message);
        // Keep cluster without analysis rather than failing
      }
    }
    results.push(cluster);
  }

  // Return sorted: most-recurring first
  return results.sort((a, b) => b.occurrence_count - a.occurrence_count);
}

/**
 * Return all stored recurring issue clusters (with AI analysis where available).
 */
export async function getAllRecurringIssues() {
  const clusters = await getClusters();
  return clusters.sort((a, b) => b.occurrence_count - a.occurrence_count);
}

/**
 * Reset all stored organizational memory (for demo/testing).
 */
export async function resetMemory() {
  await clearStore();
}
