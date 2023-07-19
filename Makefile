# Makefile for Dockerizing the Node.js application

# Build the Docker image for development
build:
	@docker build -t dev_kziso_backend .

install:
	@docker exec -it <dev_kziso_backend> sh -c "rm -rf /app/node_modules"
	@docker exec -it <dev_kziso_backend> sh -c "npm install"

# Run the development server
server:
	@docker run -it -p 3001:3001 -v $(PWD):/app -w /app dev_kziso_backend npm run dev

# Build the Docker image for production
build-production:
	@docker build -t prod_kziso_backend -f Dockerfile.production .

# Start the production server
start:
	@docker run -d -p 3001:3001 prod_kziso_backend

# Clean up (remove) the built Docker images and containers
clean:
	@docker stop $$(docker ps -a -q) || true
	@docker rm $$(docker ps -a -q) || true
	@docker rmi dev_kziso_backend prod_kziso_backend|| true
