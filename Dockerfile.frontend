FROM nginx:1.27-alpine

# Remove default Nginx welcome page configuration
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom Nginx configuration with reverse proxy settings
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy frontend static HTML, CSS, JavaScript files
COPY index.html /usr/share/nginx/html/
COPY analysis.html /usr/share/nginx/html/
COPY history.html /usr/share/nginx/html/
COPY about.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/
COPY common.js /usr/share/nginx/html/

# Copy media and graphical assets
COPY assets/ /usr/share/nginx/html/assets/

# Set appropriate ownership and permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && chmod -R 755 /usr/share/nginx/html

# Expose HTTP port 80
EXPOSE 80

# Healthcheck for Nginx
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:80/ || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
