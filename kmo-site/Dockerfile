FROM php:8.3-apache

RUN a2enmod headers rewrite \
 && printf '<Directory /var/www/html>\nOptions -Indexes\nAllowOverride All\nRequire all granted\n</Directory>\n' > /etc/apache2/conf-available/kmo.conf \
 && a2enconf kmo

COPY kmo-site/site.tar.gz.b64 /tmp/site.tar.gz.b64
RUN mkdir -p /var/www/html /data \
 && base64 -d /tmp/site.tar.gz.b64 | tar -xzf - -C /var/www/html \
 && rm /tmp/site.tar.gz.b64 \
 && mkdir -p /var/www/html/assets/img

COPY logo-kmo.png /var/www/html/assets/img/logo-kmo.png
COPY logo-kmo.png /var/www/html/assets/img/favicon.png

RUN chown -R www-data:www-data /var/www/html /data \
 && chmod -R 775 /var/www/html/storage /data

EXPOSE 80
