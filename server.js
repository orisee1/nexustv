import express from "express";
import fetch from "node-fetch";

const app = express();

app.get("/proxy", async (req, res) => {
  try {
    const target = req.query.url;
    if (!target) return res.status(400).send("Missing url");

    // Cabeçalhos opcionais p/ provedores que exigem
    const upstream = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36",
        "Referer": "https://pluto.tv/" // ajuste conforme necessário
      }
    });

    // Propaga status e tipo
    res.status(upstream.status);
    const ct = upstream.headers.get("content-type");
    if (ct) res.set("content-type", ct);

    // CORS liberado
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "*");

    upstream.body.pipe(res);
  } catch (e) {
    res.status(500).send("Proxy error: " + e.message);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("Proxy rodando na porta " + PORT));
