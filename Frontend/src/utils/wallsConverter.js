// Helpers for the wall graph used on the design page.
//
// A wall graph is `{ posts: [{id,x,y}], links: [{id, aPostId, bPostId}] }`
// — a shared-vertex representation that makes editing (drag a post to move
// every wall touching it) trivial. The backend stores walls as flat
// segments, so segmentsToWallGraph / wallToSegments translate between the
// two shapes.

export const empty_Walls = { posts: [], links: [] };

// Parse a "1:N" scale string into pixels-per-metre. Returns null if the
// string is missing or malformed.
export const parsePixelsPerMeter = (scaleText) => {
  if (typeof scaleText !== 'string') return null;
  const match = scaleText.trim().match(/^1\s*:\s*([\d.]+)$/);
  if (!match) return null;
  const value = Number.parseFloat(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
};

// Format a segment's length as a metre value for on-canvas labels. Returns
// null when no pixels-per-metre scale is configured.
export const segmentLengthText = (x1, y1, x2, y2, pixelsPerMeter) => {
  if (!pixelsPerMeter) return null;
  const pixels = Math.hypot(x2 - x1, y2 - y1);
  const meters = pixels / pixelsPerMeter;
  return `${meters.toFixed(2)} m`;
};

// Flatten a wall graph into a list of {id, x1, y1, x2, y2} segments for
// rendering and ray-casting. Links that reference a missing post are skipped.
export const wallToSegments = (wallGraph) => {
  const posts = wallGraph?.posts ?? [];
  const links = wallGraph?.links ?? [];
  const byId = new Map(posts.map((post) => [post.id, post]));
  return links
    .map((link) => {
      const a = byId.get(link.aPostId);
      const b = byId.get(link.bPostId);
      return a && b ? { id: link.id, x1: a.x, y1: a.y, x2: b.x, y2: b.y } : null;
    })
    .filter(Boolean);
};

// Shortest distance from a point (px, py) to a line segment, used for the
// click-to-select threshold in edit mode.
const distanceToSegment = (s, px, py) => {
  const dx = s.x2 - s.x1;
  const dy = s.y2 - s.y1;
  const l2 = dx * dx + dy * dy;
  if (l2 < 1e-12) return Math.hypot(px - s.x1, py - s.y1);

  const t = Math.max(0, Math.min(1, ((px - s.x1) * dx + (py - s.y1) * dy) / l2));
  return Math.hypot(px - s.x1 - t * dx, py - s.y1 - t * dy);
};

// Return the id of the wall link closest to (px, py) within maxDist pixels,
// or null if no segment is close enough.
export const closestLinkIdAt = (wallGraph, px, py, maxDist = 14) => {
  let bestId = null;
  let bestD = Infinity;
  for (const s of wallToSegments(wallGraph)) {
    const d = distanceToSegment(s, px, py);
    if (d <= maxDist && d < bestD) {
      bestD = d;
      bestId = s.id;
    }
  }
  return bestId;
};

// Replace the graph's links and prune any posts that are no longer
// referenced (and optionally drop a specific post id). Used after deleting
// a link or post to keep the graph compact.
const withLinks = (graph, links, excludePostId = null) => {
  const keep = new Set(links.flatMap((link) => [link.aPostId, link.bPostId]));
  return {
    ...graph,
    links,
    posts: (graph?.posts ?? []).filter((post) => post.id !== excludePostId && keep.has(post.id)),
  };
};

// Remove a single wall segment by link id; orphaned posts are dropped.
export const removeWallLink = (graph, linkId) => withLinks(graph, (graph?.links ?? []).filter((l) => l.id !== linkId));

// Remove a post and every link that touched it.
export const removeWallPost = (graph, postId) =>
  withLinks(
    graph,
    (graph?.links ?? []).filter((l) => l.aPostId !== postId && l.bPostId !== postId),
    postId
  );

// Build a wall graph from a flat list of segments coming from the backend.
// Coincident endpoints are merged into a single shared post so that dragging
// a post in edit mode moves every wall meeting at that vertex together.
export const segmentsToWallGraph = (segments = []) => {
  const posts = [];
  const postIdByKey = new Map();
  const norm = (n) => Math.round(n * 1000) / 1000;
  const vertexId = (x, y) => {
    const key = `${norm(x)}:${norm(y)}`;
    let id = postIdByKey.get(key);
    if (id) return id;
    id = `post-${posts.length}`;
    posts.push({ id, x, y });
    postIdByKey.set(key, id);
    return id;
  };
  const links = segments.map((segment, i) => ({
    id: segment.id ?? `link-${i}`,
    aPostId: vertexId(segment.x1, segment.y1),
    bPostId: vertexId(segment.x2, segment.y2),
  }));
  return { posts, links };
};
