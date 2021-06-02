#!/bin/bash

if [ -d ../client ]; then
    cd ../client && npm start
else
    cd client && npm start
fi
