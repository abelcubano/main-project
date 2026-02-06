# 911-DC Deployment Guide

This guide covers deploying the 911-DC Datacenter Operations Platform on a CentOS 10 (or RHEL-based) server.

## Project Overview

The 911-DC platform is a full-stack application:

| Component | Technology | Location |
|-----------|------------|----------|
| Frontend | React + Vite + TypeScript | `client/` |
| Backend | Express.js + TypeScript | `server/` |
| Database | PostgreSQL + Drizzle ORM | `shared/schema.ts` |
| Email | Nodemailer (SMTP) | `server/email.ts` |

---

## Prerequisites

### 1. Install Node.js 20+

```bash
# Enable Node.js 20 module
dnf module enable nodejs:20
dnf install nodejs npm -y

# Verify installation
node --version   # Should be v20.x or higher
npm --version
```

### 2. Install PostgreSQL

```bash
# Install PostgreSQL
dnf install postgresql-server postgresql-contrib -y

# Initialize database
postgresql-setup --initdb

# Start and enable PostgreSQL
systemctl enable postgresql
systemctl start postgresql
```

### 3. Install Build Tools (if needed)

```bash
dnf groupinstall "Development Tools" -y
```

---

## Database Setup

### 1. Create Database User and Database

```bash
# Switch to postgres user
sudo -u postgres psql
```

Run the following SQL commands:

```sql
-- Create a dedicated user
CREATE USER dc911 WITH PASSWORD 'your_secure_password_here';

-- Create the database
CREATE DATABASE dc911db OWNER dc911;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE dc911db TO dc911;

-- Exit psql
\q
```

### 2. Configure PostgreSQL Authentication

Edit `/var/lib/pgsql/data/pg_hba.conf`:

```bash
sudo nano /var/lib/pgsql/data/pg_hba.conf
```

Add or modify the line for local connections to use password authentication:

```
# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
```

Restart PostgreSQL:

```bash
systemctl restart postgresql
```

### 3. Test Connection

```bash
psql -U dc911 -d dc911db -h localhost
# Enter password when prompted
# Type \q to exit
```

---

## Application Setup

### 1. Clone or Copy the Project

```bash
# If using Git
git clone https://github.com/your-username/911-dc.git
cd 911-dc

# Or copy files from your source
scp -r /path/to/project user@server:/var/www/911-dc
```

### 2. Install Dependencies

```bash
cd /var/www/911-dc
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
nano .env
```

Add the following variables:

```env
# Database Connection
DATABASE_URL=postgresql://dc911:your_secure_password_here@localhost:5432/dc911db

# Email Configuration (for dispatch notifications)
MAIL_PASSWORD=your_titan_email_password

# Optional: Node environment
NODE_ENV=production

# Optional: Custom port (default is 5000)
PORT=5000
```

Alternatively, export them in your shell or systemd service:

```bash
export DATABASE_URL="postgresql://dc911:your_secure_password_here@localhost:5432/dc911db"
export MAIL_PASSWORD="your_titan_email_password"
```

### 4. Initialize Database Schema

Push the Drizzle schema to create all tables:

```bash
npm run db:push
```

This creates the following tables:
- `users` - User accounts with bcrypt-hashed passwords and role-based access (admin/user)
- `services` - Customer services linked to users (colocation, SmartHands, connectivity, etc.)
- `invoices` - Customer invoices with totals, due dates, and status tracking
- `invoice_items` - Individual line items for each invoice
- `dispatch_requests` - SmartHands dispatch requests for datacenter operations

---

## Building for Production

### 1. Build the Application

```bash
npm run build
```

This creates:
- `dist/` - Compiled backend code
- `dist/public/` - Compiled frontend assets

### 2. Start the Application

```bash
npm start
```

The application will be available at `http://your-server-ip:5000`

---

## Production Deployment with systemd

### 1. Create a systemd Service

```bash
sudo nano /etc/systemd/system/911dc.service
```

First, create a dedicated service user:

```bash
# Create service user (no login shell)
sudo useradd -r -s /sbin/nologin dc911user

# Set ownership of application directory
sudo chown -R dc911user:dc911user /var/www/911-dc
```

Add the following content:

```ini
[Unit]
Description=911-DC Datacenter Operations Platform
After=network.target postgresql.service

[Service]
Type=simple
User=dc911user
Group=dc911user
WorkingDirectory=/var/www/911-dc
Environment=NODE_ENV=production
Environment=DATABASE_URL=postgresql://dc911:your_password@localhost:5432/dc911db
Environment=MAIL_PASSWORD=your_email_password
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 2. Enable and Start the Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable on boot
sudo systemctl enable 911dc

# Start the service
sudo systemctl start 911dc

# Check status
sudo systemctl status 911dc
```

### 3. View Logs

```bash
# Real-time logs
journalctl -u 911dc -f

# Recent logs
journalctl -u 911dc --since "1 hour ago"
```

---

## Nginx Reverse Proxy (Recommended)

### 1. Install Nginx

```bash
dnf install nginx -y
systemctl enable nginx
systemctl start nginx
```

### 2. Configure Nginx

```bash
sudo nano /etc/nginx/conf.d/911dc.conf
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Test and Reload Nginx

```bash
nginx -t
systemctl reload nginx
```

### 4. SSL with Certbot (Optional but Recommended)

```bash
# Install Certbot
dnf install certbot python3-certbot-nginx -y

# Obtain SSL certificate
certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

---

## Firewall Configuration

