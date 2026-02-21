import fastify from "fastify";

const server = fastify();

server.get("/ping", async () => {
  return { pong: true };
});

server.listen({ port: 3001, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
