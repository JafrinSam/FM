FROM savonet/liquidsoap:73a1bac

# Install ffmpeg explicitly (some tags omit it)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /radio

EXPOSE 1234

CMD ["liquidsoap", "/radio/radio.liq"]
