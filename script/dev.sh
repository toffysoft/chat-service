#!/bin/bash

if [ "$(docker ps -q -f name=redis)" ]; then
    echo redis is running...
    echo
else
    docker-compose up -d
    sleep 5
    echo
fi

npm run dev
