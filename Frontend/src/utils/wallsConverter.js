export const empty_Walls = { posts: [], links: [] };

export const wallToSegments = (wallGraph) => {
  const posts = wallGraph?.posts ?? [];
  const links = wallGraph?.links ?? [];
  const postID = new Map(posts.map((post) => [post.id, post]));
  return links
    .map((link) => {
      const a = postID.get(link.aPostId);
      const b = postID.get(link.bPostId);
      return a && b ? { id: link.id, x1: a.x, y1: a.y, x2: b.x, y2: b.y } : null;
    })
    .filter(Boolean);
};

export const closestLinkIdAt = (wallGraph, px, py, maxDist = 14) => {
  let bestId = null;
  let bestD = Infinity;
  for (const s of wallToSegments(wallGraph)) {
    let d;
    const { x1, y1, x2, y2 } = s;
    const dx = x2 - x1,
      dy = y2 - y1,
      l2 = dx * dx + dy * dy;
    if (l2 < 1e-12) d = Math.hypot(px - x1, py - y1);
    else {
      const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
      d = Math.hypot(px - x1 - t * dx, py - y1 - t * dy);
    }
    if (d <= maxDist && d < bestD) {
      bestD = d;
      bestId = s.id;
    }
  }
  return bestId;
};

export const removeWallLink = (graph, linkId) => {
  const links = (graph?.links ?? []).filter((l) => l.id !== linkId);
  const keep = new Set();
  for (const l of links) {
    keep.add(l.aPostId);
    keep.add(l.bPostId);
  }
  return { ...graph, links, posts: (graph?.posts ?? []).filter((p) => keep.has(p.id)) };
};

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
