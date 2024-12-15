FROM oven/bun

# Set the timezone to Colombia (GMT-5)
ENV TZ=America/Bogota

WORKDIR /app
COPY . .

# Update the system packages and install the timezone data package
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Install dependencies
RUN bun install

# Create a volume for persisting database data
VOLUME ["/app/trade.db"]

CMD ["bun", "runTrade"]
