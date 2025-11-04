import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

// 1) Responder PRE-FLIGHT (OPTIONS) para file:// -> 127.0.0.1
app.options("/proxy", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Private-Network", "true"); // <- crucial p/ file://
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  return res.sendStatus(204);
});

// 2) Proxy HLS "streaming-safe"
app.use(
  "/proxy",
  createProxyMiddleware({
    target: "https://dummy.invalid", // será resolvido no router()
    changeOrigin: true,
    selfHandleResponse: false,

    router: (req) => {
      const u = new URL(req.query.url);
      return `${u.protocol}//${u.host}`;
    },

    pathRewrite: (path, req) => {
      const u = new URL(req.query.url);
      return u.pathname + (u.search || "");
    },

    onProxyReq: (proxyReq, req) => {
      proxyReq.setHeader(
        "User-Agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36"
      );
      proxyReq.setHeader("Referer", "https://pluto.tv/");
    },

    onProxyRes: (proxyRes) => {
      // CORS + PNA liberados na RESPOSTA
      proxyRes.headers["access-control-allow-origin"] = "*";
      proxyRes.headers["access-control-allow-headers"] = "*";
      proxyRes.headers["access-control-allow-methods"] = "GET,HEAD,OPTIONS";
      proxyRes.headers["access-control-allow-private-network"] = "true"; // <- crucial p/ file://
    },
  })
);

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Proxy HLS rodando em http://127.0.0.1:${PORT}/proxy?url=`);
});
