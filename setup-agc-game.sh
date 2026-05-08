#!/bin/bash

# ==========================================================================
# AGC Game Portal Server Tuning Script (Apache + PHP 7.4 FPM)
# Optimized for High Traffic & Low Latency
# ==========================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting AGC Game Server Optimization...${NC}"

# 1. Check Root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}"
   exit 1
fi

# 2. Install Node.js and PM2
echo -e "${YELLOW}Checking Node.js and PM2...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js not found. Installing Node.js 20.x...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo -e "${GREEN}Node.js is already installed ($(node -v))${NC}"
fi

if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 not found. Installing PM2 globally...${NC}"
    npm install -g pm2
else
    echo -e "${GREEN}PM2 is already installed ($(pm2 -v))${NC}"
fi

# 3. Enable Required Apache Modules
echo -e "${YELLOW}Enabling Apache modules...${NC}"
a2enmod proxy_fcgi setenvif rewrite headers expires filter deflate proxy proxy_http
a2dismod mpm_worker mpm_prefork 2>/dev/null
a2enmod mpm_event
a2enconf php7.4-fpm

# 3. Tuning Apache MPM Event
# Path: /etc/apache2/mods-available/mpm_event.conf
echo -e "${YELLOW}Tuning Apache MPM Event...${NC}"
cat <<EOF > /etc/apache2/mods-available/mpm_event.conf
<IfModule mpm_event_module>
    ServerLimit              40
    StartServers             5
    MinSpareThreads          75
    MaxSpareThreads          250
    ThreadsPerChild          25
    MaxRequestWorkers        1000
    MaxConnectionsPerChild   10000
    AsyncRequestWorkerFactor 2
</IfModule>
EOF

# 4. Tuning PHP 7.4 FPM
# Path: /etc/php/7.4/fpm/pool.d/www.conf
echo -e "${YELLOW}Tuning PHP-FPM Pool (www)...${NC}"
PHP_FPM_CONF="/etc/php/7.4/fpm/pool.d/www.conf"

if [ -f "$PHP_FPM_CONF" ]; then
    # Backup
    cp "$PHP_FPM_CONF" "$PHP_FPM_CONF.bak"
    
    # Adjust performance settings
    sed -i "s/^pm = .*/pm = dynamic/" $PHP_FPM_CONF
    sed -i "s/^pm.max_children = .*/pm.max_children = 100/" $PHP_FPM_CONF
    sed -i "s/^pm.start_servers = .*/pm.start_servers = 20/" $PHP_FPM_CONF
    sed -i "s/^pm.min_spare_servers = .*/pm.min_spare_servers = 10/" $PHP_FPM_CONF
    sed -i "s/^pm.max_spare_servers = .*/pm.max_spare_servers = 30/" $PHP_FPM_CONF
    sed -i "s/^;pm.max_requests = .*/pm.max_requests = 1000/" $PHP_FPM_CONF
    
    # Memory and execution limits
    sed -i "s/^;php_admin_value\[memory_limit\] = .*/php_admin_value[memory_limit] = 256M/" $PHP_FPM_CONF
fi

# 5. Global Apache Optimization
echo -e "${YELLOW}Applying Global Apache Settings...${NC}"
cat <<EOF > /etc/apache2/conf-available/agc-optimization.conf
# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain text/html text/xml text/css application/xml application/xhtml+xml application/rss+xml application/javascript application/x-javascript
</IfModule>

# Caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/pdf "access plus 1 month"
    ExpiresByType text/x-javascript "access plus 1 month"
    ExpiresByType application/x-shockwave-flash "access plus 1 month"
    ExpiresByType image/x-icon "access plus 1 year"
    ExpiresDefault "access plus 2 days"
</IfModule>

# Performance Headers
Header set Connection keep-alive
EOF

a2enconf agc-optimization

# 6. Directory Permissions for /var/www/html
echo -e "${YELLOW}Setting permissions for /var/www/html...${NC}"
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html

# 7. Generate optimized .htaccess in /var/www/html
echo -e "${YELLOW}Creating optimized .htaccess in /var/www/html...${NC}"
cat <<EOF > /var/www/html/.htaccess
# Enable Rewrite Engine
RewriteEngine On
RewriteBase /

# Force HTTPS (optional - uncomment if needed)
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Caching and Performance
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresDefault "access plus 2 days"
    ExpiresByType image/x-icon "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType text/javascript "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>

