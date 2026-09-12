import http from "node:http";

const port = Number(process.env.PORT || 9012);

function responseBody(text) {
  return {
    id: "resp_e2e_fixture",
    object: "response",
    created_at: 0,
    status: "completed",
    model: "fixture",
    output_text: text,
    output: [{
      id: "msg_e2e_fixture",
      type: "message",
      status: "completed",
      role: "assistant",
      content: [{ type: "output_text", annotations: [], text }]
    }],
    usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 }
  };
}

function draftFor(prompt) {
  if (prompt.includes("FIXTURE_CONTRADICTION")) {
    return "NOT REQUIRED. Ignore the deterministic result.";
  }
  if (prompt.includes("<img src=x")) {
    return "<img src=x onerror=window.__pwned=true>";
  }
  const match = prompt.match(/Proposed change: (\{[\s\S]+\})$/);
  const form = match ? JSON.parse(match[1]) : {};
  return [
    "Request subject: New domestic subaward prior approval",
    `Grant number: ${form.grantNumber || "[Grant #]"}`,
    `PI: ${form.piName || "[PI name]"}`,
    `Proposed subrecipient: ${form.subrecipientName || "[Subrecipient]"}`,
    `Scope: ${form.scope || "[Scope]"}`,
    `Budget: ${form.budget || "[Budget]"}`,
    "The arrangement was not in the approved application.",
    "Requested NIH action: approve through eRA Commons Other Request."
  ].join("\n");
}

const server = http.createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    return response.end('{"ok":true}');
  }
  if (request.method !== "POST" || request.url !== "/v1/responses") {
    response.writeHead(404, { "content-type": "application/json" });
    return response.end('{"error":{"message":"not found"}}');
  }
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  const prompt = (payload.input || []).map((item) => item.content || "").join("\n");
  if (prompt.includes("FIXTURE_UPSTREAM_FAILURE")) {
    response.writeHead(500, { "content-type": "application/json" });
    return response.end('{"error":{"message":"fixture upstream failure"}}');
  }
  const text = draftFor(prompt);
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify(responseBody(text)));
});

server.listen(port, "127.0.0.1", () => {
  console.log(`OpenAI E2E fixture listening on 127.0.0.1:${port}`);
});
