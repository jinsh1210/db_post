require("dotenv").config();
const express = require("express");
const db = require("./db");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");

const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride("_method"));

// 페이지당 게시물 수
const POSTS_PER_PAGE = 10;

// 게시판 목록 (페이지네이션, 검색 포함)
app.get("/", async (req, res) => {
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

// 게시물 작성 폼
app.get("/write", (req, res) => {
  res.render("write");
});

// 게시물 작성 처리
app.post("/posts", async (req, res) => {
  const { title, content, author, is_notice } = req.body;
  try {
    await db.query(
      "INSERT INTO posts (title, content, author, is_notice) VALUES (?, ?, ?, ?)",
      [title, content, author, is_notice === "on"]
    );
    res.redirect("/");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 게시물 상세보기 (조회수 증가)
app.get("/posts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // 조회수 증가
    await db.query("UPDATE posts SET views = views + 1 WHERE id = ?", [id]);

    // 게시물 조회
    const [[post]] = await db.query("SELECT * FROM posts WHERE id = ?", [id]);

    if (!post) {
      return res.status(404).send("게시물을 찾을 수 없습니다.");
    }

    res.render("view", { post });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 게시물 수정 폼
app.get("/posts/:id/edit", async (req, res) => {
  const { id } = req.params;
  try {
    const [[post]] = await db.query("SELECT * FROM posts WHERE id = ?", [id]);

    if (!post) {
      return res.status(404).send("게시물을 찾을 수 없습니다.");
    }

    res.render("edit", { post });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 게시물 수정 처리
app.put("/posts/:id", async (req, res) => {
  const { id } = req.params;
  const { title, content, author, is_notice } = req.body;
  try {
    await db.query(
      "UPDATE posts SET title = ?, content = ?, author = ?, is_notice = ? WHERE id = ?",
      [title, content, author, is_notice === "on", id]
    );
    res.redirect(`/posts/${id}`);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 게시물 삭제
app.delete("/posts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM posts WHERE id = ?", [id]);
    res.redirect("/");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
