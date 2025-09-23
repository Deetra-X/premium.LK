# Deployment Guide (VPS/cPanel – Node + MySQL)

This app is a Vite React frontend + Node/Express backend + MySQL. Below are two common deployment options. Use Option A for a VPS (root access). Use Option B for shared hosting with Node support.

---
## Option A — VPS (Ubuntu) with Nginx reverse proxy

1) SSH to server
- Get your server IP and SSH credentials from the provider.
- From your PC:
  - Windows PowerShell: `ssh username@your_server_ip`

2) Install system packages
```bash
sudo apt update
sudo apt install -y nginx curl git build-essential
```

3) Install Node.js LTS (via NodeSource)
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

4) Install PM2 (process manager)
```bash
sudo npm i -g pm2
pm2 -v
```

5) Clone your project
```bash
cd /var/www
sudo git clone <YOUR_REPO_URL> premium.lk
cd premium.lk
```

6) Create environment file
```bash
cp .env.example .env
nano .env
# Set DB_HOST/DB_USER/DB_PASSWORD/DB_NAME, PORT (e.g., 3001), CORS_ORIGINS (your site URL)
```

7) Install dependencies and build frontend
```bash
npm ci || npm i
npm run build
```

8) Start backend with PM2
```bash
pm2 start npm --name premiumlk-api -- run start
pm2 save
pm2 status
```

9) Configure Nginx (reverse proxy to Node and serve SSL later)
```bash
sudo nano /etc/nginx/sites-available/premiumlk
```
Paste:
```
server {
  listen 80;
  server_name your-domain.com www.your-domain.com;

  location /api/ {
    proxy_pass http://127.0.0.1:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  location / {
    root /var/www/premium.lk/dist;
    try_files $uri /index.html;
  }
}
```
Then:
```bash
sudo ln -s /etc/nginx/sites-available/premiumlk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

10) SSL with Let’s Encrypt (optional)
```bash
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Now browse to https://your-domain.com. The frontend is served by Nginx from `dist`, and `/api/*` is proxied to Node at port 3001.

---
## Option B — cPanel / Shared hosting supporting Node.js

Note: You need Node.js app support in cPanel (or a similar host that supports Node). If your plan doesn’t support Node, consider a VPS.

1) Zip and upload project
- Build locally: `npm run build` (creates `dist`)
- Upload the whole project (including `dist/`) via cPanel File Manager.

2) Create a Node.js App in cPanel
- Go to “Setup Node.js App”
- App directory: the folder where `package.json` lives
- Application startup file: `src/app.cjs`
- Node version: LTS
- Environment: set variables (PORT=3001, DB_*, CORS_ORIGINS)
- Create App

3) Install dependencies
- In the Node.js App panel, click “Run NPM Install”
- Or SSH: `npm ci` (or `npm i`)

4) Build frontend (if not built)
- `npm run build` in the app directory so `dist/` exists on the server

5) Expose the app
- If cPanel gives you an internal port (e.g., 35001), create a rewrite/proxy in `.htaccess` or use the provider’s “Proxy/Route” to map your domain/subdomain to the Node app port.
- Make sure the SPA files are served by the Node app (this repo already serves `dist/` in production) or by the web server pointing to `dist`.

6) Database
- Create MySQL DB and user in cPanel
- Update `.env` with DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
- Import any schema with your SQL files if required.

7) Test
- Open the domain/subdomain
- Visit `/api-status` to verify API routes
- Try `/test-db` to verify DB connection

---
## Troubleshooting

- 502/504 from Nginx: check `pm2 logs premiumlk-api` and `sudo journalctl -u nginx -f`
- CORS errors: ensure `CORS_ORIGINS` includes your domain (comma-separated if multiple)
- Blank frontend: ensure `npm run build` ran and `dist/` exists
- DB errors: confirm `.env` values and that the DB allows connections from the server IP

---
## Quick checklist
- [ ] .env configured (PORT, CORS_ORIGINS, DB_*)
- [ ] npm install and npm run build completed
- [ ] PM2 process started (VPS) or Node app created (cPanel)
- [ ] Nginx (VPS) or hosting proxy routes configured
- [ ] SSL enabled (Let’s Encrypt)
- [ ] API `/api-status` and `/test-db` return OK
