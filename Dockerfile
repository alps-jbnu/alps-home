FROM node:8

# Create Directory for app
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install Dependencies
COPY package*.json ./
RUN npm install

# Add sources
COPY . .

# Bind
EXPOSE 3000

CMD [ "npm", "start" ]

