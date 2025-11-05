const express = require("express");
const router = express.Router();
const db = require("../config/db");

// 게시물 작성 폼
router.get("/write", (req, res) => {
  res.render("write");
});

// 게시물 작성 처리
router.post("/posts", async (req, res) => {
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
router.get("/posts/:id", async (req, res) => {
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
router.get("/posts/:id/edit", async (req, res) => {
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
router.put("/posts/:id", async (req, res) => {
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
router.delete("/posts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM posts WHERE id = ?", [id]);
    res.redirect("/");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
