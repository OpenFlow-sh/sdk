FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy server code
COPY server.py .
COPY README.md .

# Expose port
EXPOSE 8000

# Run the server
CMD ["python", "server.py"]