```bash
# Allow HTTP and HTTPS
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https

# Or allow specific port
firewall-cmd --permanent --add-port=5000/tcp

# Reload firewall
firewall-cmd --reload
```

---

## SELinux Configuration (CentOS/RHEL)

If SELinux is enforcing, you may need to allow Nginx to proxy to the Node.js app:

```bash
# Check SELinux status
getenforce

# Allow Nginx to connect to network services
setsebool -P httpd_can_network_connect 1

# If Node.js needs to bind to port 5000
semanage port -a -t http_port_t -p tcp 5000
```

To check for SELinux denials:

```bash
# View recent denials
ausearch -m avc -ts recent

# Generate policy if needed
audit2allow -a
```

---

## Email Configuration

The dispatch system uses SMTP via Titan Email. Configuration in `server/email.ts`:

| Setting | Value |
|---------|-------|
| Host | `smtp.titan.email` |
| Port | `465` |
| Security | SSL/TLS |
| Username | `dispatch@911-dc.com` |
| Password | Set via `MAIL_PASSWORD` environment variable |

To use a different email provider, modify `server/email.ts`:

```typescript
const transporter = nodemailer.createTransport({
  host: "your-smtp-server.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "your-email@example.com",
    pass: process.env.MAIL_PASSWORD,
  },
});
```

---

## Updating the Project

When code changes are made (on Replit or pushed to the Git repository), follow these steps on the production server to apply the update.

### Step 1: Back Up the Database (Recommended)

Before any update, create a database backup in case you need to roll back:

```bash
# Create the backups folder if it doesn't exist yet
mkdir -p /var/www/backups

pg_dump -U dc911 dc911db > /var/www/backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Pull the Latest Code

Navigate to the project folder and pull the latest changes:

```bash
cd /var/www/911-dc
git pull origin main
```

> If you are using a different branch, replace `main` with your branch name (e.g., `git pull origin master`).

If you see merge conflicts, resolve them before continuing. You can check the status with:

```bash
git status
```

### Step 3: Install Any New Dependencies

If `package.json` was updated with new libraries, install them:

```bash
npm install
```

### Step 4: Apply Database Changes (If Any)

If the database schema was modified (changes in `shared/schema.ts`), push the updated schema:

```bash
npm run db:push
```

This will create any new tables or columns without deleting existing data.

### Step 5: Rebuild the Application

Compile the frontend and backend for production:

```bash
npm run build
```

### Step 6: Restart the Service

Restart the application so the changes take effect:

```bash
sudo systemctl restart 911dc
```

### Step 7: Verify the Update

Check that the service is running correctly:

```bash
# Check service status
sudo systemctl status 911dc

# Check recent logs for errors
journalctl -u 911dc --since "5 minutes ago"
```

Open your browser and visit `http://your-domain.com` to confirm the site is working.

### Quick Update (All-in-One Command)

For routine updates where you just need to pull, install, build, and restart:

```bash
cd /var/www/911-dc && git pull origin main && npm install && npm run build && sudo systemctl restart 911dc
```

### Rolling Back an Update

If something goes wrong after an update, you can revert to the previous version:

```bash
# Go back to the previous commit
cd /var/www/911-dc
git log --oneline -5          # See recent commits
git checkout <previous_commit_hash> -- .

# Rebuild and restart
npm install
npm run build
sudo systemctl restart 911dc
```

To restore the database from a backup:

```bash
psql -U dc911 dc911db < /var/www/backups/backup_YYYYMMDD_HHMMSS.sql
```

---

## Maintenance Commands

```bash
# Check application status
systemctl status 911dc

# Restart application
systemctl restart 911dc

# Stop application
systemctl stop 911dc

# Database: View tables
psql -U dc911 -d dc911db -c "\dt"

# Database: Backup
pg_dump -U dc911 dc911db > backup_$(date +%Y%m%d).sql

# Database: Restore
psql -U dc911 dc911db < backup_20260204.sql
```

---

## Troubleshooting

### Application won't start

1. Check logs: `journalctl -u 911dc -n 50`
2. Verify environment variables are set
3. Test database connection manually
4. Ensure port 5000 is not in use: `lsof -i :5000`

### Database connection errors

1. Verify PostgreSQL is running: `systemctl status postgresql`
2. Check `DATABASE_URL` format
3. Ensure pg_hba.conf allows connections
4. Test connection: `psql -U dc911 -d dc911db -h localhost`

### Email not sending

1. Verify `MAIL_PASSWORD` is set correctly
2. Check SMTP credentials in email provider dashboard
3. Review server logs for SMTP errors
4. Test with a different email provider if needed

### Permission issues

```bash
# Fix ownership
chown -R www-data:www-data /var/www/911-dc

# Fix permissions
chmod -R 755 /var/www/911-dc
```

---

## Security Checklist

- [ ] Change default PostgreSQL password
- [ ] Use strong `MAIL_PASSWORD`
- [ ] Enable SSL/TLS with Certbot
- [ ] Configure firewall rules
- [ ] Set `NODE_ENV=production`
- [ ] Keep Node.js and dependencies updated
- [ ] Regular database backups
- [ ] Monitor logs for suspicious activity

---

## Support

For issues specific to this deployment, check:
- Application logs: `journalctl -u 911dc`
- Nginx logs: `/var/log/nginx/error.log`
- PostgreSQL logs: `/var/lib/pgsql/data/log/`

---

*911-DC Datacenter Operations Platform*
