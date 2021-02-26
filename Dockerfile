FROM fedora:latest

# Copying all contents of rpmbuild repo inside container
COPY . .

RUN dnf install -y rpmdevtools dnf-utils tree && \
    dnf clean all && \
    rm -r -f /var/cache/*

RUN dnf module install nodejs:12

RUN npm install --production

ENTRYPOINT ["node", "/lib/main.js"]
