const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// test route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// chat API (mock response for now)
app.post("/chat", (req, res) => {
  const messages = req.body.messages;

  const lastMessage = messages[messages.length - 1].content;

  res.json({
    reply: "This is a mock response for: " + lastMessage,
    recommendations: [
      {
        name: "Sample SHL Test",
        test_type: "Aptitude",
        url: "https://www.shl.com"
      }
    ]
  });
});

app.listen(8000, () => {
  console.log("Server running on http://127.0.0.1:8000");
});