#!/bin/bash

git pull
sudo docker rm -f donbot-c
sudo docker rmi donbot-i
sudo docker build -t donbot-i .
sudo docker run -d --name donbot-c  -v ./trade.db:/app/trade.db  --restart=unless-stopped donbot-i
clear