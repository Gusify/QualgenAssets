# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage caching
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application's source code
COPY . .

# Build TypeScript code
RUN npm run build

# Your app binds to port 4000, so expose it
EXPOSE 4000

# Define the command to run your app
CMD [ "npm", "start" ]
