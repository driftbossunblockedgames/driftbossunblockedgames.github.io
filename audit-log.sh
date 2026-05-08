#!/bin/bash

# Server Traffic Audit Script
# Digunakan untuk menganalisis log Apache dan melihat penyebab server berat

LOG_FILE="/var/log/apache2/access.log"
# Gunakan file log yang ada jika file utama kosong (misal access.log.1)
if [ ! -s "$LOG_FILE" ]; then
    LOG_FILE="/var/log/apache2/access.log.1"
fi

echo "================================================="
echo "   SERVER TRAFFIC AUDIT - $(date)"
echo "================================================="
echo "Log File: $LOG_FILE"
echo ""

# 1. Top 10 IP Addresses (Siapa yang paling banyak akses)
echo "[1] TOP 10 IP ADDRESSES (Potential Bots/Crawlers)"
awk '{print $1}' "$LOG_FILE" | sort | uniq -c | sort -nr | head -n 10
echo ""

# 2. Top 20 Most Requested URLs (Apa yang paling banyak dibuka)
echo "[2] TOP 20 MOST REQUESTED URLS"
awk '{print $7}' "$LOG_FILE" | sort | uniq -c | sort -nr | head -n 20
echo ""

# 3. Top 10 User Agents (Bot apa yang sedang running)
echo "[3] TOP 10 USER AGENTS (Detecting Scrapers)"
awk -F'\"' '{print $6}' "$LOG_FILE" | sort | uniq -c | sort -nr | head -n 10
echo ""

# 4. Traffic by File Type (Gambar vs HTML)
echo "[4] TRAFFIC BY FILE TYPE"
echo "Images (webp/png/jpg): $(grep -E "\.(webp|png|jpg|jpeg)" "$LOG_FILE" | wc -l) hits"
echo "Sitemaps (xml): $(grep "\.xml" "$LOG_FILE" | wc -l) hits"
echo "HTML/Dynamic: $(grep -vE "\.(webp|png|jpg|jpeg|css|js|xml|svg)" "$LOG_FILE" | wc -l) hits"
echo ""

# 5. Slowest Requests (Jika log Apache dikonfigurasi mencatat waktu, defaultnya tidak)
# Sebagai alternatif, cek log PM2 untuk data [SLOW] dari skrip Node.js
echo "[5] RECENT SLOW REQUESTS (From Node.js logs via PM2)"
pm2 logs rebuild-ozo-lite --lines 50 --nostream | grep "\[SLOW\]" | tail -n 10

echo ""
echo "================================================="
echo "Audit Selesai. Gunakan 'pm2 logs' untuk memantau real-time."
