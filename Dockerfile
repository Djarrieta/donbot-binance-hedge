FROM oven/bun

# Set the timezone to Colombia (GMT-5)
ENV TZ=America/Bogota

WORKDIR /app
COPY . /app

# Update the system packages and install the timezone data package
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN bun install

CMD ["bun", "trade"]
