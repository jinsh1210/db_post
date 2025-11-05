const express = require("express");
const router = express.Router();
const db = require("../config/db");

// 페이지당 게시물 수
const POSTS_PER_PAGE = 10;

// 게시판 목록 (페이지네이션, 검색 포함)
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || "";
    const offset = (page - 1) * POSTS_PER_PAGE;

    // 검색 조건
    let whereClause = "";
    let params = [];

    if (search) {
      whereClause = "WHERE title LIKE ?";
      params.push(`%${search}%`);
    }

    // 전체 게시물 수 조회
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM posts ${whereClause}`,
      params
    );

    // 게시물 목록 조회 (공지사항 우선)
    const [posts] = await db.query(
      `SELECT id, title, author, views, created_at, is_notice
       FROM posts
       ${whereClause}
       ORDER BY is_notice DESC, created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, POSTS_PER_PAGE, offset]
    );

    const totalPages = Math.ceil(total / POSTS_PER_PAGE);

    res.render("list", {
      posts,
      currentPage: page,
      totalPages,
      search,
      total
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
