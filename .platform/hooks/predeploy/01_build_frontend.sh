#!/bin/bash

cd /var/app/staging/frontend

npm install
npm run build

cd /var/app/staging/backend

npm install