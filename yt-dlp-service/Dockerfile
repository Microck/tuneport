FROM python:3.12-slim
RUN apt-get update && apt-get install -y ffmpeg curl unzip && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
ENV DATA_DIR=/data
ENV PATH="/usr/local/bin:$PATH"
RUN mkdir -p /data /config && chmod 777 /data /config
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]
