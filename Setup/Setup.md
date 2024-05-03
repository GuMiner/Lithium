# Install packages
apt-get update
apt-get install htop supervisor ufw nginx vnstat jq
apt install python3.11-venv

# Setup default firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'

# Create user
adduser lithium
...

# Setup site folder
su lithium
cd ~
mkdir site
cd site

# Create Python environment
python3 -m venv .venv
source .venv/bin/activate

pip install Flask
pip install Flask-Assets
pip install Flask-Compress
pip install gunicorn

# Copy over necessary site folders and files
- /db
- /static
- /templates
- /pages
- app.py

# Verify that booting with guincorn appears to work
gunicorn -w 4 app:app

# Setup the nginx reverse proxy configuration (lithium.nginx)
nano /etc/nginx/sites-available/lithium
...
ln -s /etc/nginx/sites-available/lithium /etc/nginx/sites-enabled/
nginx -t # Test the config
systemctl restart nginx

# Restart gunicorn and verify the site is accessible and running
# Setup auto-run+boot config
nano /etc/supervisor/conf.d/lithium.conf
...
# Load and verify that lithium is running
supervisorctl reload
supervisorctl status

# Enable bandwidth monitoring and auto-shutdown
# Modified from https://blog.ezequiel-garzon.com/using-vnstat-to-shut-down-a-server
nano /root/bandwidth-limit.sh
...
chmod +x /root/bandwidth-limit.sh

# Run every 5th minute:
crontab -e

*/5 * * * * /root/bandwidth-limit.sh >> /var/log/bandwidth-limit.log 2>&1