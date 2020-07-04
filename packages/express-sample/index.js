const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  const message = "⛴🧛🏻‍♂️ - shipula says 👋";
  console.log(message);
  res.send(message);
});

app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);
