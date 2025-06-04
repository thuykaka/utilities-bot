FROM oven/bun AS build

WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lock bun.lock

RUN bun install

COPY ./src ./src

ENV NODE_ENV=production

RUN bun build --compile --external tesseract.js --minify-whitespace --minify-syntax --target bun --outfile server ./src/index.ts

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/node_modules node_modules
COPY --from=build /app/server server

ENV NODE_ENV=production

CMD ["./server"]