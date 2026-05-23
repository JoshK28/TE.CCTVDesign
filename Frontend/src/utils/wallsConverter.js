export const empty_Walls = { posts: [], links: [] };

export const parsePixelsPerMeter = (scaleText) => {
  if (typeof scaleText !== 'string') return null;
  const match = scaleText.trim().match(/^1\s*:\s*([\d.]+)$/);
  if (!match) return null;
  const value = Number.parseFloat(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
};

export const segmentLengthText = (x1, y1, x2, y2, pixelsPerMeter) => {
  if (!pixelsPerMeter) return null;
  const pixels = Math.hypot(x2 - x1, y2 - y1);
  const meters = pixels / pixelsPerMeter;
  return `${meters.toFixed(2)} m`;
};

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

const distanceToSegment = (s, px, py) => {
  const dx = s.x2 - s.x1;
  const dy = s.y2 - s.y1;
  const l2 = dx * dx + dy * dy;
  if (l2 < 1e-12) return Math.hypot(px - s.x1, py - s.y1);

  const t = Math.max(0, Math.min(1, ((px - s.x1) * dx + (py - s.y1) * dy) / l2));
  return Math.hypot(px - s.x1 - t * dx, py - s.y1 - t * dy);
};

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

const withLinks = (graph, links, excludePostId = null) => {
  const keep = new Set(links.flatMap((link) => [link.aPostId, link.bPostId]));
  return {
    ...graph,
    links,
    posts: (graph?.posts ?? []).filter((post) => post.id !== excludePostId && keep.has(post.id)),
  };
};

export const removeWallLink = (graph, linkId) => withLinks(graph, (graph?.links ?? []).filter((l) => l.id !== linkId));

export const removeWallPost = (graph, postId) =>
  withLinks(
    graph,
    (graph?.links ?? []).filter((l) => l.aPostId !== postId && l.bPostId !== postId),
    postId
  );

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
