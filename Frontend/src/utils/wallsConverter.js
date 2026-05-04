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

export const segmentsToWallGraph = (segments = []) => {
  const posts = [];
  const postIdByKey = new Map();

  const vertexId = (x, y) => {
    const key = `${x}:${y}`;
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
