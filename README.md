# aws-beanstalk-demo

React (Vite) frontend served by an Express backend, deployed to AWS Elastic Beanstalk with AWS CDK.

## Layout

```
frontend/     Vite + React app
backend/      Express server (serves the built frontend)
infra/        AWS CDK stack for Elastic Beanstalk
.platform/    Beanstalk predeploy hook (builds frontend, installs backend deps)
```

The backend exposes `GET /health` and otherwise serves `frontend/dist`.

## Local

Requires Node.js 24.

```bash
cp backend/.env.example backend/.env
npm run build
npm start
```

The API listens on `PORT` from `backend/.env` (default `3000` locally, `8080` if unset).

Frontend only:

```bash
cd frontend
npm install
npm run dev
```

## Deploy

The CDK stack creates an Elastic Beanstalk application and a **single-instance** environment:

- Platform: Node.js 24 on Amazon Linux 2023
- Instance: `t3.micro` Spot
- No load balancer
- Beanstalk still uses an Auto Scaling group with min/max of 1 (replaces the instance if it dies)

On the instance, `.platform/hooks/predeploy/01_build_frontend.sh` runs `npm install` / `npm run build` in `frontend`, then `npm install` in `backend`. The platform then starts the app with the root `npm start` script.

```bash
cd infra
npm install
npx cdk bootstrap   # once per AWS account/region
npx cdk deploy
```

The stack output `Url` is the instance address (`http://<elastic-ip>`).

```bash
npx cdk destroy
```

Spot capacity can disappear; this setup is meant for a cheap demo, not production.