# Handle PHP FPM via .htaccess (standard fallback)
<FilesMatch \.php$>
    SetHandler "proxy:unix:/run/php/php7.4-fpm.sock|fcgi://localhost"
</FilesMatch>
EOF

# 8. Setup Domain Layer (Catch-All Wildcard VirtualHost)
echo -e "${YELLOW}Cleaning up old Apache configurations...${NC}"
a2dissite agc-wildcard.conf > /dev/null 2>&1
rm -f /etc/apache2/sites-available/agc-wildcard.conf
rm -f /etc/apache2/sites-enabled/agc-wildcard.conf

echo -e "${YELLOW}Setting up Domain Layer Catch-All VirtualHost...${NC}"
cat <<EOF > /etc/apache2/sites-available/agc-wildcard.conf
<VirtualHost *:80>
    ServerName agc-engine.local
    ServerAlias *
    DocumentRoot /var/www/html

    # Performance Tuning (Anti-503)
    ProxyTimeout 60
    ProxyPreserveHost On
    ProxyStatus On
    
    <Directory /var/www/html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Allow Apache to serve from public folder
    <Directory /var/www/html/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Force HTTPS detection for Node.js
    RequestHeader set X-Forwarded-Proto "https"

    # Static files served directly by Apache from the public folder
    Alias /style.css /var/www/html/public/style.css
    Alias /js/ /var/www/html/public/js/
    Alias /img/ /var/www/html/public/img/
    Alias /favicon.svg /var/www/html/public/favicon.svg
    Alias /favicon.ico /var/www/html/public/favicon.ico

    ProxyPass /style.css !
    ProxyPass /js/ !
    ProxyPass /img/ !
    ProxyPass /favicon.ico !
    ProxyPass /favicon.svg !

    # Route to Node.js Engine (agc-game)
    ProxyPass / http://127.0.0.1:4100/
    ProxyPassReverse / http://127.0.0.1:4100/

    # Fallback for PHP (if Node is not used for specific paths)
    <FilesMatch \.php$>
        SetHandler "proxy:unix:/run/php/php7.4-fpm.sock|fcgi://localhost"
    </FilesMatch>

    # Custom Error Pages
    ErrorDocument 503 "Service Temporarily Unavailable - Please Refresh"
</VirtualHost>
EOF

# Enable the wildcard site and disable default if needed
a2ensite agc-wildcard
# a2dissite 000-default # Uncomment if you want to replace default completely

# 9. Restart Services
echo -e "${YELLOW}Restarting Apache and PHP-FPM...${NC}"
systemctl restart php7.4-fpm
systemctl restart apache2

echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}Optimization & Domain Layer Setup Completed!${NC}"
echo -e "${GREEN}Apache is now running with MPM Event + PHP 7.4 FPM${NC}"
echo -e "${GREEN}Domain Layer: ServerAlias * enabled${NC}"
echo -e "${GREEN}Location: /var/www/html${NC}"
echo -e "${GREEN}====================================================${NC}"

echo -e "${YELLOW}HOW TO MANAGE YOUR AGC PROJECT:${NC}"
echo -e "${GREEN}1. Start the AGC Engine with Memory Limit (Recommended for 1GB RAM):${NC}"
echo -e "   pm2 start src/server.mjs --name agc-game --node-args='--max-old-space-size=768'"
echo -e "   pm2 save"
echo -e "   pm2 startup"
echo -e ""
echo -e "${GREEN}2. Restart the AGC Engine (After code changes):${NC}"
echo -e "   pm2 restart agc-game"
echo -e ""
echo -e "${GREEN}3. Check Real-time Logs:${NC}"
echo -e "   pm2 logs agc-game"
echo -e ""
echo -e "${GREEN}4. Monitor System Performance:${NC}"
echo -e "   pm2 monit"
echo -e ""
echo -e "${YELLOW}SERVER MAINTENANCE:${NC}"
echo -e "- Restart Apache:  ${GREEN}systemctl restart apache2${NC}"
echo -e "- Restart PHP:     ${GREEN}systemctl restart php7.4-fpm${NC}"
echo -e "- Check App Port:  ${GREEN}netstat -tulpn | grep 4100${NC}"
echo -e ""
echo -e "${GREEN}Your Domain Layer is now ready! Point your A-Records and start earning.${NC}"
echo -e "${GREEN}====================================================${NC}"
