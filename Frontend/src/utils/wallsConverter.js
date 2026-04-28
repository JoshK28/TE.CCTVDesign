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
