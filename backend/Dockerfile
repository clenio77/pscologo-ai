FROM python:3.9-slim

WORKDIR /app

# Install system dependencies for audio and postgres
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir gunicorn psycopg2-binary

COPY . .

# Expose port and run Gunicorn
EXPOSE 5000
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "app:app"]
