# use official nodejs runtime
FROM node:22-alpine

#set working directory in container
WORKDIR /app

#copy package files to container
COPY package*.json .

#install dependencies
RUN npm install

#Copy rest of application code
COPY . .

#expose port the app runs on
EXPOSE 5000

#define command to run your application
CMD [ "node", "./src/server.js" ]