# QualgenAssets - Asset Tracker

This is a full-stack asset tracking application built with Vue.js on the frontend and Node.js/Express on the backend, containerized with Docker for easy setup and deployment.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

Docker will handle all other dependencies, including Node.js, Nginx, and MySQL.

## Getting Started

Follow these instructions to get the project up and running on your local machine.

### 1. Clone the Repository

First, clone the project from its Git repository to your local machine.

```bash
git clone https://github.com/Gusify/QualgenAssets.git
cd QualgenAssets
```

### 2. Create the Environment File

The application uses a `.env` file at the root of the project to manage configuration for the database and server. Create a file named `.env` and paste the following content into it.

```env
# Server Configuration
PORT=4000
CORS_ORIGIN=http://localhost:8080

# Database Configuration
# This password is for the 'root' user of the MySQL container.
# Choose a secure password.
DB_ROOT_PASSWORD=your_super_secret_password
DB_NAME=asset_tracker
DB_USER=root
DB_HOST=db  # Use the service name from docker-compose.yml
DB_PORT=3306
```
**Note:** The `DB_HOST` is set to `db`, which is the service name of the MySQL container defined in `docker-compose.yml`. The server will connect to the database using this hostname within Docker's internal network.

### 3. Build and Run the Application with Docker

Once the `.env` file is configured, you can build and start all the services (frontend, backend, and database) using a single command:

```bash
docker-compose up -d --build
```
- `-d`: Runs the containers in detached mode (in the background).
- `--build`: Forces Docker to rebuild the images if there have been any changes to the `Dockerfile` or source code.

The initial build may take a few minutes as Docker downloads the necessary base images and installs dependencies.

## Usage

Once the containers are running, you can access the different parts of the application:

- **Frontend Application:** Open your web browser and navigate to **[http://localhost:8080](http://localhost:8080)**
- **Backend API:** The API server is running at `http://localhost:4000`
- **Database:** The MySQL database is accessible from your host machine on **port `3307`**. You can connect to it using a client like MySQL Workbench with the following credentials:
    - **Host:** `127.0.0.1`
    - **Port:** `3307`
    - **Username:** `root`
    - **Password:** The `DB_ROOT_PASSWORD` you set in your `.env` file.

## Project Structure

```
.
├── client/         # Contains the Vue.js frontend application
├── server/         # Contains the Node.js/Express backend API
├── .env            # Environment variables (you must create this)
└── docker-compose.yml # Orchestrates all the services
```

## Stopping the Application

To stop all running containers and remove the network, run the following command:

```bash
docker-compose down
```
This command will stop and remove the containers but will not delete the database volume, so your data will persist the next time you run `docker-compose up`.
