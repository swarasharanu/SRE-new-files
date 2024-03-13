FROM node

# Create an application directory
RUN mkdir -p /flipkart-backend

# The /app directory should act as the main application directory
WORKDIR /flipkart-backend

# Install Node Exporter
RUN apt-get update && \
    apt-get install -y curl && \
    curl -LO https://github.com/prometheus/node_exporter/releases/download/v1.7.0/node_exporter-1.7.0.linux-amd64.tar.gz && \
    tar xvf node_exporter-1.7.0.linux-amd64.tar.gz && \
    mv node_exporter-1.7.0.linux-amd64/node_exporter /usr/local/bin/ && \
    rm -rf node_exporter-1.7.0.linux-amd64*

# Copy the app package and package-lock.json file
COPY package*.json ./
# Install node packages
RUN npm install
RUN npm install express

# Copy or project directory (locally) in the current directory of our docker image (/app)
COPY backend/ ./backend/

# Build the app
#RUN npm run build

# Expose $PORT on container.
# We use a varibale here as the port is something that can differ on the environment.
EXPOSE $PORT
EXPOSE 9100

# Set host to localhost / the docker image
ENV NUXT_HOST=0.0.0.0

# Set app port
ENV NUXT_PORT=$PORT

# Set the base url
#ENV PROXY_API=$PROXY_API

# Set the browser base url
#ENV PROXY_LOGIN=$PROXY_LOGIN

# Start the app
CMD npm start & /usr/local/bin/node_exporter
#CMD [ "npm", "start" ]
