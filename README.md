# Bitespeed Backend Assignment

[Deployed Link](https://bitespeed-backend-1035275994520.us-west1.run.app)

## Index

- [Tech Stack](#tech-stack)
- [Run locally](#run-locally)

### Tech Stack

- Typescript
- Bun
- Express.js
- Prisma
- Docker
- PostgreSQL
- GCP Cloud Run

### Run locally

- Setup env variables according to [.env.example](./.env.example)

- Install packages

  - Using bun

  ```bash
  bun install
  ```

  - Using npm

  ```bash
  npm install
  ```

- Run  
  (If you're using npm, you'll need to change the scripts accordingly in [package.json](./package.json))

  - In dev mode
    - Using bun
      ```bash
      bun dev
      ```
    - Using npm
      ```bash
      npm run dev
      ```
  - In prod build
    - Using bun
      ```bash
      bun run build && bun start
      ```
    - Using npm
      ```bash
      npm run build && npm start
      ```
