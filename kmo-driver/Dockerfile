FROM python:3.12-slim

WORKDIR /app
COPY kmo-driver/ /app/

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

CMD ["python", "bootstrap.py"]
