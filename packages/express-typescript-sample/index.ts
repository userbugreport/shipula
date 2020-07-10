import express from "express";
const app = express();
const port = process.env.PORT || 3000;

app.get("/", (_req, res) => {
  const message = `⛴🧛🏻‍♂️ - shipula says ${process.env.SAY} ${process.env.EXTRA}`;
  console.log(message);
  res.send(message);
});

app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);
