FROM anjalohettiarachchi/docker-github-action-rpmbuild:latest

# Copying all contents of rpmbuild repo inside container
COPY . .

RUN npm install --production

ENTRYPOINT ["node", "/lib/main.js"]
