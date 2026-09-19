# ☁️ CodeSync Live - AWS Deployment Guide

Is guide mein **CodeSync Live** ko AWS EC2 / ECS instance par **Docker Compose** ke zariye production me deploy karne ki step-by-step jankari di gayi hai.

---

## 📋 Prerequisites
* AWS EC2 Instance (Ubuntu 22.04 LTS ya Amazon Linux 2023) - Minimum `t3.small` / `t2.medium`.
* Open Inbound Security Group Ports:
  * `80` (HTTP)
  * `443` (HTTPS)
  * `1234` (WebSocket Yjs Server)
  * `22` (SSH)

---

## 🚀 1-Click Deployment with Docker Compose

### Step 1: EC2 Instance me SSH login karein aur Docker install karein
```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose git
sudo systemctl enable --now docker
```

### Step 2: Repository Clone karein
```bash
git clone https://github.com/rajkishorock-arch/CodeSync-Live.git
cd CodeSync-Live
```

### Step 3: Containers Launch karein
```bash
sudo docker-compose up --build -d
```
* **Frontend**: `http://<YOUR_EC2_PUBLIC_IP>` (Port 80)
* **Backend WebSocket**: `ws://<YOUR_EC2_PUBLIC_IP>:1234`

---

## 🔐 Production SSL & Nginx Reverse Proxy (HTTPS / WSS)

Production mein Domain name aur SSL certificate (`https://` aur `wss://`) ke liye Nginx configuration:

### Nginx Config File (`/etc/nginx/sites-available/codesync`):
```nginx
server {
    listen 80;
    server_name codesync.yourdomain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket Reverse Proxy
    location /ws/ {
        proxy_pass http://localhost:1234/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

### Free SSL with Certbot:
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d codesync.yourdomain.com
```

---

## 🛠️ Useful Commands
* **Logs Dekhne Ke Liye**: `sudo docker-compose logs -f`
* **Restart Karne Ke Liye**: `sudo docker-compose restart`
* **Stop Karne Ke Liye**: `sudo docker-compose down`
