# Install packages
apt-get update
apt-get install htop supervisor ufw nginx vnstat jq
apt install python3.11-venv

## Setup default firewall
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

## Create Python environment
python3 -m venv .venv
source .venv/bin/activate

pip install Flask
pip install Flask-Assets
pip install Flask-Compress
pip install Flask-SocketIO
pip install gunicorn
pip install gevents

## Copy over necessary site folders and files
- /db
- /static
- /templates
- /pages
- app.py

## Verify that booting with guincorn appears to work
gunicorn -k gevent -w 1 app:app

# Setup the nginx reverse proxy configuration (lithium.nginx)
nano /etc/nginx/sites-available/lithium
...
(see lithium.nginx)
...

ln -s /etc/nginx/sites-available/lithium /etc/nginx/sites-enabled/

## Test+enable the config
nginx -t 
systemctl restart nginx

# Restart gunicorn and verify the site is accessible and running
# Setup auto-run+boot config
nano /etc/supervisor/conf.d/lithium.conf
...
(see lithium.conf)
...

## Load and verify that lithium is running
supervisorctl reload
supervisorctl status

# Enable bandwidth monitoring and auto-shutdown
# Modified from https://blog.ezequiel-garzon.com/using-vnstat-to-shut-down-a-server
nano /root/bandwidth-limit.sh
...
chmod +x /root/bandwidth-limit.sh
...

## Run every 5th minute:
crontab -e
...
*/5 * * * * /root/bandwidth-limit.sh >> /var/log/bandwidth-limit.log 2>&1
...

# Setup HTTPS
https://certbot.eff.org/instructions?ws=nginx&os=debiantesting
apt update
apt install snapd
snap install --classic certbot
certbot --nginx

(and finally)
'service nginx reload' so that cert renewals automatically reload 'nginx' to get the new cert.

# Enable TURN server for client-to-client optimization
apt-get install coturn
nano /etc/default/coturn
(Uncomment only line for autostart)

nano /etc/turnserver.conf
...
(turn.conf)
...
service coturn restart

## Allow through the firewall
ufw allow Turnserver

## Test it out
https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
turn:146.190.161.9:3478
